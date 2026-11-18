from io import BytesIO
from urllib.parse import parse_qs, urlsplit
import json
import pytest
from urllib.error import HTTPError
from urllib.request import Request

import tools.source_engine.runner as runner
from tools.source_engine.config import SourceConfigurationError, load_source_config
from tools.source_engine.runner import APIAcquisitionError, acquire_api_source

class Response(BytesIO):
    def __enter__(self): return self
    def __exit__(self,*args): self.close()

def cfg(strategy="offset"):
    pagination={"strategy":strategy,"max_pages":20}
    response={"format":"json","records_path":"data.items"}
    if strategy=="offset":
        pagination.update(offset_param="offset",limit_param="limit",initial_offset=0,page_size=2,total_path="data.total")
    elif strategy=="page":
        pagination.update(page_param="page",limit_param="limit",start_page=1,page_size=2)
    elif strategy=="cursor":
        pagination.update(cursor_param="cursor",page_size=2); response["next_cursor_path"]="data.next"
    elif strategy=="next_url":
        response["next_url_path"]="data.next"
    return {"id":"test_source","request":{"url":"https://api.example.test/items","method":"GET","query":{"lang":"en"}},
            "response":response,"pagination":pagination,"reliability":{"max_attempts":1}}

def test_offset_pagination_advances_by_actual_record_count_and_stops_at_total(tmp_path,monkeypatch):
    calls=[]
    def fake(request,timeout):
        q=parse_qs(urlsplit(request.full_url).query); offset=int(q["offset"][0]); calls.append(offset)
        items=[{"id":i} for i in range(offset,min(offset+2,3))]
        return Response(json.dumps({"data":{"items":items,"total":3}}).encode())
    monkeypatch.setattr(runner,"_open_url",fake)
    result=acquire_api_source(cfg(),output_root=tmp_path)
    assert calls==[0,2]
    assert result["records_saved_total"]==3
    assert result["status"]=="completed"
    assert len(result["page_sha256"])==2

def test_page_pagination_and_short_page_termination(tmp_path,monkeypatch):
    calls=[]
    def fake(request,timeout):
        page=int(parse_qs(urlsplit(request.full_url).query)["page"][0]); calls.append(page)
        items=[{"id":1},{"id":2}] if page==1 else [{"id":3}]
        return Response(json.dumps({"data":{"items":items}}).encode())
    monkeypatch.setattr(runner,"_open_url",fake)
    result=acquire_api_source(cfg("page"),output_root=tmp_path)
    assert calls==[1,2] and result["records_saved_total"]==3 and result["status"]=="completed"

def test_cursor_pagination_uses_next_cursor_and_detects_end(tmp_path,monkeypatch):
    calls=[]
    def fake(request,timeout):
        q=parse_qs(urlsplit(request.full_url).query); calls.append(q.get("cursor",[None])[0])
        data={"items":[{"id":len(calls)}],"next":"c2" if len(calls)==1 else None}
        return Response(json.dumps({"data":data}).encode())
    monkeypatch.setattr(runner,"_open_url",fake)
    result=acquire_api_source(cfg("cursor"),output_root=tmp_path)
    assert calls==[None,"c2"] and result["records_saved_total"]==2

def test_next_url_rejects_cross_origin_before_second_request(tmp_path,monkeypatch):
    calls=[]
    def fake(request,timeout):
        calls.append(request.full_url)
        return Response(b'{"data":{"items":[{"id":1}],"next":"https://evil.example/steal"}}')
    monkeypatch.setattr(runner,"_open_url",fake)
    with pytest.raises(APIAcquisitionError,match="original API origin"):
        acquire_api_source(cfg("next_url"),output_root=tmp_path)
    assert len(calls)==1

