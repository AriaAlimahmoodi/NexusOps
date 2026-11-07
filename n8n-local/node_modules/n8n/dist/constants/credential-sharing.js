"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCredSharingEnabled = isCredSharingEnabled;
const backend_common_1 = require("@n8n/backend-common");
function isCredSharingEnabled() {
    return (0, backend_common_1.isEnvFeatureEnabled)('N8N_ENV_FEAT_CRED_SHARING');
}
//# sourceMappingURL=credential-sharing.js.map