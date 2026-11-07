"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyTokenManager = void 0;
const get_jwt_expiry_1 = require("@n8n/utils/get-jwt-expiry");
const n8n_workflow_1 = require("n8n-workflow");
class ProxyTokenManager {
    constructor(fetchToken, refreshThreshold = 0.8) {
        this.fetchToken = fetchToken;
        this.refreshThreshold = refreshThreshold;
        this.cached = null;
        this.refreshPromise = null;
    }
    async getAuthHeaders() {
        const token = await this.getValidToken();
        return { Authorization: `${token.tokenType} ${token.accessToken}` };
    }
    async getValidToken() {
        if (this.cached && !this.isExpiringSoon())
            return this.cached;
        return await this.refresh();
    }
    isExpiringSoon() {
        if (!this.cached)
            return true;
        return Date.now() >= this.cached.refreshAfter;
    }
    async refresh() {
        if (this.refreshPromise)
            return await this.refreshPromise;
        this.refreshPromise = this.doRefresh();
        try {
            return await this.refreshPromise;
        }
        finally {
            this.refreshPromise = null;
        }
    }
    async doRefresh() {
        const result = await this.fetchToken();
        const now = Date.now();
        const exp = (0, get_jwt_expiry_1.getJwtExpiry)(result.accessToken);
        if (!exp)
            throw new n8n_workflow_1.UnexpectedError('Proxy token JWT is missing the exp claim');
        const ttl = exp * 1000 - now;
        this.cached = {
            ...result,
            refreshAfter: now + ttl * this.refreshThreshold,
        };
        return this.cached;
    }
}
exports.ProxyTokenManager = ProxyTokenManager;
//# sourceMappingURL=proxy-token-manager.js.map