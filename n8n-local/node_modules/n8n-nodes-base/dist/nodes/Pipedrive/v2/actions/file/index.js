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
exports.description = exports.update = exports.get = exports.download = exports.delete = exports.create = void 0;
const create = __importStar(require("./create.operation"));
exports.create = create;
const deleteFile = __importStar(require("./delete.operation"));
exports.delete = deleteFile;
const download = __importStar(require("./download.operation"));
exports.download = download;
const get = __importStar(require("./get.operation"));
exports.get = get;
const update = __importStar(require("./update.operation"));
exports.update = update;
exports.description = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['file'],
            },
        },
        options: [
            {
                name: 'Create',
                value: 'create',
                description: 'Create a file',
                action: 'Create a file',
            },
            {
                name: 'Delete',
                value: 'delete',
                description: 'Delete a file',
                action: 'Delete a file',
            },
            {
                name: 'Download',
                value: 'download',
                description: 'Download a file',
                action: 'Download a file',
            },
            {
                name: 'Get',
                value: 'get',
                description: 'Get a file',
                action: 'Get a file',
            },
            {
                name: 'Update',
                value: 'update',
                description: 'Update a file',
                action: 'Update a file',
            },
        ],
        default: 'create',
    },
    ...create.description,
    ...deleteFile.description,
    ...download.description,
    ...get.description,
    ...update.description,
];
//# sourceMappingURL=index.js.map