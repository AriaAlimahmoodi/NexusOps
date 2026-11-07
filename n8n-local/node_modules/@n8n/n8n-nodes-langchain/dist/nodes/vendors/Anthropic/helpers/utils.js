"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMimeType = getMimeType;
exports.downloadFile = downloadFile;
exports.uploadFile = uploadFile;
exports.splitByComma = splitByComma;
exports.getBaseUrl = getBaseUrl;
const form_data_1 = __importDefault(require("form-data"));
const transport_1 = require("../transport");
function getMimeType(contentType) {
    return contentType?.split(';')?.[0];
}
async function downloadFile(url, qs) {
    const downloadResponse = (await this.helpers.httpRequest({
        method: 'GET',
        url,
        qs,
        returnFullResponse: true,
        encoding: 'arraybuffer',
    }));
    const mimeType = getMimeType(downloadResponse.headers?.['content-type']) ?? 'application/octet-stream';
    const fileContent = Buffer.from(downloadResponse.body);
    return {
        fileContent,
        mimeType,
    };
}
async function uploadFile(fileContent, mimeType, fileName) {
    const form = new form_data_1.default();
    form.append('file', fileContent, {
        filename: fileName ?? 'file',
        contentType: mimeType,
    });
    return (await transport_1.apiRequest.call(this, 'POST', '/v1/files', {
        headers: form.getHeaders(),
        body: form,
    }));
}
function splitByComma(str) {
    return str
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);
}
async function getBaseUrl() {
    const credentials = await this.getCredentials('anthropicApi');
    return (credentials.url ?? 'https://api.anthropic.com');
}
//# sourceMappingURL=utils.js.map