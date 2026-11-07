"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionStoredConnectionTargetSchema = void 0;
exports.repositoryPathFromUrl = repositoryPathFromUrl;
exports.storePromotionTarget = storePromotionTarget;
exports.resolvePromotionTarget = resolvePromotionTarget;
exports.resolvePromotionGitTarget = resolvePromotionGitTarget;
exports.repositoryUrlFromPath = repositoryUrlFromPath;
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
const errors_1 = require("@n8n/errors");
const repositoryPathSchema = zod_1.z.string().refine((value) => {
    const segments = value.split('/');
    return (segments.length >= 2 &&
        segments.every((segment) => segment !== '' && segment !== '.' && segment !== '..') &&
        !/[\\%?#:@\s\p{Cc}]/u.test(value));
});
exports.promotionStoredConnectionTargetSchema = zod_1.z.union([
    api_types_1.promotionConnectionTargetSchema,
    zod_1.z.object({ schemaVersion: zod_1.z.literal(1), repositoryPath: repositoryPathSchema }).strict(),
]);
function repositoryPathFromUrl(baseUrl, remoteUrl) {
    const parsed = api_types_1.promotionGitHostBaseUrlSchema.safeParse(remoteUrl);
    if (!parsed.success) {
        throw new errors_1.BadRequestError('Use an HTTP(S) repository URL without credentials, a query, or a fragment.');
    }
    const base = new URL(baseUrl);
    const remote = new URL(parsed.data);
    const prefix = `${base.pathname.replace(/\/$/, '')}/`;
    if (remote.origin !== base.origin || !remote.pathname.startsWith(prefix)) {
        throw new errors_1.BadRequestError('The repository URL must use the saved GitLab base URL.');
    }
    let path;
    try {
        path = decodeURIComponent(remote.pathname.slice(prefix.length))
            .replace(/\/$/, '')
            .replace(/\.git$/, '');
    }
    catch {
        throw new errors_1.BadRequestError('The repository URL contains an invalid path.');
    }
    if (!repositoryPathSchema.safeParse(path).success) {
        throw new errors_1.BadRequestError('Use a repository URL with a namespace and repository name.');
    }
    return path;
}
function storePromotionTarget(provider, target) {
    if (!(0, api_types_1.isPromotionGitHostType)(provider.type))
        return target;
    return {
        schemaVersion: 1,
        repositoryPath: repositoryPathFromUrl(hostBaseUrl(provider), target.remoteUrl),
    };
}
function resolvePromotionTarget(provider, stored) {
    const parsed = exports.promotionStoredConnectionTargetSchema.safeParse(stored);
    if (!parsed.success)
        throw new errors_1.BadRequestError('The stored connection target cannot be read');
    if ('remoteUrl' in parsed.data)
        return parsed.data;
    if (!(0, api_types_1.isPromotionGitHostType)(provider.type)) {
        throw new errors_1.BadRequestError('Plain Git connections need a remote URL. Update the connection target.');
    }
    return {
        schemaVersion: 1,
        remoteUrl: repositoryUrlFromPath(hostBaseUrl(provider), parsed.data.repositoryPath),
    };
}
function resolvePromotionGitTarget(provider, stored) {
    const target = resolvePromotionTarget(provider, stored);
    if (!(0, api_types_1.isPromotionGitHostType)(provider.type))
        return target;
    const baseUrl = hostBaseUrl(provider);
    let repositoryPath;
    try {
        repositoryPath = repositoryPathFromUrl(baseUrl, target.remoteUrl);
    }
    catch {
        throw new errors_1.BadRequestError('The saved repository URL does not use the GitLab base URL. Select the repository again.');
    }
    return { schemaVersion: 1, remoteUrl: repositoryUrlFromPath(baseUrl, repositoryPath) };
}
function repositoryUrlFromPath(baseUrl, repositoryPath) {
    if (!repositoryPathSchema.safeParse(repositoryPath).success) {
        throw new errors_1.BadRequestError('The repository path cannot be read. Select the repository again.');
    }
    const path = repositoryPath.split('/').map(encodeURIComponent).join('/');
    return new URL(`${path}.git`, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).href;
}
function hostBaseUrl(provider) {
    const config = api_types_1.promotionGitHostConfigSchema.safeParse(provider.config);
    if (!config.success) {
        throw new errors_1.BadRequestError('The stored provider config cannot be read. Update the provider.');
    }
    return config.data.baseUrl;
}
//# sourceMappingURL=git-host-target.js.map