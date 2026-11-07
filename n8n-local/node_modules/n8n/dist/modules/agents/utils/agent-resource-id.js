"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAgentResourceId = generateAgentResourceId;
const generate_nano_id_1 = require("@n8n/utils/generate-nano-id");
function generateAgentResourceId(prefix, existingIds = []) {
    const existing = new Set(existingIds);
    for (let attempt = 0; attempt < 10; attempt++) {
        const id = `${prefix}_${(0, generate_nano_id_1.generateNanoId)()}`;
        if (!existing.has(id))
            return id;
    }
    throw new Error(`Could not generate unique ${prefix} id`);
}
//# sourceMappingURL=agent-resource-id.js.map