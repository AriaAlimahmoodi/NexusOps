# Global labor-market source connectors

NexusOps includes two read-only source connectors:

- **ESCO**: European Commission occupation and skills classification.
- **Remotive**: active remote-job postings from the Remotive job board.

The connectors return provider JSON unchanged. They do not normalize data, write
to Elasticsearch, create indices, or modify registered analytical schemas.
Dataset ingestion is a separate phase.

## ESCO

Default base URL: `https://ec.europa.eu/esco/api`

MCP tools:
- `search_esco_concepts`: documented `GET /search` operation.
- `fetch_esco_concepts`: paginated `GET /resource/concept` operation using
  an explicit concept-scheme URI.

Example search arguments:
```json
{"text":"Python","language":"en","concept_type":"Skill","limit":20,"offset":0}
```

Common scheme identifiers:
- Skills: `http://data.europa.eu/esco/concept-scheme/skills`
- Occupations: `http://data.europa.eu/esco/concept-scheme/occupations`

ESCO announced on 17 September 2026 that it is transitioning to a new
OpenAPI-based API and that API-key authentication will be required for that
new service. The final new endpoint and authentication contract must be taken
from the Commission's migration documentation when published. This connector
currently implements the documented legacy web-service operations and allows
the base URL to be overridden using `ESCO_API_BASE_URL`; it does not invent
an authentication header.

Official documentation:
- https://esco.ec.europa.eu/en/use-esco/use-esco-services-api/esco-web-service-api
- https://ec.europa.eu/esco/api/doc/esco_api_doc.html
- https://esco.ec.europa.eu/en/news/upcoming-change-esco-api
- https://esco.ec.europa.eu/en/use-esco/download

## Remotive

Default base URL: `https://remotive.com/api`

MCP tool: `fetch_remotive_jobs`, using `GET /remote-jobs`.

Supported optional arguments: `search`, `category`, `company_name`, and
`limit`. The raw response must include a `jobs` array.

The documented public endpoint requires no API key. Remotive states that:
- listings are delayed by 24 hours;
- API usage should generally be limited to four requests per day;
- displayed listings must credit Remotive and link to the original Remotive URL;
- its jobs must not be submitted to third-party job aggregators.

NexusOps should preserve provider IDs, source attribution, and original URLs
when the ingestion layer is implemented. Remotive-only data must not be
described as the entire global labor market.

Official references:
- https://remotive.com/remote-jobs/api
- https://github.com/remotive-com/remote-jobs-api

## Environment

Optional endpoint overrides:
```dotenv
ESCO_API_BASE_URL=https://ec.europa.eu/esco/api
REMOTIVE_API_BASE_URL=https://remotive.com/api
```

No credentials are required by the documented public endpoints currently
implemented here. Never commit credentials to source control.

## Operational boundaries

- Retrieval only: no automatic Elasticsearch writes.
- Respect Remotive's advised four-requests-per-day limit.
- Fetch ESCO pages deliberately; full taxonomy acquisition belongs to the
  subsequent dataset-ingestion phase.
- Preserve raw payloads and provider provenance for later normalization.
