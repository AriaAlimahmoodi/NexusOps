import { ReadStream } from "node:fs";
export declare const runtimeConfig: {
  runtime: string;
  statSync: import("fs").StatSyncFn;
  isFileReadStream(f: unknown): f is ReadStream;
};
