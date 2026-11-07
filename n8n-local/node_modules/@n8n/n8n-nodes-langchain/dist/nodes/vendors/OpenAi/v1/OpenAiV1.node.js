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
exports.OpenAiV1 = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const methods_1 = require("../methods");
const router_1 = require("./actions/router");
const description_1 = require("../helpers/description");
const assistant = __importStar(require("./actions/assistant"));
const audio = __importStar(require("./actions/audio"));
const file = __importStar(require("./actions/file"));
const image = __importStar(require("./actions/image"));
const text = __importStar(require("./actions/text"));
class OpenAiV1 {
    constructor(baseDescription) {
        this.methods = {
            listSearch: methods_1.listSearch,
            loadOptions: methods_1.loadOptions,
        };
        this.description = {
            ...baseDescription,
            version: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8],
            defaults: {
                name: 'OpenAI',
            },
            inputs: `={{(${description_1.configureNodeInputs})($parameter.resource, $parameter.operation, $parameter.hideTools, $parameter.memory ?? undefined)}}`,
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            credentials: [
                {
                    name: 'openAiApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Assistant',
                            value: 'assistant',
                        },
                        {
                            name: 'Text',
                            value: 'text',
                        },
                        {
                            name: 'Image',
                            value: 'image',
                        },
                        {
                            name: 'Audio',
                            value: 'audio',
                        },
                        {
                            name: 'File',
                            value: 'file',
                        },
                    ],
                    default: 'text',
                },
                ...assistant.description,
                ...audio.description,
                ...file.description,
                ...image.description,
                ...text.description,
            ],
        };
    }
    async execute() {
        return await router_1.router.call(this);
    }
}
exports.OpenAiV1 = OpenAiV1;
//# sourceMappingURL=OpenAiV1.node.js.map