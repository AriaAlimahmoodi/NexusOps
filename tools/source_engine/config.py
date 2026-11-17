"""Strict JSON configuration loading for generic HTTP API sources."""
from __future__ import annotations
import json, os, re
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

_ENV_PATTERN = re.compile(r"\$\{ENV:([A-Za-z_][A-Za-z0-9_]*)\}")
_TOP = {"id","name","enabled","request","response","pagination","reliability","storage"}
_REQUEST = {"url","method","headers","query","body","content_type","timeout"}
_RESPONSE = {"format","records_path","record_key_mode","next_cursor_path","next_url_path"}
_PAGINATION = {"strategy","page_param","start_page","limit_param","offset_param","initial_offset","page_size","cursor_param","initial_cursor","max_pages","total_path"}
_RELIABILITY = {"max_attempts","retry_statuses","backoff_seconds","max_backoff_seconds","request_interval_seconds"}
_STORAGE = {"root","preserve_raw_pages","checkpoint","manifest"}

class SourceConfigurationError(ValueError):
    """Invalid or incomplete API source configuration."""

def _expand(value: Any) -> Any:
    if isinstance(value, str):
        def repl(match):
            name = match.group(1)
            result = os.environ.get(name)
            if result is None or not result.strip():
                raise SourceConfigurationError(f"Required environment variable '{name}' is not set.")
            return result
        return _ENV_PATTERN.sub(repl, value)
    if isinstance(value, list): return [_expand(x) for x in value]
    if isinstance(value, dict): return {k:_expand(v) for k,v in value.items()}
    return value

def _obj(value, allowed, label, required=()):
    if not isinstance(value, dict): raise SourceConfigurationError(f"'{label}' must be a JSON object.")
    unknown, missing = set(value)-allowed, set(required)-set(value)
    if unknown: raise SourceConfigurationError(f"Unknown '{label}' option(s): {sorted(unknown)}.")
    if missing: raise SourceConfigurationError(f"Missing '{label}' option(s): {sorted(missing)}.")
    return value

