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
exports.description = exports.update = exports.remove = exports.get = exports.create = void 0;
const create = __importStar(require("./create.operation"));
exports.create = create;
const get = __importStar(require("./get.operation"));
exports.get = get;
const remove = __importStar(require("./remove.operation"));
exports.remove = remove;
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
                name: 'Create',
                value: 'create',
                action: 'Create a conversation',
                description: 'Create a conversation',
            },
            {
                name: 'Get',
                value: 'get',
                action: 'Get a conversation',
                description: 'Get a conversation',
            },
            {
                name: 'Remove',
                value: 'remove',
                action: 'Remove a conversation',
                description: 'Remove a conversation',
            },
            {
                name: 'Update',
                value: 'update',
                action: 'Update a conversation',
                description: 'Update a conversation',
            },
        ],
        default: 'create',
        displayOptions: {
            show: {
                resource: ['conversation'],
            },
        },
    },
    ...create.description,
    ...remove.description,
    ...update.description,
    ...get.description,
];
//# sourceMappingURL=index.js.map