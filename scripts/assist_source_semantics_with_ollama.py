"""Run local Ollama semantic suggestions against a source profile."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from tools.dataset_registry import DATASET_PROFILES
from tools.ollama_semantic_assist import OllamaSemanticAssistant


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate review-only semantic suggestions with local Ollama."
    )
    parser.add_argument("profile", help="Path to a source profile JSON file.")
    parser.add_argument(
        "--output",
        default="ollama-semantic-assist-report.json",
        help="Output report path.",
    )
    parser.add_argument(
        "--url",
        default=None,
        help="Ollama base URL (default: NEXUSOPS_OLLAMA_URL or localhost).",
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Ollama model (default: NEXUSOPS_OLLAMA_MODEL or qwen3:4b).",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=None,
        help="Request timeout in seconds (default: NEXUSOPS_OLLAMA_TIMEOUT_SECONDS or 30).",
    )
    args = parser.parse_args()

    profile_path = Path(args.profile)
    with profile_path.open("r", encoding="utf-8") as stream:
        source_profile = json.load(stream)

    assistant = OllamaSemanticAssistant(
        base_url=args.url,
        model=args.model,
        timeout=args.timeout,
    )
    report = assistant.analyze(
        source_profile,
        list(DATASET_PROFILES.values()),
    )
    output_path = Path(args.output)
    output_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(json.dumps({
        "status": report["status"],
        "model": report["model"],
        "suggestions": len(report["suggestions"]),
        "bilingual_pair_suggestions": len(report["bilingual_pair_suggestions"]),
        "rejected_model_items": report["rejected_model_items"],
        "report_path": str(output_path),
        "error_code": report.get("error_code"),
    }, ensure_ascii=False, indent=2))
    return 0 if report["status"] == "completed" else 2


if __name__ == "__main__":
    raise SystemExit(main())
