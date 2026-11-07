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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeTypes = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const promises_1 = require("fs/promises");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const path_1 = require("path");
const load_nodes_and_credentials_1 = require("./load-nodes-and-credentials");
const tool_generation_1 = require("./tool-generation");
const utils_1 = require("./utils");
let NodeTypes = class NodeTypes {
    constructor(logger, loadNodesAndCredentials) {
        this.logger = logger;
        this.loadNodesAndCredentials = loadNodesAndCredentials;
    }
    resolveBaseName(nodeTypeName) {
        const isSyntheticTool = nodeTypeName.endsWith('Tool') &&
            !this.loadNodesAndCredentials.recognizesNode(nodeTypeName) &&
            !this.loadNodesAndCredentials.excludeNodes.includes(nodeTypeName);
        return {
            baseName: isSyntheticTool ? (0, utils_1.stripToolSuffix)(nodeTypeName) : nodeTypeName,
            isSyntheticTool,
        };
    }
    getWithSourcePath(nodeTypeName, version) {
        const nodeType = this.loadNodesAndCredentials.getNode(nodeTypeName);
        const { description } = n8n_workflow_1.NodeHelpers.getVersionedNodeType(nodeType.type, version);
        return {
            description: { ...description },
            sourcePath: this.loadNodesAndCredentials.resolveNodeSourcePath(nodeTypeName, nodeType.sourcePath),
        };
    }
    async getDescriptionWithTranslation(nodeTypeName, version, locale) {
        const { description, sourcePath } = this.getWithSourcePath(nodeTypeName, version);
        if (locale !== 'en') {
            try {
                const translationPath = await this.getNodeTranslationPath({
                    nodeSourcePath: sourcePath,
                    longNodeType: description.name,
                    locale,
                });
                const translation = await (0, promises_1.readFile)(translationPath, 'utf8');
                description.translation = JSON.parse(translation);
            }
            catch {
            }
        }
        return description;
    }
    getByName(nodeType) {
        return this.loadNodesAndCredentials.getNode(nodeType).type;
    }
    getByNameAndVersion(nodeType, version) {
        const origType = nodeType;
        const { baseName, isSyntheticTool } = this.resolveBaseName(nodeType);
        if (nodeType.endsWith('Tool') && !isSyntheticTool) {
            const node = this.loadNodesAndCredentials.getNode(nodeType);
            return n8n_workflow_1.NodeHelpers.getVersionedNodeType(node.type, version);
        }
        const node = this.loadNodesAndCredentials.getNode(baseName);
        const versionedNodeType = n8n_workflow_1.NodeHelpers.getVersionedNodeType(node.type, version);
        if (isSyntheticTool && typeof versionedNodeType.supplyData === 'function') {
            throw new n8n_workflow_1.UnexpectedError('Node already has a `supplyData` method', {
                extra: { nodeType: baseName },
            });
        }
        if ((0, utils_1.shouldAssignExecuteMethod)(versionedNodeType)) {
            versionedNodeType.execute = async function () {
                const routingNode = new n8n_core_1.RoutingNode(this, versionedNodeType);
                const data = await routingNode.runNode();
                return data ?? [];
            };
        }
        if (!isSyntheticTool)
            return versionedNodeType;
        const cacheKey = `${origType}?version=${version ?? 'default'}`;
        const { loadedNodes } = this.loadNodesAndCredentials;
        if (cacheKey in loadedNodes) {
            return loadedNodes[cacheKey].type;
        }
        const isHitlTool = (0, n8n_workflow_1.isHitlToolType)(origType);
        if (!(0, utils_1.satisfiesToolCapability)(origType, versionedNodeType)) {
            throw new n8n_workflow_1.UserError('Node cannot be used as a tool', { extra: { nodeType: baseName } });
        }
        const clonedProperties = Object.create(versionedNodeType.description.properties);
        const clonedDescription = Object.create(versionedNodeType.description, {
            properties: { value: clonedProperties, writable: isHitlTool },
        });
        const clonedNode = Object.create(versionedNodeType, {
            description: { value: clonedDescription },
        });
        const tool = isHitlTool ? (0, tool_generation_1.convertNodeToHitlTool)(clonedNode) : (0, tool_generation_1.convertNodeToAiTool)(clonedNode);
        loadedNodes[cacheKey] = { sourcePath: '', type: tool };
        return tool;
    }
    getKnownTypes() {
        return this.loadNodesAndCredentials.knownNodes;
    }
    getSupportedVersions(nodeTypeName) {
        try {
            const { baseName, isSyntheticTool } = this.resolveBaseName(nodeTypeName);
            const { type } = this.loadNodesAndCredentials.getNode(baseName);
            if ('nodeVersions' in type) {
                return Object.entries(type.nodeVersions)
                    .filter(([, versioned]) => !isSyntheticTool || (0, utils_1.satisfiesToolCapability)(nodeTypeName, versioned))
                    .map(([version]) => Number(version));
            }
            if (isSyntheticTool && !(0, utils_1.satisfiesToolCapability)(nodeTypeName, type))
                return [];
            const { version } = type.description;
            return Array.isArray(version) ? [...version] : [version];
        }
        catch (error) {
            if (!(error instanceof n8n_core_1.UnrecognizedNodeTypeError)) {
                this.logger.warn('Failed to resolve node type while listing supported versions', {
                    nodeType: nodeTypeName,
                    error: (0, ensure_error_1.ensureError)(error).message,
                });
            }
            return undefined;
        }
    }
    async getNodeTranslationPath({ nodeSourcePath, longNodeType, locale, }) {
        const nodeDir = (0, path_1.dirname)(nodeSourcePath);
        const maxVersion = await this.getMaxVersion(nodeDir);
        const nodeType = longNodeType.replace('n8n-nodes-base.', '');
        return maxVersion
            ? (0, path_1.join)(nodeDir, `v${maxVersion}`, 'translations', locale, `${nodeType}.json`)
            : (0, path_1.join)(nodeDir, 'translations', locale, `${nodeType}.json`);
    }
    async getMaxVersion(dir) {
        const entries = await (0, promises_1.readdir)(dir, { withFileTypes: true });
        const dirnames = entries.reduce((acc, cur) => {
            if (this.isVersionedDirname(cur))
                acc.push(cur.name);
            return acc;
        }, []);
        if (!dirnames.length)
            return null;
        return Math.max(...dirnames.map((d) => parseInt(d.charAt(1), 10)));
    }
    isVersionedDirname(dirent) {
        if (!dirent.isDirectory())
            return false;
        const ALLOWED_VERSIONED_DIRNAME_LENGTH = [2, 3];
        return (ALLOWED_VERSIONED_DIRNAME_LENGTH.includes(dirent.name.length) &&
            dirent.name.toLowerCase().startsWith('v'));
    }
    getNodeTypeDescriptions(nodeTypes) {
        return nodeTypes.map(({ name: nodeTypeName, version: nodeTypeVersion }) => {
            const { baseName, isSyntheticTool } = this.resolveBaseName(nodeTypeName);
            const nodeType = this.loadNodesAndCredentials.getNode(baseName);
            const { description } = n8n_workflow_1.NodeHelpers.getVersionedNodeType(nodeType.type, nodeTypeVersion);
            const descriptionCopy = isSyntheticTool
                ? this.buildSyntheticToolDescription(nodeTypeName, description)
                : { ...description };
            descriptionCopy.name = descriptionCopy.name.startsWith('n8n-nodes')
                ? descriptionCopy.name
                : `n8n-nodes-base.${descriptionCopy.name}`;
            return descriptionCopy;
        });
    }
    buildSyntheticToolDescription(nodeTypeName, description) {
        if ((0, n8n_workflow_1.isHitlToolType)(nodeTypeName)) {
            return (0, tool_generation_1.convertNodeToHitlTool)({ description: (0, n8n_workflow_1.deepCopy)(description) }).description;
        }
        const base = typeof description.usableAsTool === 'object'
            ? { ...(0, n8n_workflow_1.deepCopy)(description), ...description.usableAsTool?.replacements }
            : (0, n8n_workflow_1.deepCopy)(description);
        return (0, tool_generation_1.convertNodeToAiTool)({ description: base }).description;
    }
};
exports.NodeTypes = NodeTypes;
exports.NodeTypes = NodeTypes = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, load_nodes_and_credentials_1.LoadNodesAndCredentials])
], NodeTypes);
//# sourceMappingURL=node-types.js.map