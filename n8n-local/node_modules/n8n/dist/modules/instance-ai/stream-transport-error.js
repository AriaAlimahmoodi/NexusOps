"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStreamTransportError = isStreamTransportError;
const agents_1 = require("@n8n/agents");
const backend_network_1 = require("@n8n/backend-network");
const instance_ai_1 = require("@n8n/instance-ai");
function isStreamTransportError(error) {
    return (!(0, instance_ai_1.isQuotaExhaustedError)(error) &&
        (error instanceof agents_1.ModelStreamStallError || (!(0, backend_network_1.isDnsFailure)(error) && (0, backend_network_1.isTransportFailure)(error))));
}
//# sourceMappingURL=stream-transport-error.js.map