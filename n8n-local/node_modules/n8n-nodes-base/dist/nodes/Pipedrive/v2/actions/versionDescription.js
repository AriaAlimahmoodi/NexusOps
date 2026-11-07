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
exports.versionDescription = void 0;
/* eslint-disable n8n-nodes-base/node-filename-against-convention */
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
exports.versionDescription = {
    displayName: 'Pipedrive',
    name: 'pipedrive',
    icon: 'file:pipedrive.svg',
    group: ['transform'],
    version: 2,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Create and edit data in Pipedrive',
    defaults: {
        name: 'Pipedrive',
    },
    inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
    outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
    credentials: [
        {
            name: 'pipedriveApi',
            required: true,
            displayOptions: {
                show: {
                    authentication: ['apiToken'],
                },
            },
            testedBy: {
                request: {
                    method: 'GET',
                    url: '/users/me',
                },
            },
        },
        {
            name: 'pipedriveOAuth2Api',
            required: true,
            displayOptions: {
                show: {
                    authentication: ['oAuth2'],
                },
            },
        },
    ],
    // baseURL is v1 because it's only used by the credential testedBy request (GET /users/me)
    // which has no v2 equivalent. All v2 operations construct their own URLs via the transport layer.
    requestDefaults: {
        baseURL: 'https://api.pipedrive.com/v1',
        url: '',
    },
    properties: [
        {
            displayName: 'Authentication',
            name: 'authentication',
            type: 'options',
            options: [
                {
                    name: 'API Token',
                    value: 'apiToken',
                },
                {
                    name: 'OAuth2',
                    value: 'oAuth2',
                },
            ],
            default: 'apiToken',
        },
        {
            displayName: 'Resource',
            name: 'resource',
            type: 'options',
            noDataExpression: true,
            options: [
                {
                    name: 'Activity',
                    value: 'activity',
                },
                {
                    name: 'Deal',
                    value: 'deal',
                },
                {
                    name: 'Deal Product',
                    value: 'dealProduct',
                },
                {
                    name: 'File',
                    value: 'file',
                },
                {
                    name: 'Lead',
                    value: 'lead',
                },
                {
                    name: 'Note',
                    value: 'note',
                },
                {
                    name: 'Organization',
                    value: 'organization',
                },
                {
                    name: 'Person',
                    value: 'person',
                },
                {
                    name: 'Product',
                    value: 'product',
                },
            ],
            default: 'deal',
        },
        ...activity.description,
        ...deal.description,
        ...dealProduct.description,
        ...file.description,
        ...lead.description,
        ...note.description,
        ...organization.description,
        ...person.description,
        ...product.description,
    ],
};
//# sourceMappingURL=versionDescription.js.map