"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSqliteDataSource = getSqliteDataSource;
const typeorm_1 = require("@n8n/typeorm");
const fs = __importStar(require("fs"));
const n8n_workflow_1 = require("n8n-workflow");
const sqlite3 = __importStar(require("sqlite3"));
const temp = __importStar(require("temp"));
async function getSqliteDataSource(binary, binaryPropertyName = 'data') {
    const binaryData = binary?.[binaryPropertyName];
    if (!binaryData) {
        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'No binary data received.');
    }
    let fileBase64;
    if (binaryData.id) {
        const chunkSize = 256 * 1024;
        const stream = await this.helpers.getBinaryStream(binaryData.id, chunkSize);
        const buffer = await this.helpers.binaryToBuffer(stream);
        fileBase64 = buffer.toString('base64');
    }
    else {
        fileBase64 = binaryData.data;
    }
    const bufferString = Buffer.from(fileBase64, n8n_workflow_1.BINARY_ENCODING);
    temp.track();
    const tempDbPath = temp.path({ suffix: '.sqlite' });
    fs.writeFileSync(tempDbPath, bufferString);
    const tempDb = new sqlite3.Database(tempDbPath, (error) => {
        if (error) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Could not connect to database');
        }
    });
    tempDb.close();
    return new typeorm_1.DataSource({
        type: 'sqlite',
        database: tempDbPath,
    });
}
//# sourceMappingURL=sqlite.js.map