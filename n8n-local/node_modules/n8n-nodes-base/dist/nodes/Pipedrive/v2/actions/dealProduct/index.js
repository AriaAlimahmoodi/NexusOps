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
exports.description = exports.update = exports.remove = exports.getAll = exports.add = void 0;
const add = __importStar(require("./add.operation"));
exports.add = add;
const getAll = __importStar(require("./getAll.operation"));
exports.getAll = getAll;
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
        displayOptions: {
            show: {
                resource: ['dealProduct'],
            },
        },
        options: [
            {
                name: 'Add',
                value: 'add',
                description: 'Add a product to a deal',
                action: 'Add a product to a deal',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Get many products of a deal',
                action: 'Get many products of a deal',
            },
            {
                name: 'Remove',
                value: 'remove',
                description: 'Remove a product from a deal',
                action: 'Remove a product from a deal',
            },
            {
                name: 'Update',
                value: 'update',
                description: 'Update a product in a deal',
                action: 'Update a product in a deal',
            },
        ],
        default: 'add',
    },
    ...add.description,
    ...getAll.description,
    ...remove.description,
    ...update.description,
];
//# sourceMappingURL=index.js.map