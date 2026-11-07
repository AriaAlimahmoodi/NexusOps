"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getItemCountByConnectionType = getItemCountByConnectionType;
const n8n_workflow_1 = require("n8n-workflow");
function getItemCountByConnectionType(data) {
    const itemCountByConnectionType = {};
    for (const [connectionType, connectionData] of Object.entries(data ?? {})) {
        if (!(0, n8n_workflow_1.isNodeConnectionType)(connectionType)) {
            continue;
        }
        if (Array.isArray(connectionData)) {
            itemCountByConnectionType[connectionType] = connectionData.map((d) => (d ? d.length : 0));
        }
        else {
            itemCountByConnectionType[connectionType] = [0];
        }
    }
    return itemCountByConnectionType;
}
//# sourceMappingURL=get-item-count-by-connection-type.js.map