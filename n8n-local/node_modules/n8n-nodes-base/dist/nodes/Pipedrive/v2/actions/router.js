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
const activity = __importStar(require("./activity"));
const deal = __importStar(require("./deal"));
const dealProduct = __importStar(require("./dealProduct"));
const file = __importStar(require("./file"));
const lead = __importStar(require("./lead"));
const note = __importStar(require("./note"));
const organization = __importStar(require("./organization"));
const person = __importStar(require("./person"));
const product = __importStar(require("./product"));
async function router() {
    let returnData = [];
    const resource = this.getNodeParameter('resource', 0);
    const operation = this.getNodeParameter('operation', 0);
    const pipedrive = {
        resource,
        operation,
    };
    switch (pipedrive.resource) {
        case 'activity':
            returnData = await activity[pipedrive.operation].execute.call(this);
            break;
        case 'deal':
            returnData = await deal[pipedrive.operation].execute.call(this);
            break;
        case 'dealProduct':
            returnData = await dealProduct[pipedrive.operation].execute.call(this);
            break;
        case 'file':
            returnData = await file[pipedrive.operation].execute.call(this);
            break;
        case 'lead':
            returnData = await lead[pipedrive.operation].execute.call(this);
            break;
        case 'note':
            returnData = await note[pipedrive.operation].execute.call(this);
            break;
        case 'organization':
            returnData = await organization[pipedrive.operation].execute.call(this);
            break;
        case 'person':
            returnData = await person[pipedrive.operation].execute.call(this);
            break;
        case 'product':
            returnData = await product[pipedrive.operation].execute.call(this);
            break;
        default:
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `The resource "${resource}" is not known`);
    }
    return [returnData];
}
//# sourceMappingURL=router.js.map