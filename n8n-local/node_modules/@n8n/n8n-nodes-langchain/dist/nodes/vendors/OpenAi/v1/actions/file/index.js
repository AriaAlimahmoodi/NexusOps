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
exports.description = exports.list = exports.deleteFile = exports.upload = void 0;
const deleteFile = __importStar(require("./deleteFile.operation"));
exports.deleteFile = deleteFile;
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
                name: 'Delete a File',
                value: 'deleteFile',
                action: 'Delete a file',
                description: 'Delete a file from the server',
            },
            {
                name: 'List Files',
                value: 'list',
                action: 'List files',
                description: "Returns a list of files that belong to the user's organization",
            },
            {
                name: 'Upload a File',
                value: 'upload',
                action: 'Upload a file',
                description: 'Upload a file that can be used across various endpoints',
            },
        ],
        default: 'upload',
        displayOptions: {
            show: {
                resource: ['file'],
            },
        },
    },
    ...upload.description,
    ...deleteFile.description,
    ...list.description,
];
//# sourceMappingURL=index.js.map