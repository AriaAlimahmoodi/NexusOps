from tools.atomic_data_publisher import ingest_real_records_atomically


def manifest():
    return {
        "collection_batch": "atomic-test-2026-11-14",
        "source_name": "Atomic publisher test fixture",
        "source_url": "https://example.org/dataset",
        "publisher": "Test Publisher",
        "retrieved_at": "2026-11-14T09:00:00Z",
        "geographic_scope": "IR",
        "license": "CC-BY-NC-4.0",
        "collection_method": "test fixture",
        "limitations": "Synthetic test data only",
    }


def record(record_id="LM-001", **overrides):
    value = {
        "market_record_id": record_id,
        "skill": "Python",
        "demand_score": 4.2,
        "frequency": 100,
        "source": "https://example.org/record/1",
        "observed_at": "2026-11-14T09:00:00Z",
        "collection_batch": "atomic-test-2026-11-14",
        "time_granularity": "monthly",
    }
    value.update(overrides)
    return value


class FakeIndices:
    def __init__(self, client):
        self.client = client

    def exists_alias(self, name):
        return self.client.aliases.get(name) is not None

    def exists(self, index):
        return index in self.client.documents

    def get_alias(self, name):
        target = self.client.aliases[name]
        return {target: {"aliases": {name: {}}}}

    def get_mapping(self, index):
        return {index: {"mappings": self.client.mappings[index]}}

    def create(self, index, mappings):
        self.client.documents[index] = {}
        self.client.mappings[index] = mappings

    def refresh(self, index):
        return {"_shards": {"successful": 1}}

    def update_aliases(self, actions):
        for action in actions:
            if "remove" in action:
                item = action["remove"]
                if self.client.aliases.get(item["alias"]) == item["index"]:
                    del self.client.aliases[item["alias"]]
            elif "add" in action:
                item = action["add"]
                self.client.aliases[item["alias"]] = item["index"]
        return {"acknowledged": True}

    def delete(self, index):
        self.client.documents.pop(index, None)
        self.client.mappings.pop(index, None)


class FakeClient:
    def __init__(self, initial_index=None, initial_docs=None):
        self.aliases = {}
        self.documents = {}
        self.mappings = {}
        self.indices = FakeIndices(self)
        if initial_index:
            self.aliases["labor_market_real"] = initial_index
            self.documents[initial_index] = dict(initial_docs or {})
            self.mappings[initial_index] = {
                "dynamic": "strict",
                "properties": {"market_record_id": {"type": "keyword"}},
            }

    def reindex(self, source, dest, **kwargs):
        source_index = source["index"]
        target_index = dest["index"]
        copied = dict(self.documents[source_index])
        self.documents[target_index].update(copied)
        return {
            "created": len(copied),
            "updated": 0,
            "failures": [],
        }

    def count(self, index):
        return {"count": len(self.documents[index])}


def install_fake_bulk(monkeypatch, *, fail=False):
    def fake_bulk(client, actions, **kwargs):
        if fail:
            return 0, [{"index": {"status": 500, "error": "simulated failure"}}]
        for action in actions:
            client.documents[action["_index"]][action["_id"]] = action["_source"]
        return len(actions), []

    monkeypatch.setattr("tools.atomic_data_publisher.bulk", fake_bulk)


def test_first_atomic_publication_creates_stable_alias(monkeypatch):
    install_fake_bulk(monkeypatch)
    client = FakeClient()

    result = ingest_real_records_atomically(
        client, "labor_market", [record()], manifest(), batch_size=1
    )

    assert result["publication"] == "atomic_alias_switch"
    assert result["index"] == "labor_market_real"
    assert result["total_records"] == 1
    assert client.aliases["labor_market_real"] == result["physical_index"]
    assert "labor_market_real" not in client.documents
    assert len(client.documents[result["physical_index"]]) == 1
    mapping = client.mappings[result["physical_index"]]["properties"]
    assert mapping["source"] == {"type": "keyword"}
    assert mapping["observed_at"] == {"type": "date"}
    assert mapping["collection_batch"] == {"type": "keyword"}
    assert mapping["time_granularity"] == {"type": "keyword"}
    assert mapping["published_at"] == {"type": "date"}


def test_atomic_publication_copies_previous_version_and_retains_it(monkeypatch):
    install_fake_bulk(monkeypatch)
    old_index = "labor_market_real__v_previous"
    old_document = {
        "market_record_id": "LM-OLD",
        "skill": "SQL",
        "demand_score": 3.5,
        "frequency": 40,
        "source": "https://example.org/old",
        "observed_at": "2026-11-13T09:00:00Z",
        "collection_batch": "old-batch",
        "time_granularity": "monthly",
        "data_classification": "real",
    }
    client = FakeClient(old_index, {"LM-OLD": old_document})

    result = ingest_real_records_atomically(
        client, "labor_market", [record("LM-NEW")], manifest()
    )

    assert result["previous_physical_index"] == old_index
    assert result["previous_version_retained"] is True
    assert old_index in client.documents
    assert client.aliases["labor_market_real"] == result["physical_index"]
    assert set(client.documents[result["physical_index"]]) == {"LM-OLD", "LM-NEW"}
    merged_properties = client.mappings[result["physical_index"]]["properties"]
    assert merged_properties["market_record_id"] == {"type": "keyword"}
    assert merged_properties["source"] == {"type": "keyword"}
    assert merged_properties["observed_at"] == {"type": "date"}
    assert merged_properties["valid_from"] == {"type": "date"}


def test_invalid_record_never_changes_published_alias(monkeypatch):
    install_fake_bulk(monkeypatch)
    client = FakeClient()
    invalid = record(frequency=-1)

    try:
        ingest_real_records_atomically(
            client, "labor_market", [invalid], manifest()
        )
    except ValueError as error:
        assert any(
            issue["code"] == "NUMERIC_VALUE_OUT_OF_RANGE"
            for issue in error.issues
        )
    else:
        raise AssertionError("Invalid record unexpectedly published.")

    assert "labor_market_real" not in client.aliases
    assert client.documents == {}


def test_bulk_failure_never_publishes_staging_index(monkeypatch):
    install_fake_bulk(monkeypatch, fail=True)
    client = FakeClient()

    try:
        ingest_real_records_atomically(
            client, "labor_market", [record()], manifest()
        )
    except RuntimeError as error:
        assert "Staging bulk failed" in str(error)
    else:
        raise AssertionError("Bulk failure unexpectedly published.")

    assert "labor_market_real" not in client.aliases
    assert client.documents == {}


def test_atomic_publisher_preserves_composite_registry_identity(monkeypatch):
    install_fake_bulk(monkeypatch)
    client = FakeClient()
    relationship_manifest = manifest()
    relationship = {
        "course_id": "C001",
        "course_name": "Algorithms",
        "graduate_id": "G0001",
        "job_field": "Software",
        "related_skills": ["Python"],
        "source": "https://example.org/relationship/1",
        "observed_at": "2026-11-14T09:00:00Z",
        "collection_batch": relationship_manifest["collection_batch"],
        "time_granularity": "annual",
    }

    result = ingest_real_records_atomically(
        client,
        "course_graduate_records",
        [relationship],
        relationship_manifest,
    )

    stored = client.documents[result["physical_index"]]
    assert list(stored) == ["C001::G0001"]
    assert stored["C001::G0001"]["data_classification"] == "real"
