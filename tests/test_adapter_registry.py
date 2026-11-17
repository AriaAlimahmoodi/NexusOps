from io import BytesIO

import pytest

from tools.adapters.base import SourceSpec
from tools.adapters.registry import (
    SourceAdapterRegistry,
    create_default_adapter_registry,
)


def test_default_registry_registers_all_builtin_adapters():
    registry = create_default_adapter_registry()

    assert registry.formats == ("csv", "json", "api", "api_config")
    assert registry.get_adapter("csv").format_name == "csv"
    assert registry.get_adapter("JSON").format_name == "json"
    assert registry.get_adapter("api").format_name == "api"
    assert registry.get_adapter("api_config").format_name == "api_config"


def test_default_registry_instances_are_independent():
    first = create_default_adapter_registry()
    second = create_default_adapter_registry()

    first.register(type("CustomAdapter", (), {
        "format_name": "custom",
        "iter_records": lambda self, source: iter(()),
    })())

    assert "custom" in first.formats
    assert "custom" not in second.formats


def test_registry_dispatches_csv_records_without_transforming_them(tmp_path):
    path = tmp_path / "source.csv"
    path.write_text("External_ID,Raw_Title\n001,Backend Developer\n", encoding="utf-8")

    records = list(
        create_default_adapter_registry().iter_records("csv", SourceSpec(str(path)))
    )

    assert records == [
        {"External_ID": "001", "Raw_Title": "Backend Developer"}
    ]


def test_registry_dispatches_json_records_with_adapter_options(tmp_path):
    path = tmp_path / "source.json"
    path.write_text('[{"id":1},{"id":2}]', encoding="utf-8")

    records = list(
        create_default_adapter_registry().iter_records(
            "json", SourceSpec(str(path), options={"mode": "array"})
        )
    )

    assert records == [{"id": 1}, {"id": 2}]


def test_registry_dispatches_api_adapter_without_making_a_request(monkeypatch):
    import tools.adapters.api_adapter as api_module

    calls = []

    def fake_urlopen(request, timeout):
        calls.append((request.full_url, timeout))
        return BytesIO(b'{"id":7}\n')

    monkeypatch.setattr(api_module, "urlopen", fake_urlopen)
    records = list(
        create_default_adapter_registry().iter_records(
            "api", SourceSpec("https://example.test/records")
        )
    )

    assert records == [{"id": 7}]
    assert calls == [("https://example.test/records", 30.0)]

def test_registry_rejects_duplicate_formats_unless_replace_is_explicit():
    registry = create_default_adapter_registry()
    original = registry.get_adapter("csv")

    class ReplacementAdapter:
        format_name = "csv"

        def iter_records(self, source):
            return iter(())

    replacement = ReplacementAdapter()
    with pytest.raises(ValueError, match="already registered"):
        registry.register(replacement)

    registry.register(replacement, replace=True)
    assert registry.get_adapter("csv") is replacement
    assert registry.get_adapter("csv") is not original


@pytest.mark.parametrize("format_name", ["", " ", None, 42])
def test_registry_rejects_invalid_format_names(format_name):
    registry = create_default_adapter_registry()

    with pytest.raises(ValueError, match="format_name"):
        registry.get_adapter(format_name)


def test_registry_reports_unknown_format_and_available_formats():
    registry = create_default_adapter_registry()

    with pytest.raises(KeyError, match="Available formats: csv, json, api, api_config"):
        registry.get_adapter("parquet")


def test_registry_rejects_incomplete_adapter():
    registry = SourceAdapterRegistry()

    class IncompleteAdapter:
        format_name = "broken"

    with pytest.raises(TypeError, match="iter_records"):
        registry.register(IncompleteAdapter())


def test_registry_requires_source_spec_before_dispatch():
    registry = create_default_adapter_registry()

    with pytest.raises(TypeError, match="SourceSpec"):
        registry.iter_records("csv", "records.csv")


def test_registry_rejects_empty_adapter_format_name():
    registry = SourceAdapterRegistry()

    class EmptyNameAdapter:
        format_name = " "

        def iter_records(self, source):
            return iter(())

    with pytest.raises(TypeError, match="format_name"):
        registry.register(EmptyNameAdapter())
