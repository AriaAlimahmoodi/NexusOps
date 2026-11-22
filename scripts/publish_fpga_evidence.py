"""Prepare an FPGA evidence file for review, or publish its approved bytes."""
import argparse
import hashlib
import json
from pathlib import Path

from tools.computational_engine.published_fpga import approved_document, publish, stage_payload


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--prepare", type=Path, metavar="JOBVISION_CSV")
    mode.add_argument("--publish", type=Path, metavar="REVIEWED_JSON")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--approve-sha256")
    args = parser.parse_args()
    if args.prepare:
        if not args.output or args.approve_sha256:
            parser.error("--prepare requires --output")
        payload = stage_payload(args.prepare)
        with args.output.open("xb") as stream:
            stream.write(payload)
        print(hashlib.sha256(payload).hexdigest())
        return
    if args.output or not args.approve_sha256:
        parser.error("--publish requires --approve-sha256")
    payload = args.publish.read_bytes()
    approved_document(payload, args.approve_sha256)
    from config import get_elasticsearch_client

    with get_elasticsearch_client() as client:
        result = publish(client, payload, args.approve_sha256)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
