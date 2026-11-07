"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDIS_KEY_PATTERNS = exports.REGISTRY_CONSTANTS = void 0;
exports.REGISTRY_CONSTANTS = {
    HEARTBEAT_INTERVAL_MS: 30_000,
    REGISTRATION_TTL_SECONDS: 60,
    RECONCILIATION_INTERVAL_SECONDS: 180,
    OPERATION_TIMEOUT_MS: 5_000,
    STATE_TTL_SECONDS: 300,
};
exports.REDIS_KEY_PATTERNS = {
    instanceKey: (prefix, instanceKey) => `${prefix}:{instance:}${instanceKey}`,
    membershipSet: (prefix) => `${prefix}:{instance:}members`,
    stateKey: (prefix) => `${prefix}:{instance:}state`,
};
//# sourceMappingURL=instance-registry.types.js.map