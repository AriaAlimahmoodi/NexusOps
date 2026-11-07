"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalGatewayRegistry = void 0;
const nanoid_1 = require("nanoid");
const local_gateway_1 = require("./local-gateway");
const INITIAL_GRACE_MS = 10_000;
const MAX_GRACE_MS = 120_000;
const PAIRING_TOKEN_TTL_MS = 5 * 60 * 1000;
class LocalGatewayRegistry {
    constructor() {
        this.userGateways = new Map();
        this.apiKeyToUserId = new Map();
    }
    generateUniqueKey(prefix) {
        let key;
        do {
            key = `${prefix}_${(0, nanoid_1.nanoid)(32)}`;
        } while (this.apiKeyToUserId.has(key));
        return key;
    }
    getOrCreate(userId) {
        if (!this.userGateways.has(userId)) {
            this.userGateways.set(userId, {
                gateway: new local_gateway_1.LocalGateway(),
                pairingToken: null,
                activeSessionKey: null,
                disconnectTimer: null,
                reconnectCount: 0,
            });
        }
        return this.userGateways.get(userId);
    }
    getUserIdForApiKey(key) {
        const userId = this.apiKeyToUserId.get(key);
        if (!userId)
            return undefined;
        const state = this.userGateways.get(userId);
        if (state?.pairingToken?.token === key) {
            if (Date.now() - state.pairingToken.createdAt > PAIRING_TOKEN_TTL_MS) {
                this.apiKeyToUserId.delete(state.pairingToken.token);
                state.pairingToken = null;
                return undefined;
            }
        }
        return userId;
    }
    generatePairingToken(userId) {
        const state = this.getOrCreate(userId);
        const existing = this.getPairingToken(userId);
        if (existing)
            return existing;
        const token = this.generateUniqueKey('gw');
        state.pairingToken = { token, createdAt: Date.now() };
        this.apiKeyToUserId.set(token, userId);
        return token;
    }
    getPairingToken(userId) {
        const state = this.userGateways.get(userId);
        if (!state?.pairingToken)
            return null;
        if (Date.now() - state.pairingToken.createdAt > PAIRING_TOKEN_TTL_MS) {
            this.apiKeyToUserId.delete(state.pairingToken.token);
            state.pairingToken = null;
            return null;
        }
        return state.pairingToken.token;
    }
    getApiKeyExpiresAt(userId, key) {
        const state = this.userGateways.get(userId);
        if (!state?.pairingToken || state.pairingToken.token !== key)
            return null;
        const token = this.getPairingToken(userId);
        if (!token)
            return null;
        return new Date(state.pairingToken.createdAt + PAIRING_TOKEN_TTL_MS);
    }
    consumePairingToken(userId, token) {
        const state = this.userGateways.get(userId);
        const valid = this.getPairingToken(userId);
        if (!state || !valid || valid !== token)
            return null;
        this.apiKeyToUserId.delete(token);
        state.pairingToken = null;
        const sessionKey = this.generateUniqueKey('sess');
        state.activeSessionKey = sessionKey;
        this.apiKeyToUserId.set(sessionKey, userId);
        return sessionKey;
    }
    getActiveSessionKey(userId) {
        return this.userGateways.get(userId)?.activeSessionKey ?? null;
    }
    clearActiveSessionKey(userId) {
        const state = this.userGateways.get(userId);
        if (!state?.activeSessionKey)
            return;
        this.apiKeyToUserId.delete(state.activeSessionKey);
        state.activeSessionKey = null;
    }
    getGateway(userId) {
        return this.getOrCreate(userId).gateway;
    }
    findGateway(userId) {
        return this.userGateways.get(userId)?.gateway;
    }
    initGateway(userId, data) {
        const state = this.getOrCreate(userId);
        this.clearDisconnectTimer(userId);
        state.reconnectCount = 0;
        state.gateway.init(data);
    }
    resolveGatewayRequest(userId, requestId, result, error) {
        return this.userGateways.get(userId)?.gateway.resolveRequest(requestId, result, error) ?? false;
    }
    disconnectGateway(userId) {
        this.userGateways.get(userId)?.gateway.disconnect();
    }
    getGatewayStatus(userId) {
        return (this.userGateways.get(userId)?.gateway.getStatus() ?? {
            connected: false,
            connectedAt: null,
            directory: null,
            hostIdentifier: null,
            toolCategories: [],
        });
    }
    startDisconnectTimer(userId, onDisconnect) {
        const state = this.getOrCreate(userId);
        this.clearDisconnectTimer(userId);
        const graceMs = Math.min(INITIAL_GRACE_MS * Math.pow(2, state.reconnectCount), MAX_GRACE_MS);
        state.reconnectCount++;
        state.disconnectTimer = setTimeout(() => {
            state.disconnectTimer = null;
            this.disconnectGateway(userId);
            onDisconnect();
        }, graceMs);
    }
    clearDisconnectTimer(userId) {
        const state = this.userGateways.get(userId);
        if (!state?.disconnectTimer)
            return;
        clearTimeout(state.disconnectTimer);
        state.disconnectTimer = null;
    }
    getConnectedUserIds() {
        return [...this.userGateways.entries()]
            .filter(([, state]) => state.gateway.getStatus().connected)
            .map(([userId]) => userId);
    }
    disconnectAll() {
        for (const state of this.userGateways.values()) {
            if (state.disconnectTimer)
                clearTimeout(state.disconnectTimer);
            state.gateway.disconnect();
        }
        this.userGateways.clear();
        this.apiKeyToUserId.clear();
    }
}
exports.LocalGatewayRegistry = LocalGatewayRegistry;
//# sourceMappingURL=local-gateway-registry.js.map