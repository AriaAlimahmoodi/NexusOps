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
exports.description = exports.update = exports.list = exports.message = exports.deleteAssistant = exports.create = void 0;
const create = __importStar(require("./create.operation"));
exports.create = create;
const deleteAssistant = __importStar(require("./deleteAssistant.operation"));
exports.deleteAssistant = deleteAssistant;
const list = __importStar(require("./list.operation"));
exports.list = list;
const message = __importStar(require("./message.operation"));
exports.message = message;
const update = __importStar(require("./update.operation"));
exports.update = update;
exports.description = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
            {
                name: 'Create an Assistant',
                value: 'create',
                action: 'Create an assistant',
                description: 'Create a new assistant',
            },
            {
                name: 'Delete an Assistant',
                value: 'deleteAssistant',
                action: 'Delete an assistant',
                description: 'Delete an assistant from the account',
            },
            {
                name: 'List Assistants',
                value: 'list',
                action: 'List assistants',
                description: 'List assistants in the organization',
            },
            {
                name: 'Message an Assistant',
                value: 'message',
                action: 'Message an assistant',
                description: 'Send messages to an assistant',
            },
            {
                name: 'Update an Assistant',
                value: 'update',
                action: 'Update an assistant',
                description: 'Update an existing assistant',
            },
        ],
        default: 'message',
        displayOptions: {
            show: {
                resource: ['assistant'],
            },
        },
    },
    ...create.description,
    ...deleteAssistant.description,
    ...message.description,
    ...list.description,
    ...update.description,
];
//# sourceMappingURL=index.js.map