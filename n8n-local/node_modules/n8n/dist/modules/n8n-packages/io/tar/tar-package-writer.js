"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TarPackageWriter = void 0;
const node_stream_1 = require("node:stream");
const tar_1 = require("tar");
const FIXED_MTIME = new Date(0);
const FILE_MODE = 0o644;
const DIRECTORY_MODE = 0o755;
const MANIFEST_PATH = 'manifest.json';
function normaliseEntryPath(path) {
    return path.startsWith('./') ? path.slice(2) : path;
}
function fileEntry(path, content) {
    const entry = new tar_1.ReadEntry(new tar_1.Header({
        path,
        size: content.length,
        mode: FILE_MODE,
        mtime: FIXED_MTIME,
        type: 'File',
    }));
    entry.end(content);
    return entry;
}
function directoryEntry(path) {
    const normalised = path.endsWith('/') ? path : `${path}/`;
    const entry = new tar_1.ReadEntry(new tar_1.Header({
        path: normalised,
        size: 0,
        mode: DIRECTORY_MODE,
        mtime: FIXED_MTIME,
        type: 'Directory',
    }));
    entry.end();
    return entry;
}
class TarPackageWriter {
    constructor() {
        this.entries = [];
        this.manifest = null;
    }
    writeFile(path, content) {
        const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
        const normalised = normaliseEntryPath(path);
        if (normalised === MANIFEST_PATH) {
            this.manifest = buffer;
            return;
        }
        this.entries.push({ kind: 'file', path: normalised, content: buffer });
    }
    writeDirectory(path) {
        this.entries.push({ kind: 'directory', path: normaliseEntryPath(path) });
    }
    finalize() {
        const pack = new tar_1.Pack({ gzip: { portable: true }, mtime: FIXED_MTIME });
        if (this.manifest) {
            pack.write(fileEntry(MANIFEST_PATH, this.manifest));
        }
        for (const entry of this.entries) {
            if (entry.kind === 'file') {
                pack.write(fileEntry(entry.path, entry.content));
            }
            else {
                pack.write(directoryEntry(entry.path));
            }
        }
        pack.end();
        return node_stream_1.Readable.from(pack);
    }
}
exports.TarPackageWriter = TarPackageWriter;
//# sourceMappingURL=tar-package-writer.js.map