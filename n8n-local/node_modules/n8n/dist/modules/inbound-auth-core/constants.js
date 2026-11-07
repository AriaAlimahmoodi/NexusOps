"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_TRUSTED_SOURCE_CONFIG = exports.SYSTEM_TRUSTED_SOURCE_NAME = exports.SYSTEM_TRUSTED_SOURCE_ID = void 0;
exports.SYSTEM_TRUSTED_SOURCE_ID = 'n8n-internal';
exports.SYSTEM_TRUSTED_SOURCE_NAME = 'n8n';
exports.SYSTEM_TRUSTED_SOURCE_CONFIG = {
    version: 1,
    authentication: {
        type: 'oauth2',
        discovery: { mode: 'auto' },
        keys: { kind: 'local-keystore' },
        verification: { mode: 'jwt' },
        client: { kind: 'virtual' },
    },
    surfaces: { 'public-api': {}, 'instance-mcp': {}, trigger: {} },
    identity: {
        subject: 'n8n-user-id',
        claimMapping: { subject: 'sub', clientId: 'client_id', scopes: 'scope' },
        linkByEmail: 'off',
        provision: { human: 'off' },
        roleMapping: { mode: 'off', instanceRoleRules: [], projectRoleRules: [] },
    },
};
//# sourceMappingURL=constants.js.map