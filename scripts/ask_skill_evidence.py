"""Answer the JobVision and Purdue pilot question using live Elasticsearch evidence."""
import argparse
from getpass import getpass
import json
import os
from tools.computational_engine.service import answer


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("question")
    parser.add_argument("--prompt-password", action="store_true")
    args = parser.parse_args()
    if args.prompt_password:
        os.environ["ELASTICSEARCH_PASSWORD"] = getpass("Elasticsearch password: ")
    from config import get_elasticsearch_client

    with get_elasticsearch_client() as client:
        print(json.dumps(answer(client, args.question), ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
