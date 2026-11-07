"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMultipartParser = loadMultipartParser;
async function loadMultipartParser(limits) {
    const { default: multer } = await import('multer');
    return multer({ storage: multer.memoryStorage(), limits }).any();
}
//# sourceMappingURL=multipart-parser.js.map