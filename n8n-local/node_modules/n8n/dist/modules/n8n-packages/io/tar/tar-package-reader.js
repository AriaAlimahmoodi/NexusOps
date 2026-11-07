"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TarPackageReader = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const node_path_1 = __importDefault(require("node:path"));
const tar_1 = require("tar");
const errors_1 = require("@n8n/errors");
const MANIFEST_PATH = 'manifest.json';
const ALLOWED_PATH_CHARS = /^[a-zA-Z0-9._/-]+$/;
class TarPackageReader {
    constructor(buffer, limits) {
        this.buffer = buffer;
        this.limits = limits;
        this.entries = null;
    }
    async readManifest() {
        const entries = await this.load();
        const manifest = entries.get(MANIFEST_PATH);
        if (!manifest) {
            throw new errors_1.BadRequestError('Package is missing manifest.json');
        }
        try {
            return (0, n8n_workflow_1.jsonParse)(manifest.toString('utf-8'));
        }
        catch {
            throw new errors_1.BadRequestError('Package manifest is not valid JSON');
        }
    }
    async readFile(entryPath) {
        const entries = await this.load();
        const content = entries.get(entryPath);
        if (!content) {
            throw new errors_1.BadRequestError(`Package does not contain entry: ${entryPath}`);
        }
        return content;
    }
    async listEntries() {
        const entries = await this.load();
        return Array.from(entries.keys());
    }
    async load() {
        if (this.entries)
            return this.entries;
        this.entries = await this.parse();
        return this.entries;
    }
    validateEntryPath(rawPath) {
        const trimmed = rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;
        if (trimmed.length === 0) {
            throw new errors_1.BadRequestError('Package contains an entry with an empty path');
        }
        if (trimmed.length > this.limits.maxPathLength) {
            throw new errors_1.BadRequestError('Package entry path exceeds the maximum allowed length');
        }
        if (trimmed.startsWith('/')) {
            throw new errors_1.BadRequestError(`Package entry path "${trimmed}" must be relative`);
        }
        if (!ALLOWED_PATH_CHARS.test(trimmed)) {
            throw new errors_1.BadRequestError(`Package entry path "${trimmed}" contains disallowed characters`);
        }
        const normalized = node_path_1.default.posix.normalize(trimmed);
        if (normalized === '..' ||
            normalized.startsWith('../') ||
            normalized.includes('/../') ||
            normalized.endsWith('/..')) {
            throw new errors_1.BadRequestError(`Package entry path "${trimmed}" attempts to escape the package root`);
        }
        return normalized;
    }
    async parse() {
        const { maxEntries, maxEntryBytes, maxUncompressedBytes } = this.limits;
        const entries = new Map();
        let totalUncompressedBytes = 0;
        let entryCount = 0;
        let firstFileSeen = false;
        return await new Promise((resolve, reject) => {
            const parser = new tar_1.Parser({ strict: true });
            let aborted = false;
            const fail = (message) => {
                if (aborted)
                    return;
                aborted = true;
                try {
                    parser.abort(new Error(message));
                }
                catch {
                }
                reject(new errors_1.BadRequestError(message));
            };
            const accept = (entry) => {
                if (++entryCount > maxEntries) {
                    throw new errors_1.BadRequestError('Package contains too many entries');
                }
                if (entry.type !== 'File' && entry.type !== 'Directory') {
                    throw new errors_1.BadRequestError(`Package contains a disallowed entry type for "${entry.path}"`);
                }
                const safePath = this.validateEntryPath(entry.path);
                if (entries.has(safePath)) {
                    throw new errors_1.BadRequestError(`Package contains a duplicate entry for "${safePath}"`);
                }
                if (entry.type === 'Directory')
                    return null;
                if (!firstFileSeen) {
                    firstFileSeen = true;
                    if (safePath !== MANIFEST_PATH) {
                        throw new errors_1.BadRequestError(`Package must begin with ${MANIFEST_PATH} but found "${safePath}"`);
                    }
                }
                return safePath;
            };
            parser.on('entry', (entry) => {
                let validated = null;
                if (!aborted) {
                    try {
                        validated = accept(entry);
                    }
                    catch (error) {
                        fail(error instanceof errors_1.BadRequestError ? error.message : 'Invalid package entry path');
                    }
                }
                if (validated === null) {
                    entry.resume();
                    return;
                }
                const safePath = validated;
                const chunks = [];
                let entryBytes = 0;
                entry.on('data', (chunk) => {
                    if (aborted)
                        return;
                    entryBytes += chunk.length;
                    if (entryBytes > maxEntryBytes) {
                        fail(`Package entry "${safePath}" exceeds the maximum allowed uncompressed size per entry`);
                        return;
                    }
                    totalUncompressedBytes += chunk.length;
                    if (totalUncompressedBytes > maxUncompressedBytes) {
                        fail('Package exceeds the maximum allowed uncompressed size');
                        return;
                    }
                    chunks.push(chunk);
                });
                entry.on('end', () => {
                    if (!aborted)
                        entries.set(safePath, Buffer.concat(chunks));
                });
                entry.resume();
            });
            parser.on('error', () => {
                if (aborted)
                    return;
                aborted = true;
                reject(new errors_1.BadRequestError('Failed to read package archive'));
            });
            parser.on('end', () => {
                if (!aborted)
                    resolve(entries);
            });
            parser.end(this.buffer);
        });
    }
}
exports.TarPackageReader = TarPackageReader;
//# sourceMappingURL=tar-package-reader.js.map