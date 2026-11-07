"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalize = normalize;
exports.mayReachDirectory = mayReachDirectory;
const node_path_1 = __importDefault(require("node:path"));
const DOT_SEGMENT = /^\.{1,2}$/;
const DOTS_AND_SPACES = /^[. ]+$/;
const TRAILING_DOTS_AND_SPACES = /[. ]+$/;
const TRAILING_SPACES = / +$/;
function tryDecode(requestPath) {
    try {
        return decodeURIComponent(requestPath);
    }
    catch {
        return null;
    }
}
function toSegments(decoded) {
    return decoded.replace(/\\/g, '/').split('/');
}
function trimSegment(segment) {
    const withoutTrailingSpaces = segment.replace(TRAILING_SPACES, '');
    if (DOT_SEGMENT.test(withoutTrailingSpaces))
        return withoutTrailingSpaces;
    return withoutTrailingSpaces.replace(TRAILING_DOTS_AND_SPACES, '');
}
function normalizeSegments(segments) {
    const trimmed = segments.map(trimSegment).filter((segment) => segment !== '');
    return node_path_1.default.posix.normalize(`/${trimmed.join('/')}`).toLowerCase();
}
function normalize(requestPath) {
    const decoded = tryDecode(requestPath) ?? requestPath;
    return normalizeSegments(toSegments(decoded));
}
function mayReachDirectory(requestPath, directory) {
    const decoded = tryDecode(requestPath);
    if (decoded === null)
        return true;
    const lowerDirectory = directory.toLowerCase();
    const segments = toSegments(decoded);
    const normalized = normalizeSegments(segments);
    if (normalized === `/${lowerDirectory}` || normalized.startsWith(`/${lowerDirectory}/`)) {
        return true;
    }
    let hasUnreadableSegment = false;
    let matchesDirectory = false;
    for (const segment of segments) {
        if (DOTS_AND_SPACES.test(segment) && !DOT_SEGMENT.test(segment))
            hasUnreadableSegment = true;
        if (trimSegment(segment).toLowerCase() === lowerDirectory)
            matchesDirectory = true;
    }
    return hasUnreadableSegment && matchesDirectory;
}
//# sourceMappingURL=request-path.js.map