"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registryQueryTerms = void 0;
exports.matchesRegistryQuery = matchesRegistryQuery;
exports.rankRegistryMatches = rankRegistryMatches;
exports.findRegistryMatches = findRegistryMatches;
const MIN_TERM_LENGTH = 3;
const STOP_WORDS = new Set([
    'and',
    'api',
    'app',
    'for',
    'from',
    'n8n',
    'node',
    'nodes',
    'official',
    'the',
    'tool',
    'with',
]);
const MAX_REGISTRY_MATCHES = 3;
const registryQueryTerms = (query) => {
    const seen = new Set(query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length >= MIN_TERM_LENGTH && !STOP_WORDS.has(term)));
    return [...seen];
};
exports.registryQueryTerms = registryQueryTerms;
const candidateTokens = (entry) => [entry.name, entry.displayName ?? '']
    .join(' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
function matchesRegistryQuery(entry, terms) {
    if (terms.length === 0)
        return false;
    const tokens = candidateTokens(entry);
    if (terms.every((term) => tokens.some((token) => token.startsWith(term))))
        return true;
    if (terms.length > 1) {
        const joined = terms.join('');
        return tokens.some((token) => token.includes(joined));
    }
    return false;
}
function rankRegistryMatches(query, matches) {
    const normalized = query.trim().toLowerCase();
    const rank = (entry) => {
        const displayName = (entry.displayName ?? '').toLowerCase();
        if (displayName === normalized)
            return 0;
        if (displayName.startsWith(normalized))
            return 1;
        return 2;
    };
    return [...matches].sort((a, b) => rank(a) - rank(b) || (b.numberOfDownloads ?? 0) - (a.numberOfDownloads ?? 0));
}
function findRegistryMatches(query, candidates) {
    const terms = (0, exports.registryQueryTerms)(query);
    if (terms.length === 0)
        return [];
    const matches = candidates.filter((candidate) => matchesRegistryQuery(candidate, terms));
    return rankRegistryMatches(query, matches).slice(0, MAX_REGISTRY_MATCHES);
}
//# sourceMappingURL=registry-lookup.js.map