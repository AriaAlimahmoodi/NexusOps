"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isKeyRotationEnabled = isKeyRotationEnabled;
const backend_common_1 = require("@n8n/backend-common");
function isKeyRotationEnabled() {
    return (0, backend_common_1.isEnvFeatureEnabled)('N8N_ENV_FEAT_ENCRYPTION_KEY_ROTATION');
}
//# sourceMappingURL=key-rotation-flag.js.map