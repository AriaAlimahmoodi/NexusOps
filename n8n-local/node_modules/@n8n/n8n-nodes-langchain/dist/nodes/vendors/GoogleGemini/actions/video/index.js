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
exports.description = exports.generate = exports.download = exports.analyze = void 0;
const analyze = __importStar(require("./analyze.operation"));
exports.analyze = analyze;
const download = __importStar(require("./download.operation"));
exports.download = download;
const generate = __importStar(require("./generate.operation"));
exports.generate = generate;
exports.description = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
            {
                name: 'Analyze Video',
                value: 'analyze',
                action: 'Analyze video',
                description: 'Take in videos and answer questions about them',
            },
            {
                name: 'Generate a Video',
                value: 'generate',
                action: 'Generate a video',
                description: 'Creates a video from a text prompt',
            },
            {
                name: 'Download Video',
                value: 'download',
                action: 'Download a video',
                description: 'Download a generated video from the Google Gemini API using a URL',
            },
        ],
        default: 'generate',
        displayOptions: {
            show: {
                resource: ['video'],
            },
        },
    },
    ...analyze.description,
    ...download.description,
    ...generate.description,
];
//# sourceMappingURL=index.js.map