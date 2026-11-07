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
exports.router = router;
const n8n_workflow_1 = require("n8n-workflow");
const error_handling_1 = require("../../helpers/error-handling");
const audio = __importStar(require("./audio"));
const conversation = __importStar(require("./conversation"));
const file = __importStar(require("./file"));
const image = __importStar(require("./image"));
const text = __importStar(require("./text"));
const video = __importStar(require("./video"));
async function router() {
    const returnData = [];
    const items = this.getInputData();
    const resource = this.getNodeParameter('resource', 0);
    const operation = this.getNodeParameter('operation', 0);
    const openAiTypeData = {
        resource,
        operation,
    };
    let execute;
    switch (openAiTypeData.resource) {
        case 'audio':
            execute = audio[openAiTypeData.operation].execute;
            break;
        case 'file':
            execute = file[openAiTypeData.operation].execute;
            break;
        case 'image':
            execute = image[openAiTypeData.operation].execute;
            break;
        case 'text':
            execute = text[openAiTypeData.operation].execute;
            break;
        case 'conversation':
            execute = conversation[openAiTypeData.operation].execute;
            break;
        case 'video':
            execute = video[openAiTypeData.operation].execute;
            break;
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `The operation "${operation}" is not supported!`);
    }
    for (let i = 0; i < items.length; i++) {
        try {
            const responseData = await execute.call(this, i);
            returnData.push(...responseData);
        }
        catch (error) {
            if (this.continueOnFail()) {
                returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
                continue;
            }
            if (error instanceof n8n_workflow_1.NodeApiError) {
                const errorCode = error.cause?.error?.error?.code;
                if (errorCode) {
                    const customErrorMessage = (0, error_handling_1.getCustomErrorMessage)(errorCode);
                    if (customErrorMessage) {
                        error.message = customErrorMessage;
                    }
                }
                error.context = {
                    itemIndex: i,
                };
                throw error;
            }
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, {
                itemIndex: i,
                description: error.description,
            });
        }
    }
    return [returnData];
}
//# sourceMappingURL=router.js.map