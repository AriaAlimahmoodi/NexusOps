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
exports.description = exports.upload = exports.list = exports.get = exports.deleteFile = void 0;
const deleteFile = __importStar(require("./delete.operation"));
exports.deleteFile = deleteFile;
const get = __importStar(require("./get.operation"));
exports.get = get;
const list = __importStar(require("./list.operation"));
exports.list = list;
const upload = __importStar(require("./upload.operation"));
exports.upload = upload;
exports.description = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
            {
                name: 'Upload File',
                value: 'upload',
                action: 'Upload a file',
                description: 'Upload a file to the Anthropic API for later use',
            },
            {
                name: 'Get File Metadata',
                value: 'get',
                action: 'Get file metadata',
                description: 'Get metadata for a file from the Anthropic API',
            },
            {
                name: 'List Files',
                value: 'list',
                action: 'List files',
                description: 'List files from the Anthropic API',
            },
            {
                name: 'Delete File',
                value: 'deleteFile',
                action: 'Delete a file',
                description: 'Delete a file from the Anthropic API',
            },
        ],
        default: 'upload',
        displayOptions: {
            show: {
                resource: ['file'],
            },
        },
    },
    ...deleteFile.description,
    ...get.description,
    ...list.description,
    ...upload.description,
];
//# sourceMappingURL=index.js.map