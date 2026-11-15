# U.S. Public Data API Connectors

## Scope and safety boundary

NexusOps now has read-only client adapters for:

- U.S. Department of Education College Scorecard (institution-level schools endpoint)
- U.S. Bureau of Labor Statistics (BLS) Public Data API (time-series endpoint)

The adapters return provider JSON unchanged. They do **not** transform provider fields,
register new analytical datasets, write to Elasticsearch, create indexes, or change
canonical schemas. This is intentional until source-to-canonical mapping and the
computational model are separately reviewed and approved.

## Configuration

Add the following values to the local, untracked `.env` file:

```dotenv
COLLEGE_SCORECARD_API_KEY=your_key
BLS_API_VERSION=1
BLS_REGISTRATION_KEY=
```

College Scorecard requires a free API key. Obtain it through the official
[College Scorecard API documentation](https://collegescorecard.ed.gov/data/api-documentation/).
Do not commit the key or paste it into source control.

BLS v1 works without a key. BLS v2 requires a registration key; request it through
the [BLS API registration process](https://data.bls.gov/registrationEngine/).
BLS registration must be renewed annually.

## College Scorecard client

Python entry point:

```python
import os
from tools.source_connectors import CollegeScorecardClient

client = CollegeScorecardClient(os.environ["COLLEGE_SCORECARD_API_KEY"])
page = client.get_schools(
    fields=[
        "id",
        "school.name",
        "school.state",
        "latest.student.size",
        "latest.completion.rate",
    ],
    page=0,
    per_page=100,
)
```

- HTTP method: GET
- Endpoint: `https://api.data.gov/ed/collegescorecard/v1/schools`
- Authentication: `api_key` query parameter
- Pagination: zero-based `page`; `per_page` up to 100
- Output: original JSON object with `metadata` and `results`
- Field availability varies by metric and year. The API's `latest` values can
  represent different reporting years; retain provider year/cohort context.

The API also has field-of-study data nested in institution records. It should be
queried only after selecting the required CIP/credential fields from the current
data dictionary; no assumptions about course-level data are made here.

## BLS client

Python entry point (keyless v1):

```python
from tools.source_connectors import BLSClient

client = BLSClient(version=1)
payload = client.get_series(
    series_ids=["LNS14000000"],
    start_year=2020,
    end_year=2025,
)
```

- HTTP method: POST with a JSON request body
- v1 endpoint: `https://api.bls.gov/publicAPI/v1/timeseries/data/`
- v2 endpoint: `https://api.bls.gov/publicAPI/v2/timeseries/data/`
- v1 limits: 25 daily queries, 25 series per request, 10 years per request
- v2 limits: 500 daily queries, 50 series per request, 20 years per request
- Both versions document a rate limit of 50 requests per 10 seconds.
- v2 adds catalog metadata and optional calculations/annual averages.

BLS requires explicit series IDs. The client deliberately does not guess which
series represent a NexusOps concept. Series selection and interpretation must be
documented before using values in analytics.

## Current integration status

- [x] Read-only HTTP clients
- [x] API key and BLS version configuration documented
- [x] Pagination and provider request limits validated client-side
- [x] Unit tests with mocked transport (no network or secrets required)
- [ ] Live API smoke test after local credentials are configured
- [ ] Approve source series, fields, reporting periods, and cohort semantics
- [ ] Review source-to-canonical mapping
- [ ] Separately approve any Elasticsearch ingestion or analytical registration

## Security

Credentials are read from environment variables by the caller. They are never
included in exception messages or logged by these clients. Do not commit local
`.env` files or share API keys in chat.
