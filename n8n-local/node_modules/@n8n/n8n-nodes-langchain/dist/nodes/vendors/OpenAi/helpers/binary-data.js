"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBinaryDataFile = getBinaryDataFile;
const CHUNK_SIZE = 256 * 1024;
async function getBinaryDataFile(ctx, itemIdx, binaryPropertyData) {
    const binaryData = ctx.helpers.assertBinaryData(itemIdx, binaryPropertyData);
    const fileContent = binaryData.id
        ? await ctx.helpers.getBinaryStream(binaryData.id, CHUNK_SIZE)
        : await ctx.helpers.getBinaryDataBuffer(itemIdx, binaryPropertyData);
    return {
        filename: binaryData.fileName,
        contentType: binaryData.mimeType,
        fileContent,
    };
}
//# sourceMappingURL=binary-data.js.map