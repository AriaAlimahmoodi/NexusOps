"""Generic configuration-driven HTTP JSON acquisition with safe checkpointing."""
from __future__ import annotations
import hashlib, json, time
from datetime import datetime,timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError,URLError
from urllib.parse import urlencode,urljoin,urlsplit,urlunsplit,parse_qsl
from urllib.request import HTTPRedirectHandler,Request,build_opener
from tools.source_engine.checkpoint import read_checkpoint,write_json_atomic

class APIAcquisitionError(RuntimeError):
    """A configured API could not be acquired safely."""

def _now(): return datetime.now(timezone.utc).isoformat()

def _path(value,dotted):
    current=value
    for part in dotted.split("."):
        if isinstance(current,dict) and part in current: current=current[part]
        elif isinstance(current,list) and part.isdigit() and int(part)<len(current): current=current[int(part)]
        else: raise APIAcquisitionError(f"Configured response path '{dotted}' was not found.")
    return current

def _extract(document,response):
    value=_path(document,response["records_path"])
    if response.get("record_key_mode","array")=="object_values":
        if not isinstance(value,dict): raise APIAcquisitionError("records_path must resolve to an object for object_values mode.")
        value=list(value.values())
    if not isinstance(value,list): raise APIAcquisitionError("records_path must resolve to a JSON array.")
    if any(not isinstance(x,dict) for x in value): raise APIAcquisitionError("Every extracted API record must be a JSON object.")
    return value

def _origin(url):
    try:
        parsed=urlsplit(url)
        scheme=parsed.scheme.lower()
        host=parsed.hostname
        if scheme not in {"http","https"} or not host or parsed.username is not None or parsed.password is not None:
            return None
        normalized_host=host.lower() if ":" in host else host.encode("idna").decode("ascii").lower()
        port=parsed.port or (443 if scheme=="https" else 80)
        return scheme,normalized_host,port
    except (UnicodeError,ValueError):
        return None

def _same_origin(a,b):
    origin_a,origin_b=_origin(a),_origin(b)
    return origin_a is not None and origin_a==origin_b

class _SameOriginRedirectHandler(HTTPRedirectHandler):
    """Allow redirects only when scheme, host and effective port stay unchanged."""
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        if not _same_origin(req.full_url,newurl):
            raise APIAcquisitionError("API redirect must remain on the original HTTP(S) origin; cross-origin redirects and HTTPS downgrades are blocked.")
        return super().redirect_request(req,fp,code,msg,headers,newurl)

def _open_url(request,timeout):
    # A custom opener replaces urllib's default redirect handler without
    # mutating process-global opener state.
    return build_opener(_SameOriginRedirectHandler()).open(request,timeout=timeout)

def _add_params(url,params):
    p=urlsplit(url); query=parse_qsl(p.query,keep_blank_values=True)
    for key,value in params.items():
        query=[(k,v) for k,v in query if k!=key]
        if value is not None: query.append((key,str(value)))
    return urlunsplit((p.scheme,p.netloc,p.path,urlencode(query),p.fragment))

def _request(config,url):
    q=config["request"]; rel=config.get("reliability",{}); method=q.get("method","GET")
    headers={"Accept":"application/json","User-Agent":"NexusOps-API-Engine/1.0"}; headers.update(q.get("headers",{}))
    data=json.dumps(q["body"]).encode("utf-8") if method=="POST" else None
    if method=="POST": headers.setdefault("Content-Type",q.get("content_type","application/json"))
    attempts=rel.get("max_attempts",3); statuses=set(rel.get("retry_statuses",[429,502,503,504]))
    backoff=rel.get("backoff_seconds",0.5); maximum=rel.get("max_backoff_seconds",15)
    for attempt in range(attempts):
        req=Request(url,data=data,headers=headers,method=method)
        try:
            with _open_url(req,timeout=float(q.get("timeout",30))) as response:
                try: return json.load(response)
                except json.JSONDecodeError: raise APIAcquisitionError("API response is not valid JSON.") from None
        except HTTPError as exc:
            status=exc.code; retry_after=exc.headers.get("Retry-After") if exc.headers else None
            if exc.fp is not None: exc.close()
            if status not in statuses or attempt+1>=attempts: raise APIAcquisitionError(f"API request failed with HTTP status {status}.") from None
            try: wait=min(float(retry_after),maximum) if retry_after else min(backoff*(2**attempt),maximum)
            except ValueError: wait=min(backoff*(2**attempt),maximum)
        except (URLError,TimeoutError,OSError) as exc:
            if attempt+1>=attempts: raise APIAcquisitionError(f"API transport failed ({type(exc).__name__}).") from None
            wait=min(backoff*(2**attempt),maximum)
        if wait: time.sleep(wait)
    raise APIAcquisitionError("API request exhausted retry attempts.")

