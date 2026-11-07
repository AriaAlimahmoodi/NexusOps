"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOutputPath = generateOutputPath;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
function generateOutputPath(inputPath, newExtension) {
    const dir = path_1.default.dirname(inputPath);
    const baseName = path_1.default.basename(inputPath, path_1.default.extname(inputPath));
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueId = crypto_1.default.randomBytes(4).toString('hex');
    return path_1.default.join(dir, `${baseName}_${timestamp}_${uniqueId}${newExtension}`);
}
//# sourceMappingURL=utils.js.map