def validate_source_config(config: Any) -> dict[str, Any]:
    c = _obj(config,_TOP,"source",{"id","request","response","pagination"})
    if not isinstance(c["id"],str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,99}",c["id"]):
        raise SourceConfigurationError("'id' must be a safe source identifier.")
    if c.get("enabled",True) is not True: raise SourceConfigurationError(f"Source '{c['id']}' is disabled.")
    q = _obj(c["request"],_REQUEST,"request",{"url"})
    u = urlsplit(q["url"]) if isinstance(q["url"],str) else None
    if u is None or u.scheme not in {"http","https"} or not u.hostname or u.username or u.password:
        raise SourceConfigurationError("'request.url' must be HTTP(S) without embedded credentials.")
    method=q.get("method","GET")
    if method not in {"GET","POST"}: raise SourceConfigurationError("request.method must be GET or POST.")
    if method=="GET" and "body" in q: raise SourceConfigurationError("GET requests cannot define a body.")
    if method=="POST" and "body" not in q: raise SourceConfigurationError("POST requests require a JSON body.")
    if not isinstance(q.get("headers",{}),dict) or not isinstance(q.get("query",{}),dict):
        raise SourceConfigurationError("Request headers and query must be JSON objects.")
    if any(not isinstance(k,str) or not isinstance(v,str) for k,v in q.get("headers",{}).items()):
        raise SourceConfigurationError("Header names and values must be strings.")
    timeout=q.get("timeout",30)
    if isinstance(timeout,bool) or not isinstance(timeout,(int,float)) or timeout<=0:
        raise SourceConfigurationError("request.timeout must be positive.")
    r=_obj(c["response"],_RESPONSE,"response",{"format","records_path"})
    if r["format"]!="json": raise SourceConfigurationError("Only JSON response format is supported.")
    if not isinstance(r["records_path"],str) or not r["records_path"].strip():
        raise SourceConfigurationError("response.records_path must be a dotted path.")
    if r.get("record_key_mode","array") not in {"array","object_values"}:
        raise SourceConfigurationError("record_key_mode must be array or object_values.")
    p=_obj(c["pagination"],_PAGINATION,"pagination",{"strategy"})
    strategy=p["strategy"]
    if strategy not in {"none","page","offset","cursor","next_url"}:
        raise SourceConfigurationError("Pagination strategy must be none, page, offset, cursor or next_url.")
    if strategy in {"page","offset"}:
        for key in ("page_size",):
            if isinstance(p.get(key),bool) or not isinstance(p.get(key),int) or p[key]<1:
                raise SourceConfigurationError(f"{strategy} pagination requires {key} >= 1.")
        if not isinstance(p.get("limit_param","limit"),str) or not p.get("limit_param","limit").strip():
            raise SourceConfigurationError("limit_param must be a non-empty string.")
    if strategy=="page":
        if not isinstance(p.get("page_param","page"),str) or not p.get("page_param","page").strip():
            raise SourceConfigurationError("page_param must be a non-empty string.")
        if isinstance(p.get("start_page",1),bool) or not isinstance(p.get("start_page",1),int) or p.get("start_page",1)<0:
            raise SourceConfigurationError("start_page must be a non-negative integer.")
    if strategy=="offset":
        for key in ("offset_param",):
            if not isinstance(p.get(key),str) or not p[key].strip(): raise SourceConfigurationError(f"Offset pagination requires {key}.")
        if isinstance(p.get("initial_offset",0),bool) or not isinstance(p.get("initial_offset",0),int) or p.get("initial_offset",0)<0:
            raise SourceConfigurationError("initial_offset must be non-negative.")
    if strategy=="cursor":
        if not isinstance(p.get("cursor_param"),str) or not p["cursor_param"].strip() or not isinstance(r.get("next_cursor_path"),str) or not r["next_cursor_path"].strip():
            raise SourceConfigurationError("Cursor pagination requires cursor_param and response.next_cursor_path.")
    if strategy=="next_url" and (not isinstance(r.get("next_url_path"),str) or not r["next_url_path"].strip()):
        raise SourceConfigurationError("next_url pagination requires response.next_url_path.")
    if "total_path" in p and not isinstance(p["total_path"],str): raise SourceConfigurationError("total_path must be a dotted path.")
    if isinstance(p.get("max_pages",10000),bool) or not isinstance(p.get("max_pages",10000),int) or p.get("max_pages",10000)<1:
        raise SourceConfigurationError("max_pages must be a positive integer.")
    rel=_obj(c.get("reliability",{}),_RELIABILITY,"reliability")
    attempts=rel.get("max_attempts",3)
    if isinstance(attempts,bool) or not isinstance(attempts,int) or attempts<1: raise SourceConfigurationError("max_attempts must be >= 1.")
    statuses=rel.get("retry_statuses",[429,502,503,504])
    if not isinstance(statuses,list) or any(isinstance(x,bool) or not isinstance(x,int) or not 100<=x<=599 for x in statuses):
        raise SourceConfigurationError("retry_statuses must contain HTTP status integers.")
    for key in ("backoff_seconds","max_backoff_seconds","request_interval_seconds"):
        v=rel.get(key,0)
        if isinstance(v,bool) or not isinstance(v,(int,float)) or v<0: raise SourceConfigurationError(f"{key} must be non-negative.")
    st=_obj(c.get("storage",{}),_STORAGE,"storage")
    if "root" in st and (not isinstance(st["root"],str) or not st["root"].strip()): raise SourceConfigurationError("storage.root must be a path.")
    for key in ("preserve_raw_pages","checkpoint","manifest"):
        if key in st and not isinstance(st[key],bool): raise SourceConfigurationError(f"storage.{key} must be boolean.")
    return c

def load_source_config(path: str | Path) -> dict[str, Any]:
    try: raw=json.loads(Path(path).read_text(encoding="utf-8-sig"))
    except OSError as exc: raise SourceConfigurationError(f"Cannot read source configuration ({type(exc).__name__}).") from None
    except json.JSONDecodeError as exc: raise SourceConfigurationError(f"Invalid JSON at line {exc.lineno}: {exc.msg}.") from None
    return validate_source_config(_expand(raw))
