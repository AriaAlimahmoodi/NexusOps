import { ReadStream, statSync } from "node:fs";
import { runtimeConfigShared as shared } from "./runtimeConfig.shared";
export const runtimeConfig = {
    ...shared,
    runtime: "node",
    statSync,
    isFileReadStream(f) {
        return f instanceof ReadStream;
    },
};
