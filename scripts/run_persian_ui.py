"""Run the Phase 17 browser interface on this computer."""
import argparse
from pathlib import Path

import uvicorn
from dotenv import load_dotenv

from tools.persian_ui.app import create_app


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8017)
    parser.add_argument("--env-file", type=Path, help="Existing NexusOps environment file")
    args = parser.parse_args()
    if args.env_file and not args.env_file.is_file():
        parser.error("--env-file must name an existing file")
    load_dotenv(args.env_file)
    uvicorn.run(create_app(), host="127.0.0.1", port=args.port)


if __name__ == "__main__":
    main()
