"""Source-specific value preparation over the shared streaming CSV reader."""

from datetime import date

from tools.adapters.csv_adapter import CSVSourceAdapter

BLS_FIELDS = {
    "series_id": "series_id",
    "month_start": "month_start",
    "value": "unemployment_rate_pct",
    "rate_fraction": "unemployment_rate_fraction",
    "footnote_codes": "footnote_codes",
}

COLLEGE_FIELDS = {
    "UNITID": "unitid",
    "INSTNM": "institution_name",
    "CITY": "city",
    "STABBR": "state_or_territory",
    "ZIP": "postal_code",
    "CONTROL": "control_code",
    "PREDDEG": "predominant_degree_code",
    "UGDS": "undergraduate_enrollment",
    "TUITIONFEE_IN": "in_state_tuition_fees_usd",
    "TUITIONFEE_OUT": "out_of_state_tuition_fees_usd",
    "tuition_difference": "out_of_state_tuition_difference_usd",
}

_COLLEGE_NULLS = {"", "NULL", "NA", "N/A", "PS", "PrivacySuppressed"}


def _bls_record(row):
    if row["series_id"] != "LNS14000000":
        raise ValueError("Expected BLS series LNS14000000.")
    period = row["period"]
    if len(period) != 3 or not period.startswith("M"):
        raise ValueError(f"Expected a BLS monthly period, got {period!r}.")
    month = date(int(row["year"]), int(period[1:]), 1)
    value = None if row["value"] in {"", "-"} else row["value"]
    return {
        "series_id": row["series_id"],
        "month_start": month.isoformat(),
        "value": value,
        "rate_fraction": None if value is None else float(value) / 100,
        "footnote_codes": row["footnote_codes"] or None,
    }


def _college_record(row):
    values = {field: row[field] for field in COLLEGE_FIELDS if field != "tuition_difference"}
    values = {k: None if v in _COLLEGE_NULLS else v for k, v in values.items()}
    if not values["UNITID"] or not values["UNITID"].isascii() or not values["UNITID"].isdigit():
        raise ValueError("Expected a numeric IPEDS UNITID.")
    in_state = values["TUITIONFEE_IN"]
    out_of_state = values["TUITIONFEE_OUT"]
    values["tuition_difference"] = (
        None if in_state is None or out_of_state is None
        else int(out_of_state) - int(in_state)
    )
    return values


class USPublicCSVSourceAdapter(CSVSourceAdapter):
    """Read raw CSV rows, prepare source values and attach collection metadata."""

    def __init__(self, format_name, manifest):
        self.format_name = format_name
        self.manifest = manifest
        self._prepare = {"bls_csv": _bls_record, "college_scorecard_csv": _college_record}[format_name]

    def iter_records(self, source):
        for position, row in enumerate(super().iter_records(source), start=1):
            try:
                prepared = self._prepare({k: v.strip() if v is not None else "" for k, v in row.items()})
            except (ValueError, KeyError) as exc:
                raise ValueError(f"{self.format_name} record {position}: {exc}") from exc
            yield {
                **prepared,
                "source": self.manifest["source_name"],
                "collection_batch": self.manifest["collection_batch"],
                "observed_at": self.manifest["retrieved_at"],
                "time_granularity": "monthly" if self.format_name == "bls_csv" else "snapshot",
            }
