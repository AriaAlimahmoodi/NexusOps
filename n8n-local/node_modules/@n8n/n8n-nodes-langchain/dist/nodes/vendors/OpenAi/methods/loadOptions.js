"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFiles = getFiles;
const transport_1 = require("../transport");
async function getFiles() {
    const { data } = await transport_1.apiRequest.call(this, 'GET', '/files', { qs: { purpose: 'assistants' } });
    const returnData = [];
    for (const file of data || []) {
        returnData.push({
            name: file.filename,
            value: file.id,
        });
    }
    return returnData;
}
//# sourceMappingURL=loadOptions.js.map