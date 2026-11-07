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
exports.description = exports.uploadToStore = exports.listStores = exports.deleteStore = exports.createStore = void 0;
const createStore = __importStar(require("./createStore.operation"));
exports.createStore = createStore;
const deleteStore = __importStar(require("./deleteStore.operation"));
exports.deleteStore = deleteStore;
const listStores = __importStar(require("./listStores.operation"));
exports.listStores = listStores;
const uploadToStore = __importStar(require("./uploadToStore.operation"));
exports.uploadToStore = uploadToStore;
exports.description = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
            {
                name: 'Create File Search Store',
                value: 'createStore',
                action: 'Create a File Search store',
                description: 'Create a new File Search store for RAG (Retrieval Augmented Generation)',
            },
            {
                name: 'Delete File Search Store',
                value: 'deleteStore',
                action: 'Delete a File Search store',
                description: 'Delete a File Search store',
            },
            {
                name: 'List File Search Stores',
                value: 'listStores',
                action: 'List all File Search stores',
                description: 'List all File Search stores owned by the user',
            },
            {
                name: 'Upload to File Search Store',
                value: 'uploadToStore',
                action: 'Upload a file to a File Search store',
                description: 'Upload a file to a File Search store for RAG (Retrieval Augmented Generation)',
            },
        ],
        default: 'createStore',
        displayOptions: {
            show: {
                resource: ['fileSearch'],
            },
        },
    },
    ...createStore.description,
    ...deleteStore.description,
    ...listStores.description,
    ...uploadToStore.description,
];
//# sourceMappingURL=index.js.map