# Dynamic API source configurations

Each source is declared in a standalone UTF-8 JSON file. Adding a supported
source does not require a new Python client. Invoke the generic CLI with its
configuration file.

Use `${ENV:VARIABLE_NAME}` for credentials. Never commit real secrets.
Supported requests: HTTP GET and JSON POST (including GraphQL over HTTP).
Supported JSON response records: arrays and object-valued envelopes.
Pagination: none, page, offset, cursor, and same-origin next_url.

Raw response pages, checkpoint and manifest are stored under
data/raw/api_sources/<source-id>/. A page is atomically persisted before the
checkpoint advances. Re-running resumes from the last committed page.
No canonical mapping, normalization, Elasticsearch write or alias mutation
occurs during acquisition.

XML/SOAP, WebSocket, interactive OAuth, custom request signing, binary payloads
and provider-specific anti-bot protocols need a transport/response extension.
