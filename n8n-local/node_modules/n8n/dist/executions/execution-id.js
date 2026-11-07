"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExecutionIdV2 = exports.isExecutionIdV1 = exports.isExecutionIdV2 = void 0;
const constants_1 = require("@n8n/constants");
const uuid_1 = require("uuid");
const isExecutionIdV2 = (id) => constants_1.UUID_V7_PATTERN.test(id);
exports.isExecutionIdV2 = isExecutionIdV2;
const MAX_EXECUTION_ID_V1 = 2 ** 31 - 1;
const isExecutionIdV1 = (id) => /^\d+$/.test(id) && Number(id) <= MAX_EXECUTION_ID_V1;
exports.isExecutionIdV1 = isExecutionIdV1;
const createExecutionIdV2 = () => (0, uuid_1.v7)();
exports.createExecutionIdV2 = createExecutionIdV2;
//# sourceMappingURL=execution-id.js.map