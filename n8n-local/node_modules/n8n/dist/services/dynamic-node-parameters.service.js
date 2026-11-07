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
exports.DynamicNodeParametersService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const errors_1 = require("@n8n/errors");
const node_types_1 = require("../node-types");
const check_access_1 = require("../permissions.ee/check-access");
const utils_1 = require("../utils");
const workflow_loader_service_1 = require("./workflow-loader.service");
let DynamicNodeParametersService = class DynamicNodeParametersService {
    constructor(logger, nodeTypes, workflowLoaderService, sharedWorkflowRepository, credentialsFinderService, credentialsRepository) {
        this.logger = logger;
        this.nodeTypes = nodeTypes;
        this.workflowLoaderService = workflowLoaderService;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.credentialsFinderService = credentialsFinderService;
        this.credentialsRepository = credentialsRepository;
    }
    async refineResourceIds(user, payload) {
        if (payload.projectId &&
            !(await (0, check_access_1.userHasScopes)(user, ['dataTable:listProject'], false, {
                projectId: payload.projectId,
            }))) {
            this.logger.warn(`Scrubbed inaccessible projectId ${payload.projectId} from DynamicNodeParameters request`);
            payload.projectId = undefined;
        }
        if (payload.workflowId) {
            const hasAccess = await (0, check_access_1.userHasScopes)(user, ['workflow:read'], false, {
                workflowId: payload.workflowId,
            });
            if (!hasAccess) {
                this.logger.warn(`Scrubbed inaccessible workflowId ${payload.workflowId} from DynamicNodeParameters request`);
                payload.workflowId = undefined;
            }
            else if (payload.projectId === undefined) {
                const project = await this.sharedWorkflowRepository.getWorkflowOwningProject(payload.workflowId);
                payload.projectId = project?.id;
            }
        }
        if (payload.credentials) {
            const credentialIds = Object.values(payload.credentials)
                .map((details) => details.id)
                .filter((id) => id !== undefined && id !== null);
            if (credentialIds.length > 0) {
                const accessibleIds = await this.credentialsFinderService.findCredentialIdsWithScopeForUser(credentialIds, user, ['credential:read']);
                const forbiddenId = credentialIds.find((id) => !accessibleIds.has(id));
                if (forbiddenId !== undefined) {
                    throw new errors_1.ForbiddenError();
                }
                await this.assertMayUseEndUserCredentials(user, credentialIds);
            }
        }
    }
    async assertMayUseEndUserCredentials(user, credentialIds) {
        const credentials = await this.credentialsRepository.getManyByIds(credentialIds);
        const endUserIds = credentials.filter((c) => c.isResolvable).map((c) => c.id);
        if (endUserIds.length === 0)
            return;
        const connectableIds = await this.credentialsFinderService.findCredentialIdsWithScopeForUser(endUserIds, user, ['credential:connect']);
        if (endUserIds.some((id) => !connectableIds.has(id))) {
            throw new errors_1.ForbiddenError('You need permission to connect your own account to this end-user credential before you can load this list');
        }
    }
    async getOptionsViaMethodName(methodName, path, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials) {
        const nodeType = this.getNodeType(nodeTypeAndVersion);
        const method = this.getMethod('loadOptions', methodName, nodeType);
        const workflow = this.getWorkflow(nodeTypeAndVersion, currentNodeParameters, credentials);
        const thisArgs = this.getThisArg(path, additionalData, workflow);
        return await (0, utils_1.withExpressionIsolate)(workflow, async () => {
            return await method.call(thisArgs);
        });
    }
    async getOptionsViaLoadOptionsByPath(path, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials) {
        const nodeType = this.getNodeType(nodeTypeAndVersion);
        const property = (0, n8n_workflow_1.findDisplayedProperty)(path, nodeType.description.properties, currentNodeParameters, { typeVersion: nodeTypeAndVersion.version }, nodeType.description);
        const routing = property && 'typeOptions' in property
            ? property.typeOptions?.loadOptions?.routing
            : undefined;
        if (!routing) {
            throw new errors_1.BadRequestError(`Node type "${nodeType.description.name}" has no loadOptions routing for parameter path "${path}"`);
        }
        return await this.getOptionsViaLoadOptions({ routing }, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials);
    }
    async getOptionsViaLoadOptions(loadOptions, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials) {
        const nodeType = this.getNodeType(nodeTypeAndVersion);
        if (!nodeType.description.requestDefaults?.baseURL) {
            throw new errors_1.BadRequestError(`Node type "${nodeType.description.name}" does not exist or does not have "requestDefaults.baseURL" defined!`);
        }
        const mode = 'internal';
        const runIndex = 0;
        const connectionInputData = [];
        const runExecutionData = (0, n8n_workflow_1.createRunExecutionData)({
            executionData: { runtimeData: additionalData.executionContext },
        });
        const workflow = this.getWorkflow(nodeTypeAndVersion, currentNodeParameters, credentials);
        const node = workflow.nodes['Temp-Node'];
        const tempNodeType = {
            ...nodeType,
            ...{
                description: {
                    ...nodeType.description,
                    properties: [
                        {
                            displayName: '',
                            type: 'string',
                            name: '',
                            default: '',
                            routing: loadOptions.routing,
                        },
                    ],
                },
            },
        };
        const inputData = {
            main: [[{ json: {} }]],
        };
        const executeData = {
            node,
            source: null,
            data: {},
        };
        const executeFunctions = new n8n_core_1.ExecuteContext(workflow, node, additionalData, mode, runExecutionData, runIndex, connectionInputData, inputData, executeData, []);
        const routingNode = new n8n_core_1.RoutingNode(executeFunctions, tempNodeType);
        return await (0, utils_1.withExpressionIsolate)(workflow, async () => {
            const optionsData = await routingNode.runNode();
            if (optionsData?.length === 0) {
                return [];
            }
            if (!Array.isArray(optionsData)) {
                throw new n8n_workflow_1.UnexpectedError('The returned data is not an array');
            }
            return optionsData[0].map((item) => item.json);
        });
    }
    async getResourceLocatorResults(methodName, path, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials, filter, paginationToken) {
        const nodeType = this.getNodeType(nodeTypeAndVersion);
        const method = this.getMethod('listSearch', methodName, nodeType);
        const workflow = this.getWorkflow(nodeTypeAndVersion, currentNodeParameters, credentials);
        const thisArgs = this.getThisArg(path, additionalData, workflow);
        return await (0, utils_1.withExpressionIsolate)(workflow, async () => {
            const result = await method.call(thisArgs, filter, paginationToken);
            const token = result?.paginationToken;
            return typeof token === 'number' ? { ...result, paginationToken: String(token) } : result;
        });
    }
    async getResourceMappingFields(methodName, path, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials) {
        const nodeType = this.getNodeType(nodeTypeAndVersion);
        const method = this.getMethod('resourceMapping', methodName, nodeType);
        const workflow = this.getWorkflow(nodeTypeAndVersion, currentNodeParameters, credentials);
        const thisArgs = this.getThisArg(path, additionalData, workflow);
        return await (0, utils_1.withExpressionIsolate)(workflow, async () => this.removeDuplicateResourceMappingFields(await method.call(thisArgs)));
    }
    async getLocalResourceMappingFields(methodName, path, additionalData, nodeTypeAndVersion) {
        const nodeType = this.getNodeType(nodeTypeAndVersion);
        const method = this.getMethod('localResourceMapping', methodName, nodeType);
        const thisArgs = this.getLocalLoadOptionsContext(path, additionalData);
        return this.removeDuplicateResourceMappingFields(await method.call(thisArgs));
    }
    async getActionResult(handler, path, additionalData, nodeTypeAndVersion, currentNodeParameters, payload, credentials) {
        const nodeType = this.getNodeType(nodeTypeAndVersion);
        const method = this.getMethod('actionHandler', handler, nodeType);
        const workflow = this.getWorkflow(nodeTypeAndVersion, currentNodeParameters, credentials);
        const thisArgs = this.getThisArg(path, additionalData, workflow);
        return await (0, utils_1.withExpressionIsolate)(workflow, async () => {
            return await method.call(thisArgs, payload);
        });
    }
    getMethod(type, methodName, nodeType) {
        const methodsOfType = nodeType.methods?.[type];
        const method = methodsOfType?.[methodName];
        if (typeof method !== 'function') {
            const available = methodsOfType ? Object.keys(methodsOfType) : [];
            const otherTypesWithMethods = [];
            for (const [otherType, otherMethods] of Object.entries(nodeType.methods ?? {})) {
                if (otherType === type || !otherMethods)
                    continue;
                const names = Object.keys(otherMethods);
                if (names.length > 0) {
                    otherTypesWithMethods.push(`${otherType}: ${names.join(', ')}`);
                }
            }
            const availableText = available.length > 0 ? available.join(', ') : `<no ${type} methods declared>`;
            const otherTypesText = otherTypesWithMethods.length > 0
                ? ` Other method types on this node — ${otherTypesWithMethods.join('; ')}.`
                : '';
            throw new errors_1.BadRequestError(`Node type "${nodeType.description.name}" has no ${type} method named "${methodName}". Available ${type} methods: ${availableText}.${otherTypesText}`);
        }
        return method;
    }
    getNodeType({ name, version }) {
        return this.nodeTypes.getByNameAndVersion(name, version);
    }
    getWorkflow(nodeTypeAndVersion, currentNodeParameters, credentials) {
        const node = {
            parameters: currentNodeParameters,
            id: 'uuid-1234',
            name: 'Temp-Node',
            type: nodeTypeAndVersion.name,
            typeVersion: nodeTypeAndVersion.version,
            position: [0, 0],
        };
        if (credentials) {
            node.credentials = credentials;
        }
        return new n8n_workflow_1.Workflow({
            nodes: [node],
            connections: {},
            active: false,
            nodeTypes: this.nodeTypes,
        });
    }
    getThisArg(path, additionalData, workflow) {
        const node = workflow.nodes['Temp-Node'];
        return new n8n_core_1.LoadOptionsContext(workflow, node, additionalData, path);
    }
    getLocalLoadOptionsContext(path, additionalData) {
        return new n8n_core_1.LocalLoadOptionsContext(this.nodeTypes, additionalData, path, this.workflowLoaderService);
    }
    removeDuplicateResourceMappingFields(fields) {
        const uniqueFieldIds = new Set();
        return {
            ...fields,
            fields: fields.fields?.filter((field) => {
                if (uniqueFieldIds.has(field.id)) {
                    return false;
                }
                uniqueFieldIds.add(field.id);
                return true;
            }),
        };
    }
};
exports.DynamicNodeParametersService = DynamicNodeParametersService;
exports.DynamicNodeParametersService = DynamicNodeParametersService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, node_types_1.NodeTypes, workflow_loader_service_1.WorkflowLoaderService, db_1.SharedWorkflowRepository, backend_services_1.CredentialsFinderService, db_1.CredentialsRepository])
], DynamicNodeParametersService);
//# sourceMappingURL=dynamic-node-parameters.service.js.map