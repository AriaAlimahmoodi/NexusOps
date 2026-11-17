from io import BytesIO
import json
import pytest
import tools.source_engine.runner as runner
from tools.adapters.base import SourceSpec
from tools.adapters.configured_api_adapter import ConfiguredAPISourceAdapter
from tools.adapters.registry import create_default_adapter_registry

class Response(BytesIO):
    def __enter__(self): return self
    def __exit__(self,*args): self.close()

def make_config(path):
    config={
      "id":"configured_adapter_test",
      "request":{"url":"https://api.example.test/items","method":"GET"},
      "response":{"format":"json","records_path":"data.items"},
      "pagination":{"strategy":"offset","offset_param":"offset","limit_param":"limit","page_size":2,"total_path":"data.total"},
      "reliability":{"max_attempts":1}
    }
    path.write_text(json.dumps(config),encoding="utf-8")
    return path

def test_configured_api_adapter_is_registered_and_streams_raw_pages(tmp_path,monkeypatch):
    calls=[]
    def fake(request,timeout):
        from urllib.parse import parse_qs,urlsplit
        offset=int(parse_qs(urlsplit(request.full_url).query)["offset"][0]); calls.append(offset)
        items=[{"id":i} for i in range(offset,min(offset+2,3))]
        return Response(json.dumps({"data":{"items":items,"total":3}}).encode())
    monkeypatch.setattr(runner,"urlopen",fake)
    config=make_config(tmp_path/"source.json")
    registry=create_default_adapter_registry()
    records=list(registry.iter_records("api_config",SourceSpec(str(config),options={"output_root":str(tmp_path/"raw")})))
    assert records==[{"id":0},{"id":1},{"id":2}]
    assert calls==[0,2]
    assert "api_config" in registry.formats

def test_configured_api_adapter_reuses_completed_checkpoint_without_request(tmp_path,monkeypatch):
    config=make_config(tmp_path/"source.json")
    calls=[]
    def fake(request,timeout):
        calls.append(1)
        return Response(b'{"data":{"items":[{"id":1}],"total":1}}')
    monkeypatch.setattr(runner,"urlopen",fake)
    adapter=ConfiguredAPISourceAdapter()
    source=SourceSpec(str(config),options={"output_root":str(tmp_path/"raw")})
    assert list(adapter.iter_records(source))==[{"id":1}]
    assert list(adapter.iter_records(source))==[{"id":1}]
    assert len(calls)==1

def test_configured_api_adapter_blocks_partial_acquisition_by_default(tmp_path,monkeypatch):
    config=make_config(tmp_path/"source.json")
    monkeypatch.setattr(runner,"urlopen",lambda request,timeout:Response(b'{"data":{"items":[{"id":1},{"id":2}],"total":5}}'))
    source=SourceSpec(str(config),options={"output_root":str(tmp_path/"raw"),"max_pages":1})
    with pytest.raises(ValueError,match="partial"):
        list(ConfiguredAPISourceAdapter().iter_records(source))
