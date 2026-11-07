import json
import urllib.request


URL = "http://127.0.0.1:8000/mcp"


payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
        "protocolVersion": "2025-06-18",
        "capabilities": {},
        "clientInfo": {
            "name": "nexusops-test",
            "version": "1.0",
        },
    },
}


body = json.dumps(payload).encode("utf-8")

request = urllib.request.Request(
    URL,
    data=body,
    method="POST",
    headers={
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    },
)


print("Sending raw HTTP initialize request...")
print()
print("Request body:")
print(json.dumps(payload, ensure_ascii=False, indent=2))
print()

try:
    with urllib.request.urlopen(request, timeout=10) as response:
        print("HTTP status:", response.status)
        print()
        print("Response headers:")
        print(response.headers)
        print()
        print("Response body:")
        print(response.read().decode("utf-8"))

except Exception as exc:
    print("Request failed:")
    print(type(exc).__name__)
    print(exc)

    if hasattr(exc, "read"):
        print()
        print("Server response body:")
        print(exc.read().decode("utf-8"))