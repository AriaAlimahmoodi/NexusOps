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
exports.description = exports.templatize = exports.improve = exports.generate = void 0;
const generate = __importStar(require("./generate.operation"));
exports.generate = generate;
const improve = __importStar(require("./improve.operation"));
exports.improve = improve;
const templatize = __importStar(require("./templatize.operation"));
exports.templatize = templatize;
exports.description = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
            {
                name: 'Generate Prompt',
                value: 'generate',
                action: 'Generate a prompt',
                description: 'Generate a prompt for a model',
            },
            {
                name: 'Improve Prompt',
                value: 'improve',
                action: 'Improve a prompt',
                description: 'Improve a prompt for a model',
            },
            {
                name: 'Templatize Prompt',
                value: 'templatize',
                action: 'Templatize a prompt',
                description: 'Templatize a prompt for a model',
            },
        ],
        default: 'generate',
        displayOptions: {
            show: {
                resource: ['prompt'],
            },
        },
    },
    {
        displayName: 'The <a href="https://docs.anthropic.com/en/api/prompt-tools-generate">prompt tools APIs</a> are in a closed research preview. Your organization must request access to use them.',
        name: 'experimentalNotice',
        type: 'notice',
        default: '',
        displayOptions: {
            show: {
                resource: ['prompt'],
            },
        },
    },
    ...generate.description,
    ...improve.description,
    ...templatize.description,
];
//# sourceMappingURL=index.js.map