"""Atomic checkpoint and manifest persistence."""
from __future__ import annotations
import json, os, tempfile
from pathlib import Path
from typing import Any

def write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True,exist_ok=True)
    fd,name=tempfile.mkstemp(prefix=f".{path.name}.",suffix=".tmp",dir=path.parent)
    try:
        with os.fdopen(fd,"w",encoding="utf-8",newline="\n") as stream:
            json.dump(payload,stream,ensure_ascii=False,indent=2); stream.write("\n")
            stream.flush(); os.fsync(stream.fileno())
        os.replace(name,path)
    except Exception:
        try: os.unlink(name)
        except OSError: pass
        raise

def read_checkpoint(path: Path, source_id: str):
    if not path.exists(): return None
    try: data=json.loads(path.read_text(encoding="utf-8"))
    except (OSError,json.JSONDecodeError) as exc: raise ValueError(f"Checkpoint unreadable ({type(exc).__name__}); preserve it for inspection.") from None
    if not isinstance(data,dict) or data.get("source_id")!=source_id: raise ValueError("Checkpoint source_id does not match selected source.")
    return data
