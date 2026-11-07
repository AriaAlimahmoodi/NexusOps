"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashingPackageWriter = void 0;
const node_crypto_1 = require("node:crypto");
class HashingPackageWriter {
    constructor() {
        this.hashes = new Map();
    }
    writeFile(path, content) {
        const normalised = path.startsWith('./') ? path.slice(2) : path;
        const blobSha = (0, node_crypto_1.createHash)('sha1')
            .update(`blob ${Buffer.byteLength(content)}\0`)
            .update(content)
            .digest('hex');
        this.hashes.set(normalised, blobSha);
    }
    writeDirectory(_path) {
        return;
    }
    finalize() {
        return Array.from(this.hashes, ([path, blobSha]) => ({ path, blobSha }));
    }
}
exports.HashingPackageWriter = HashingPackageWriter;
//# sourceMappingURL=hashing-package-writer.js.map