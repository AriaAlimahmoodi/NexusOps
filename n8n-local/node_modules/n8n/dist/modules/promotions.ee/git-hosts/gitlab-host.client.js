"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitLabHostClient = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const error_chain_1 = require("@n8n/utils/errors/error-chain");
const sleep_1 = require("@n8n/utils/sleep");
const zod_1 = require("zod");
const errors_1 = require("@n8n/errors");
const git_host_target_1 = require("./git-host-target");
const requestTimeoutMs = 15_000;
const retryDelayMs = 200;
const maxRetryDelayMs = 1_000;
const maxResponseBodyBytes = 1024 * 1024;
const discoveryResponseSizeErrorMessage = 'The results are too large to load. Start again with fewer items.';
const tlsErrorCodes = new Set([
    'CERT_HAS_EXPIRED',
    'DEPTH_ZERO_SELF_SIGNED_CERT',
    'ERR_TLS_CERT_ALTNAME_INVALID',
    'SELF_SIGNED_CERT_IN_CHAIN',
    'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
]);
const knownErrorCodes = new Set([
    ...tlsErrorCodes,
    'ECONNABORTED',
    'ECONNREFUSED',
    'ECONNRESET',
    'EAI_AGAIN',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'ENETDOWN',
    'ENETUNREACH',
    'EPIPE',
    'ENOTFOUND',
    'ERR_RESPONSE_TOO_LARGE',
]);
const identitySchema = zod_1.z.object({ id: zod_1.z.number().int().positive() });
const projectSchema = identitySchema.extend({
    name: zod_1.z.string().min(1),
    path_with_namespace: zod_1.z.string().min(1),
    http_url_to_repo: api_types_1.promotionGitHostBaseUrlSchema,
    default_branch: zod_1.z.string().nullable().default(null),
});
const branchSchema = zod_1.z.object({ name: zod_1.z.string().min(1), default: zod_1.z.boolean() });
let GitLabHostClient = class GitLabHostClient {
    constructor(outboundHttp, logger) {
        this.logger = logger;
        this.http = outboundHttp.requests();
    }
    async validateAccess(access) {
        const user = await this.get(access, 'user', {});
        if (!identitySchema.safeParse(user.body).success)
            throw unexpectedResponse();
        const projects = await this.get(access, 'projects', {
            membership: true,
            simple: true,
            per_page: 1,
            page: 1,
        });
        if (!zod_1.z.array(identitySchema).safeParse(projects.body).success)
            throw unexpectedResponse();
    }
    async listRepositories(access, { offset, limit, search }) {
        const response = await this.get(access, 'projects', {
            simple: true,
            min_access_level: 30,
            order_by: search ? 'similarity' : 'id',
            sort: search ? 'desc' : 'asc',
            per_page: limit,
            page: offset / limit + 1,
            ...(search && { search, search_namespaces: true }),
        }, discoveryResponseSizeErrorMessage);
        const projects = zod_1.z.array(projectSchema).max(limit).safeParse(response.body);
        if (!projects.success)
            throw unexpectedResponse();
        return {
            data: projects.data.map((project) => toRepository(project, access.baseUrl)),
            hasNextPage: hasNextPage(response, offset, limit, projects.data.length),
        };
    }
    async listBranches(access, repositoryId, { offset, limit, search }) {
        const response = await this.get(access, `projects/${encodeURIComponent(repositoryId)}/repository/branches`, {
            per_page: limit,
            page: offset / limit + 1,
            ...(search && { search }),
        }, discoveryResponseSizeErrorMessage);
        const branches = zod_1.z.array(branchSchema).max(limit).safeParse(response.body);
        if (!branches.success)
            throw unexpectedResponse();
        return {
            data: branches.data.map((branch) => ({ name: branch.name, isDefault: branch.default })),
            hasNextPage: hasNextPage(response, offset, limit, branches.data.length),
        };
    }
    async get(access, path, qs, responseSizeErrorMessage = 'GitLab returned a response that is too large. Check the GitLab URL.', attempt = 0) {
        let response;
        try {
            response = await this.http.request({
                method: 'GET',
                url: new URL(`api/v4/${path}`, access.baseUrl.endsWith('/') ? access.baseUrl : `${access.baseUrl}/`).toString(),
                qs,
                headers: { 'PRIVATE-TOKEN': access.accessToken },
                json: true,
                timeout: requestTimeoutMs,
                maxResponseBodyBytes,
                returnFullResponse: true,
                ignoreHttpStatusErrors: true,
                disableFollowRedirect: true,
            });
        }
        catch (error) {
            const chain = (0, error_chain_1.errorChain)(error);
            if (chain.some((cause) => cause instanceof backend_network_1.SsrfBlockedIpError || cause instanceof backend_network_1.SsrfBlockedHostnameError)) {
                this.logger.warn('GitLab request blocked by instance network policy', { path });
                throw new errors_1.BadRequestError('The instance network policy blocks this GitLab URL. Ask an administrator to allow the GitLab hostname or IP address.');
            }
            const codes = chain.flatMap(({ code }) => (typeof code === 'string' ? [code] : []));
            const code = codes.find((value) => tlsErrorCodes.has(value)) ??
                codes.find((value) => knownErrorCodes.has(value)) ??
                'UNKNOWN';
            if (attempt === 0 &&
                code !== 'ENOTFOUND' &&
                !tlsErrorCodes.has(code) &&
                (0, backend_network_1.retryabilityFromError)(error).retryable === 'yes') {
                await (0, sleep_1.sleep)(retryDelayMs);
                return await this.get(access, path, qs, responseSizeErrorMessage, 1);
            }
            this.logger.warn(`GitLab request failed before a response (${code})`, { path });
            if (code === 'ERR_RESPONSE_TOO_LARGE') {
                throw new errors_1.BadRequestError(responseSizeErrorMessage);
            }
            if (tlsErrorCodes.has(code)) {
                throw new errors_1.BadRequestError('Could not verify the GitLab certificate. Check the certificate and configure a trusted certificate authority on the n8n server.');
            }
            if (['ETIMEDOUT', 'ECONNABORTED'].includes(code)) {
                throw new errors_1.ServiceUnavailableError('The GitLab request timed out. Check that GitLab is available and try again.');
            }
            if (code === 'ENOTFOUND') {
                throw new errors_1.BadRequestError('Could not resolve the GitLab hostname. Check the GitLab URL and the n8n server DNS settings.');
            }
            if (code === 'UNKNOWN') {
                throw new errors_1.ServiceUnavailableError('Could not complete the GitLab API request. Try again. If it keeps failing, check the n8n server logs.');
            }
            throw new errors_1.ServiceUnavailableError('Could not reach GitLab at the base URL. Check the URL and try again.');
        }
        if (response.statusCode >= 200 && response.statusCode < 300)
            return response;
        const { retryable, retryAfterMs } = (0, backend_network_1.retryabilityFromError)(response);
        const delayMs = retryAfterMs ?? retryDelayMs;
        if (attempt === 0 && retryable === 'yes' && delayMs <= maxRetryDelayMs) {
            await (0, sleep_1.sleep)(delayMs);
            return await this.get(access, path, qs, responseSizeErrorMessage, 1);
        }
        this.logger.warn('GitLab request failed', { path, status: response.statusCode });
        throw statusError(response.statusCode, path);
    }
};
exports.GitLabHostClient = GitLabHostClient;
exports.GitLabHostClient = GitLabHostClient = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_network_1.OutboundHttp, backend_common_1.Logger])
], GitLabHostClient);
function toRepository(project, baseUrl) {
    return {
        id: String(project.id),
        name: project.name,
        fullPath: project.path_with_namespace,
        remoteUrl: (0, git_host_target_1.repositoryUrlFromPath)(baseUrl, project.path_with_namespace),
        defaultBranch: project.default_branch,
    };
}
function unexpectedResponse() {
    return new errors_1.BadRequestError('GitLab returned an unexpected response. Check the GitLab URL.');
}
function hasNextPage(response, offset, limit, length) {
    const nextPage = response.headers['x-next-page'];
    if (nextPage === undefined)
        return length === limit;
    if (nextPage === '' || nextPage === '0')
        return false;
    if (typeof nextPage !== 'string' || !/^\d+$/.test(nextPage))
        throw unexpectedResponse();
    if (Number(nextPage) !== offset / limit + 2)
        throw unexpectedResponse();
    return true;
}
function statusError(status, path) {
    if (status === 408)
        return new errors_1.ServiceUnavailableError('The GitLab request timed out. Check that GitLab is available and try again.');
    if (status >= 300 && status < 400)
        return new errors_1.BadRequestError('GitLab redirected the request. Use the final GitLab URL.');
    if (status === 401)
        return new errors_1.BadRequestError('GitLab rejected the access token. Update the provider with a valid token.');
    if (status === 403 && path.startsWith('projects/'))
        return new errors_1.BadRequestError("The token can't read this GitLab repository. Check its read_api scope and repository access.");
    if (status === 403)
        return new errors_1.BadRequestError('The access token cannot read the GitLab API. Use a token with the read_api scope.');
    if (status === 404 && path.startsWith('projects/'))
        return new errors_1.NotFoundError('GitLab repository not found. Check that the token can access this repository.');
    if (status === 404)
        return new errors_1.BadRequestError('No GitLab API was found at the base URL. Check the URL.');
    if (status === 429 || status >= 500)
        return new errors_1.ServiceUnavailableError('GitLab is not available. Try again later.');
    return new errors_1.BadRequestError(`GitLab returned status ${status}. Check the provider settings and try again.`);
}
//# sourceMappingURL=gitlab-host.client.js.map