def test_resume_continues_from_checkpoint_without_repeating_committed_page(tmp_path,monkeypatch):
    calls=[]
    def fake(request,timeout):
        q=parse_qs(urlsplit(request.full_url).query); offset=int(q["offset"][0]); calls.append(offset)
        items=[{"id":i} for i in range(offset,offset+2)]
        return Response(json.dumps({"data":{"items":items,"total":4}}).encode())
    monkeypatch.setattr(runner,"_open_url",fake)
    first=acquire_api_source(cfg(),output_root=tmp_path,max_pages=1)
    second=acquire_api_source(cfg(),output_root=tmp_path)
    assert first["status"]=="partial"
    assert second["status"]=="completed"
    assert calls==[0,2] and second["records_saved_total"]==4

def test_http_500_is_not_retried_by_default(tmp_path,monkeypatch):
    calls=[]
    def failed(request,timeout):
        calls.append(1); raise HTTPError(request.full_url,500,"Server Error",{},None)
    monkeypatch.setattr(runner,"_open_url",failed)
    with pytest.raises(APIAcquisitionError,match="HTTP status 500"):
        acquire_api_source(cfg(),output_root=tmp_path)
    assert len(calls)==1

def test_config_expands_environment_secret_without_persisting_it(tmp_path,monkeypatch):
    monkeypatch.setenv("NEXUS_TEST_TOKEN","secret-value")
    path=tmp_path/"source.json"
    data=cfg(); data["request"]["headers"]={"Authorization":"Bearer ${ENV:NEXUS_TEST_TOKEN}"}
    path.write_text(json.dumps(data),encoding="utf-8")
    loaded=load_source_config(path)
    assert loaded["request"]["headers"]["Authorization"]=="Bearer secret-value"

def test_config_rejects_unknown_fields():
    data=cfg(); data["pagination"]["mystery"]=True
    from tools.source_engine.config import validate_source_config
    with pytest.raises(SourceConfigurationError,match="Unknown 'pagination'"):
        validate_source_config(data)


def test_object_valued_response_envelope_is_supported(tmp_path,monkeypatch):
    monkeypatch.setattr(runner,"_open_url",lambda request,timeout:Response(b'{"_embedded":{"urn:a":{"uri":"urn:a"},"urn:b":{"uri":"urn:b"}}}'))
    data=cfg("none"); data["response"]={"format":"json","records_path":"_embedded","record_key_mode":"object_values"}
    result=acquire_api_source(data,output_root=tmp_path)
    assert result["records_saved_total"]==2

def test_graphql_json_post_is_supported(tmp_path,monkeypatch):
    captured={}
    def fake(request,timeout):
        captured["method"]=request.method; captured["body"]=json.loads(request.data)
        return Response(b'{"data":{"items":[{"id":"x"}]}}')
    monkeypatch.setattr(runner,"_open_url",fake)
    data=cfg("none"); data["request"].update(method="POST",body={"query":"query { items { id } }"})
    result=acquire_api_source(data,output_root=tmp_path)
    assert captured["method"]=="POST"
    assert "query" in captured["body"]
    assert result["records_saved_total"]==1

def test_checkpoint_rejects_changed_source_configuration(tmp_path,monkeypatch):
    def fake(request,timeout):
        return Response(b'{"data":{"items":[{"id":1},{"id":2}],"total":4}}')
    monkeypatch.setattr(runner,"_open_url",fake)
    data=cfg()
    acquire_api_source(data,output_root=tmp_path,max_pages=1)
    changed=cfg(); changed["pagination"]["page_size"]=3
    with pytest.raises(APIAcquisitionError,match="configuration differs"):
        acquire_api_source(changed,output_root=tmp_path)


def test_resume_disabled_refuses_to_overwrite_existing_checkpoint(tmp_path,monkeypatch):
    monkeypatch.setattr(runner,"_open_url",lambda request,timeout:Response(b'{"data":{"items":[{"id":1},{"id":2}],"total":4}}'))
    data=cfg()
    acquire_api_source(data,output_root=tmp_path,max_pages=1)
    with pytest.raises(APIAcquisitionError,match="resume disabled"):
        acquire_api_source(data,output_root=tmp_path,resume=False)

