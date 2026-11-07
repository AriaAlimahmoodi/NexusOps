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
exports.description = void 0;
const GenericFunctions_1 = require("../../GenericFunctions");
const createContextualized = __importStar(require("./createContextualized.operation"));
const createEmbedding = __importStar(require("./createEmbedding.operation"));
exports.description = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['embedding'],
            },
        },
        options: [
            {
                name: 'Create Embedding',
                value: 'createEmbedding',
                action: 'Create an embedding',
                description: 'Generate vector embeddings for text input',
                routing: {
                    request: {
                        method: 'POST',
                        url: '/v1/embeddings',
                    },
                    output: {
                        postReceive: [GenericFunctions_1.embeddingsErrorPostReceive],
                    },
                },
            },
            {
                name: 'Create Contextualized Embedding',
                value: 'createContextualized',
                action: 'Create a contextualized embedding',
                description: 'Generate context-aware embeddings for document chunks',
                routing: {
                    request: {
                        method: 'POST',
                        url: '/v1/contextualizedembeddings',
                    },
                    output: {
                        postReceive: [GenericFunctions_1.embeddingsErrorPostReceive],
                    },
                },
            },
        ],
        default: 'createEmbedding',
    },
    ...createEmbedding.description,
    ...createContextualized.description,
];
//# sourceMappingURL=Embeddings.resource.js.map