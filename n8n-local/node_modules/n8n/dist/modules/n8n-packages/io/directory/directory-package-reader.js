"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectoryPackageReader = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const errors_1 = require("@n8n/errors");
const MANIFEST_PATH = 'manifest.json';
const ALLOWED_PATH_CHARS = /^[a-zA-Z0-9._/-]+$/;
class DirectoryPackageReader {
    constructor(baseDir, limits) {
        this.baseDir = baseDir;
        this.limits = limits;
    }
    async readManifest() {
        let raw;
        try {
            raw = await this.readWithinBase(MANIFEST_PATH);
        }
        catch {
            throw new errors_1.BadRequestError('Package is missing manifest.json');
        }
        try {
            return (0, n8n_workflow_1.jsonParse)(raw.toString('utf-8'));
        }
        catch {
            throw new errors_1.BadRequestError('Package manifest is not valid JSON');
        }
    }
    async readFile(entryPath) {
        try {
            return await this.readWithinBase(entryPath);
        }
        catch (error) {
            if (error instanceof errors_1.BadRequestError)
                throw error;
            throw new errors_1.BadRequestError(`Package does not contain entry: ${entryPath}`);
        }
    }
    async listEntries() {
        const entries = [];
        let totalBytes = 0;
        await this.walk(this.baseDir, (relativePath, size) => {
            if (entries.length + 1 > this.limits.maxEntries) {
                throw new errors_1.BadRequestError('Package contains too many entries');
            }
            if (relativePath.length > this.limits.maxPathLength) {
                throw new errors_1.BadRequestError('Package entry path exceeds the maximum allowed length');
            }
            if (size > this.limits.maxEntryBytes) {
                throw new errors_1.BadRequestError(`Package entry "${relativePath}" exceeds the maximum allowed uncompressed size per entry`);
            }
            totalBytes += size;
            if (totalBytes > this.limits.maxUncompressedBytes) {
                throw new errors_1.BadRequestError('Package exceeds the maximum allowed uncompressed size');
            }
            entries.push(relativePath);
        });
        return entries;
    }
    async readWithinBase(entryPath) {
        const safePath = this.validateEntryPath(entryPath);
        const absolutePath = this.resolveWithin(safePath);
        const stats = await this.lstatWithoutSymlinks(absolutePath, safePath);
        if (!stats.isFile()) {
            throw new errors_1.BadRequestError(`Package entry is not a file: ${entryPath}`);
        }
        if (stats.size > this.limits.maxEntryBytes) {
            throw new errors_1.BadRequestError(`Package entry "${safePath}" exceeds the maximum allowed uncompressed size per entry`);
        }
        return await (0, promises_1.readFile)(absolutePath);
    }
    async lstatWithoutSymlinks(absolutePath, entryPath) {
        let currentPath = this.baseDir;
        let stats = await (0, promises_1.lstat)(currentPath);
        if (stats.isSymbolicLink()) {
            throw new errors_1.BadRequestError('Package root has a disallowed entry type');
        }
        const relativePath = node_path_1.default.relative(this.baseDir, absolutePath);
        for (const component of relativePath.split(node_path_1.default.sep)) {
            currentPath = node_path_1.default.join(currentPath, component);
            stats = await (0, promises_1.lstat)(currentPath);
            if (stats.isSymbolicLink()) {
                throw new errors_1.BadRequestError(`Package contains a disallowed entry type for "${entryPath}"`);
            }
        }
        return stats;
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
    resolveWithin(safePath) {
        const destination = node_path_1.default.resolve(this.baseDir, safePath);
        const relative = node_path_1.default.relative(this.baseDir, destination);
        if (relative === '' || relative.startsWith('..') || node_path_1.default.isAbsolute(relative)) {
            throw new errors_1.BadRequestError(`Package entry path "${safePath}" attempts to escape the package root`);
        }
        return destination;
    }
    async walk(dir, visit) {
        if ((await (0, promises_1.lstat)(dir)).isSymbolicLink()) {
            const relativeDirPath = node_path_1.default.relative(this.baseDir, dir).split(node_path_1.default.sep).join('/') || '.';
            throw new errors_1.BadRequestError(`Package contains a disallowed entry type for "${relativeDirPath}"`);
        }
        const dirents = await (0, promises_1.readdir)(dir, { withFileTypes: true });
        for (const dirent of dirents) {
            const absolutePath = node_path_1.default.join(dir, dirent.name);
            const relativePath = node_path_1.default.relative(this.baseDir, absolutePath).split(node_path_1.default.sep).join('/');
            const stats = await (0, promises_1.lstat)(absolutePath);
            if (stats.isSymbolicLink()) {
                throw new errors_1.BadRequestError(`Package contains a disallowed entry type for "${relativePath}"`);
            }
            if (stats.isDirectory()) {
                await this.walk(absolutePath, visit);
            }
            else if (stats.isFile()) {
                visit(relativePath, stats.size);
            }
        }
    }
}
exports.DirectoryPackageReader = DirectoryPackageReader;
//# sourceMappingURL=directory-package-reader.js.map