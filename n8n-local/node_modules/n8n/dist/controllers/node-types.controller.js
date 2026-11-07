"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeTypesController = void 0;
const api_types_1 = require("@n8n/api-types");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const get_1 = __importDefault(require("lodash/get"));
const semver_1 = require("semver");
const node_types_1 = require("../node-types");
function parseNodeTypeIdentifier(identifier) {
    const atIndex = identifier.lastIndexOf('@');
    if (atIndex === -1)
        return null;
    const name = identifier.substring(0, atIndex);
    if (!name)
        return null;
    const versionStr = identifier.substring(atIndex + 1);
    if (!(0, semver_1.coerce)(versionStr))
        return null;
    return { name, version: parseFloat(versionStr) };
}
let NodeTypesController = class NodeTypesController {
    constructor(nodeTypes, globalConfig) {
        this.nodeTypes = nodeTypes;
        this.globalConfig = globalConfig;
    }
    async getNodeInfo(req) {
        const nodeInfos = (0, get_1.default)(req, 'body.nodeInfos', []);
        const defaultLocale = this.globalConfig.defaultLocale;
        const descriptions = await Promise.all(nodeInfos.map(async ({ name, version }) => {
            return await this.nodeTypes.getDescriptionWithTranslation(name, version, defaultLocale);
        }));
        return descriptions;
    }
    async getNodeTypesByIdentifier(payload) {
        const { identifiers = [] } = payload;
        const defaultLocale = this.globalConfig.defaultLocale;
        const nodeTypes = [];
        for (const identifier of identifiers) {
            const parsed = parseNodeTypeIdentifier(identifier);
            if (!parsed)
                continue;
            try {
                const description = await this.nodeTypes.getDescriptionWithTranslation(parsed.name, parsed.version, defaultLocale);
                nodeTypes.push(description);
            }
            catch {
            }
        }
        return nodeTypes;
    }
};
exports.NodeTypesController = NodeTypesController;
__decorate([
    (0, decorators_1.Post)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NodeTypesController.prototype, "getNodeInfo", null);
__decorate([
    (0, decorators_1.Post)('/by-identifier'),
    __param(0, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [api_types_1.GetNodeTypesByIdentifierRequestDto]),
    __metadata("design:returntype", Promise)
], NodeTypesController.prototype, "getNodeTypesByIdentifier", null);
exports.NodeTypesController = NodeTypesController = __decorate([
    (0, decorators_1.RestController)('/node-types'),
    __metadata("design:paramtypes", [node_types_1.NodeTypes, config_1.GlobalConfig])
], NodeTypesController);
//# sourceMappingURL=node-types.controller.js.map