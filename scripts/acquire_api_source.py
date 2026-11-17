"""Acquire any configured HTTP JSON API without source-specific Python code."""
from __future__ import annotations
import argparse,json
from tools.source_engine import acquire_api_source,load_source_config

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config",required=True)
    parser.add_argument("--output-root",default="data/raw/api_sources")
    parser.add_argument("--max-pages",type=int,default=None)
    parser.add_argument("--no-resume",action="store_true")
    args=parser.parse_args()
    config=load_source_config(args.config)
    result=acquire_api_source(config,output_root=args.output_root,resume=not args.no_resume,max_pages=args.max_pages)
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=="__main__": main()
