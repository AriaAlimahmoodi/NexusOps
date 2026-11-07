"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOT_TRANSFERRED_PROJECT_RESOURCES = exports.TRANSFERRED_PROJECT_RESOURCES = void 0;
const ownership_transfer_manifest_json_1 = __importDefault(require("./ownership-transfer.manifest.json"));
exports.TRANSFERRED_PROJECT_RESOURCES = ownership_transfer_manifest_json_1.default.transferred;
exports.NOT_TRANSFERRED_PROJECT_RESOURCES = ownership_transfer_manifest_json_1.default.notTransferred;
//# sourceMappingURL=ownership-transfer.manifest.js.map