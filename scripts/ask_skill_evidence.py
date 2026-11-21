"""Answer a skill evidence question using the applicable pilot data."""
import argparse
from getpass import getpass
import json
import os
from tools.computational_engine.service import answer, uses_local_evidence


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("question")
    parser.add_argument("--prompt-password", action="store_true")
    args = parser.parse_args()
    if uses_local_evidence(args.question):
        result = answer(None, args.question)
    else:
        if args.prompt_password:
            os.environ["ELASTICSEARCH_PASSWORD"] = getpass("Elasticsearch password: ")
        from config import get_elasticsearch_client

        with get_elasticsearch_client() as client:
            result = answer(client, args.question)
    print(json.dumps(result, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
