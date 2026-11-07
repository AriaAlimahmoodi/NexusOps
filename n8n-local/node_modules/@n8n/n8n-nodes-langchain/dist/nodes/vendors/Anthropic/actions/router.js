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
const document = __importStar(require("./document"));
const file = __importStar(require("./file"));
const image = __importStar(require("./image"));
const prompt = __importStar(require("./prompt"));
const text = __importStar(require("./text"));
async function router() {
    const returnData = [];
    const items = this.getInputData();
    const resource = this.getNodeParameter('resource', 0);
    const operation = this.getNodeParameter('operation', 0);
    const anthropicTypeData = {
        resource,
        operation,
    };
    let execute;
    switch (anthropicTypeData.resource) {
        case 'document':
            execute = document[anthropicTypeData.operation].execute;
            break;
        case 'file':
            execute = file[anthropicTypeData.operation].execute;
            break;
        case 'image':
            execute = image[anthropicTypeData.operation].execute;
            break;
        case 'prompt':
            execute = prompt[anthropicTypeData.operation].execute;
            break;
        case 'text':
            execute = text[anthropicTypeData.operation].execute;
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
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, {
                itemIndex: i,
                description: error.description,
            });
        }
    }
    return [returnData];
}
//# sourceMappingURL=router.js.map