def test_request_uses_transparent_default_user_agent(monkeypatch):
    captured = {}
    def fake(request, timeout):
        captured["user_agent"] = request.get_header("User-agent")
        return Response(b'{}')
    monkeypatch.setattr(runner, "_open_url", fake)
    result = runner._request(
        {"request": {"url": "https://api.example.test/items", "method": "GET"},
         "reliability": {"max_attempts": 1}},
        "https://api.example.test/items",
    )
    assert result == {}
    assert captured["user_agent"] == "NexusOps-API-Engine/1.0"


def test_request_allows_configured_user_agent_override(monkeypatch):
    captured = {}
    def fake(request, timeout):
        captured["user_agent"] = request.get_header("User-agent")
        return Response(b'{}')
    monkeypatch.setattr(runner, "_open_url", fake)
    runner._request(
        {"request": {"url": "https://api.example.test/items", "method": "GET",
                     "headers": {"User-Agent": "Custom-Source-Client/2.0"}},
         "reliability": {"max_attempts": 1}},
        "https://api.example.test/items",
    )
    assert captured["user_agent"] == "Custom-Source-Client/2.0"



def test_redirect_handler_allows_same_origin_redirect():
    handler = runner._SameOriginRedirectHandler()
    request = Request("https://api.example.test/items", headers={"Authorization": "Bearer secret"})
    redirected = handler.redirect_request(
        request, None, 302, "Found", {}, "https://api.example.test/v2/items"
    )
    assert redirected is not None
    assert redirected.full_url == "https://api.example.test/v2/items"


@pytest.mark.parametrize("target", [
    "https://evil.example/collect",
    "http://api.example.test/items",
    "https://api.example.test:444/items",
    "https://user:password@api.example.test/items",
])
def test_redirect_handler_blocks_cross_origin_and_unsafe_redirects(target):
    handler = runner._SameOriginRedirectHandler()
    request = Request("https://api.example.test/items", headers={"Authorization": "Bearer secret"})
    with pytest.raises(APIAcquisitionError, match="cross-origin redirects"):
        handler.redirect_request(request, None, 302, "Found", {}, target)


# Exercise urllib's real redirect flow against local HTTP servers. These tests
# verify that the handler is installed in the opener used by production code,
# not merely that redirect_request makes the expected decision.
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread


class _LocalRedirectHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.server.received.append((self.path, self.headers.get("Authorization")))
        if self.path == "/start":
            self.send_response(302)
            self.send_header("Location", self.server.redirect_location)
            self.end_headers()
            return
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"redirect reached")

    def log_message(self, format, *args):
        pass


def _start_redirect_server(redirect_location=""):
    server = ThreadingHTTPServer(("127.0.0.1", 0), _LocalRedirectHandler)
    server.redirect_location = redirect_location
    server.received = []
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, thread


def _stop_redirect_server(server, thread):
    server.shutdown()
    server.server_close()
    thread.join(timeout=2)


def test_real_urllib_same_origin_redirect_succeeds():
    server, thread = _start_redirect_server("/final")
    try:
        url = f"http://127.0.0.1:{server.server_port}/start"
        request = Request(url, headers={"Authorization": "Bearer local-test"})
        with runner._open_url(request, timeout=3) as response:
            assert response.status == 200
            assert response.read() == b"redirect reached"
        assert [item[0] for item in server.received] == ["/start", "/final"]
        assert server.received[1][1] == "Bearer local-test"
    finally:
        _stop_redirect_server(server, thread)


def test_real_urllib_cross_origin_redirect_is_blocked_before_destination_request():
    destination, destination_thread = _start_redirect_server("")
    target = f"http://127.0.0.1:{destination.server_port}/collect"
    source, source_thread = _start_redirect_server(target)
    try:
        url = f"http://127.0.0.1:{source.server_port}/start"
        request = Request(url, headers={"Authorization": "Bearer must-not-leak"})
        with pytest.raises(APIAcquisitionError, match="cross-origin redirects"):
            runner._open_url(request, timeout=3)
        assert [item[0] for item in source.received] == ["/start"]
        assert destination.received == []
    finally:
        _stop_redirect_server(source, source_thread)
        _stop_redirect_server(destination, destination_thread)
