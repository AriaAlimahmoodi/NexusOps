import hashlib
import json
from unittest.mock import MagicMock

import pytest

from tools.computational_engine import published_fpga as pilot


def test_publication_rejects_mismatched_approval_before_touching_elasticsearch():
    client = MagicMock()
    with pytest.raises(ValueError, match="SHA-256"):
        pilot.publish(client, b"{}", "wrong")
    assert not client.mock_calls


def test_publication_seals_and_reads_staged_version_before_switching_real_alias(monkeypatch):
    report = {"fixture": True}
    payload = json.dumps(report).encode()
    approval = hashlib.sha256(payload).hexdigest()
    def validate(value):
        assert value == report

    monkeypatch.setattr(pilot, "validate_report", validate)
    client = MagicMock()
    client.indices.exists_alias.return_value = True
    old = f"{pilot.ALIAS}__v_old"
    client.indices.get_alias.return_value = {old: {}}
    def switch(*, actions):
        client.indices.get_alias.return_value = {actions[-1]["add"]["index"]: {}}
        return {"acknowledged": True}

    client.indices.update_aliases.side_effect = switch
    client.get.return_value = {"_source": pilot.approved_document(payload, approval)}
    result = pilot.publish(client, payload, approval)
    assert result["previous_index"] == old
    names = [call[0] for call in client.mock_calls]
    assert names.index("get") < names.index("indices.put_settings") < names.index("indices.update_aliases")
    assert client.indices.update_aliases.call_args.kwargs["actions"] == [
        {"remove": {"index": old, "alias": pilot.ALIAS, "must_exist": True}},
        {"add": {"index": result["index"], "alias": pilot.ALIAS, "is_write_index": True}},
    ]
    assert not client.indices.delete.called