def _initial(config):
    p=config["pagination"]
    fingerprint=hashlib.sha256(json.dumps(config,sort_keys=True,separators=(",",":")).encode("utf-8")).hexdigest()
    return {"source_id":config["id"],"config_fingerprint":fingerprint,"strategy":p["strategy"],"pages_completed":0,"records_saved":0,
            "offset":p.get("initial_offset",0),"page":p.get("start_page",1),"cursor":p.get("initial_cursor"),
            "next_url":None,"seen_cursors":[],"status":"running"}

def _page_hashes(directory):
    result={}
    for path in sorted((directory/"pages").glob("page_*.json")):
        digest=hashlib.sha256()
        with path.open("rb") as stream:
            for chunk in iter(lambda:stream.read(1024*1024),b""): digest.update(chunk)
        result[path.name]=digest.hexdigest()
    return result

def acquire_api_source(config: dict[str,Any], *, output_root="data/raw/api_sources", resume=True, max_pages=None):
    """Save original API response pages; no mapping, normalization or Elasticsearch writes."""
    from tools.source_engine.config import validate_source_config
    validate_source_config(config)
    sid=config["id"]; storage=config.get("storage",{}); directory=Path(storage.get("root",output_root))/sid
    pages=directory/"pages"; pages.mkdir(parents=True,exist_ok=True)
    checkpoint=directory/"checkpoint.json"; manifest_path=directory/"manifest.json"
    if not resume and checkpoint.exists():
        raise APIAcquisitionError("A checkpoint already exists; refusing to overwrite source pages with resume disabled.")
    state=read_checkpoint(checkpoint,sid) if resume and storage.get("checkpoint",True) else None
    if state is None and any(pages.glob("page_*.json")):
        raise APIAcquisitionError("Raw pages exist without a usable checkpoint; use the matching checkpoint or a new source id/output directory.")
    if state is None: state=_initial(config)
    p=config["pagination"]; response=config["response"]; strategy=p["strategy"]
    fingerprint=hashlib.sha256(json.dumps(config,sort_keys=True,separators=(",",":")).encode("utf-8")).hexdigest()
    if state.get("config_fingerprint")!=fingerprint: raise APIAcquisitionError("Source configuration differs from the saved checkpoint; use a new source id or archive the old checkpoint.")
    if state.get("strategy")!=strategy: raise APIAcquisitionError("Checkpoint pagination strategy differs from configuration.")
    cap=max_pages if max_pages is not None else p.get("max_pages",10000)
    if isinstance(cap,bool) or not isinstance(cap,int) or cap<1: raise ValueError("max_pages must be positive.")
    initial_pages=state["pages_completed"]; started=_now(); complete=state.get("status")=="completed"
    before_page=state
    try:
        while not complete and state["pages_completed"]-initial_pages<cap:
            before_page=json.loads(json.dumps(state))
            params=dict(config["request"].get("query",{})); url=config["request"]["url"]
            if strategy=="page":
                params[p.get("page_param","page")]=state["page"]; params[p.get("limit_param","limit")]=p["page_size"]
            elif strategy=="offset":
                params[p["offset_param"]]=state["offset"]; params[p.get("limit_param","limit")]=p["page_size"]
            elif strategy=="cursor":
                if state["cursor"] is not None: params[p["cursor_param"]]=state["cursor"]
                if p.get("page_size"): params[p.get("limit_param","limit")]=p["page_size"]
            elif strategy=="next_url" and state["next_url"]:
                url=state["next_url"]; params={}
            request_url=_add_params(url,params)
            document=_request(config,request_url); records=_extract(document,response)
            if strategy=="none": complete=True
            elif strategy=="page":
                complete=len(records)<p["page_size"]; state["page"]+=1
            elif strategy=="offset":
                state["offset"] += len(records)
                if p.get("total_path"):
                    total = _path(document, p["total_path"])
                    if type(total) is not int or total < 0:
                        raise APIAcquisitionError("Offset pagination requires a non-negative integer total.")
                    if not records and state["offset"] < total:
                        raise APIAcquisitionError("Empty offset page before the reported total.")
                    complete = state["offset"] >= total
                else:
                    complete = not records
            elif strategy=="cursor":
                cursor=_path(document,response["next_cursor_path"])
                if cursor is None or cursor=="": complete=True
                elif isinstance(cursor,bool) or not isinstance(cursor,(str,int,float)): raise APIAcquisitionError("Next cursor must be a string or number.")
                elif cursor in state["seen_cursors"]: raise APIAcquisitionError("Cursor pagination returned a repeated cursor.")
                else: state["seen_cursors"].append(cursor); state["cursor"]=cursor
            elif strategy=="next_url":
                nxt=_path(document,response["next_url_path"])
                if not nxt: complete=True
                elif not isinstance(nxt,str): raise APIAcquisitionError("next_url_path must resolve to a URL string or null.")
                else:
                    resolved=urljoin(request_url,nxt)
                    if not _same_origin(config["request"]["url"],resolved): raise APIAcquisitionError("Pagination next URL must remain on the original API origin.")
                    state["next_url"]=resolved
            page_file=pages/f"page_{state['pages_completed']:08d}.json"
            if storage.get("preserve_raw_pages",True): write_json_atomic(page_file,document)
            state["pages_completed"]+=1; state["records_saved"]+=len(records)
            state["status"]="completed" if complete else "running"
            if storage.get("checkpoint",True): write_json_atomic(checkpoint,state)
            delay=config.get("reliability",{}).get("request_interval_seconds",0)
            if delay and not complete: time.sleep(delay)
            if complete: break
        if not complete:
            state["status"]="partial"
            if storage.get("checkpoint",True): write_json_atomic(checkpoint,state)
    except Exception as exc:
        # Roll back in-memory pagination state to the last committed page.
        state=before_page
        state["status"]="failed"
        if storage.get("checkpoint",True): write_json_atomic(checkpoint,state)
        failure={"source_id":sid,"status":"failed","started_at":started,"finished_at":_now(),
                 "pages_completed_total":state["pages_completed"],"records_saved_total":state["records_saved"],
                 "error_type":type(exc).__name__,"raw_directory":str(directory),
                 "resume_available":bool(storage.get("checkpoint",True))}
        if storage.get("manifest",True): write_json_atomic(manifest_path,failure)
        if isinstance(exc,(APIAcquisitionError,ValueError)): raise
        raise APIAcquisitionError(f"API acquisition failed ({type(exc).__name__}).") from None
    result={"source_id":sid,"source_name":config.get("name",sid),"status":"completed" if complete else "partial",
            "started_at":started,"finished_at":_now(),"pages_completed_this_run":state["pages_completed"]-initial_pages,
            "pages_completed_total":state["pages_completed"],"records_saved_total":state["records_saved"],
            "pagination_strategy":strategy,"raw_directory":str(directory),
            "page_sha256":_page_hashes(directory) if storage.get("preserve_raw_pages",True) else {},
            "resume_available":bool(storage.get("checkpoint",True)),"raw_pages_preserved":bool(storage.get("preserve_raw_pages",True))}
    if storage.get("manifest",True): write_json_atomic(manifest_path,result)
    return result
