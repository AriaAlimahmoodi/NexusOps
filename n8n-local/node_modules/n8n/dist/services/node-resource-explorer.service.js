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
exports.NodeResourceExplorerService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const node_catalog_1 = require("@n8n/ai-utilities/node-catalog");
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const node_types_1 = require("../node-types");
const dynamic_node_parameters_service_1 = require("../services/dynamic-node-parameters.service");
const workflow_execute_additional_data_1 = require("../workflow-execute-additional-data");
const MAX_AVAILABILITY_PAGES = 5;
const N8N_CONNECT_DISPLAY_NAME = 'Gateway credits';
let NodeResourceExplorerService = class NodeResourceExplorerService {
    constructor(logger, dynamicNodeParametersService, credentialsFinderService, projectRepository, nodeTypes) {
        this.logger = logger;
        this.dynamicNodeParametersService = dynamicNodeParametersService;
        this.credentialsFinderService = credentialsFinderService;
        this.projectRepository = projectRepository;
        this.nodeTypes = nodeTypes;
    }
    async exploreResources(user, params) {
        const credentials = await this.resolveExploreCredentials(user, params);
        const personalProject = await this.projectRepository.getPersonalProjectForUserOrFail(user.id);
        const nodeTypeAndVersion = { name: params.nodeType, version: params.version };
        const currentNodeParameters = structuredClone(params.currentNodeParameters ?? {});
        const nodeDescription = this.getNodeDescription(params.nodeType, params.version);
        if (!currentNodeParameters.authentication && nodeDescription) {
            const authValue = (0, node_catalog_1.detectAuthenticationParameterValue)(nodeDescription, params.credentialType);
            if (authValue !== undefined)
                currentNodeParameters.authentication = authValue;
        }
        const additionalData = await (0, workflow_execute_additional_data_1.getBase)({
            userId: user.id,
            projectId: personalProject.id,
            currentNodeParameters,
        });
        const builderHint = nodeDescription
            ? findBuilderHintForMethod(nodeDescription, params.methodName, params.methodType)
            : undefined;
        try {
            if (params.methodType === 'listSearch') {
                const result = await this.dynamicNodeParametersService.getResourceLocatorResults(params.methodName, '', additionalData, nodeTypeAndVersion, currentNodeParameters, credentials, params.filter, params.paginationToken);
                return {
                    results: (result.results ?? []).map((r) => ({
                        name: String(r.name),
                        value: r.value,
                        url: r.url,
                    })),
                    paginationToken: typeof result.paginationToken === 'string' ? result.paginationToken : undefined,
                    ...(builderHint ? { builderHint } : {}),
                };
            }
            const isRouted = nodeDescription
                ? isRoutedLoadOptionsProperty(nodeDescription, params.methodName)
                : false;
            const options = isRouted
                ? await this.dynamicNodeParametersService.getOptionsViaLoadOptionsByPath(params.methodName, additionalData, nodeTypeAndVersion, currentNodeParameters, credentials)
                : await this.dynamicNodeParametersService.getOptionsViaMethodName(params.methodName, '', additionalData, nodeTypeAndVersion, currentNodeParameters, credentials);
            return {
                results: options.map((o) => ({
                    name: String(o.name),
                    value: o.value,
                    description: o.description,
                })),
                ...(builderHint ? { builderHint } : {}),
            };
        }
        catch (error) {
            this.logger.error('Failed to load options for explore-resources', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    async resolveExploreCredentials(user, params) {
        if (params.credentialId === api_types_1.AI_GATEWAY_MANAGED_TAG) {
            return {
                [params.credentialType]: {
                    id: null,
                    name: N8N_CONNECT_DISPLAY_NAME,
                    __aiGatewayManaged: true,
                },
            };
        }
        const credential = await this.credentialsFinderService.findCredentialForUser(params.credentialId, user, ['credential:read']);
        if (!credential || credential.type !== params.credentialType) {
            throw new Error(`Credential ${params.credentialId} not found or not accessible`);
        }
        return {
            [credential.type]: { id: credential.id, name: credential.name },
        };
    }
    async findUnavailableResourceLocatorValues(user, params) {
        const nodeDescription = this.getNodeDescription(params.nodeType, params.version);
        if (!nodeDescription)
            return [];
        const candidates = collectListBackedLocators(nodeDescription, params.parameters, params.version);
        if (candidates.length === 0)
            return [];
        const unavailable = [];
        for (const candidate of candidates) {
            const listing = await this.listAllReachableValues(user, params, candidate);
            if (!listing.complete)
                continue;
            if (listing.options.length === 0)
                continue;
            if (listing.options.some((o) => o.value === candidate.currentValue))
                continue;
            unavailable.push({
                name: candidate.name,
                displayName: candidate.displayName,
                currentValue: candidate.currentValue,
            });
        }
        return unavailable;
    }
    async listAllReachableValues(user, params, candidate) {
        const byValue = new Map();
        let paginationToken;
        for (let page = 0; page < MAX_AVAILABILITY_PAGES; page++) {
            let result;
            try {
                result = await this.exploreResources(user, {
                    nodeType: params.nodeType,
                    version: params.version,
                    methodName: candidate.methodName,
                    methodType: candidate.methodType,
                    credentialType: params.credentialType,
                    credentialId: params.credentialId,
                    currentNodeParameters: params.parameters,
                    ...(paginationToken ? { paginationToken } : {}),
                });
            }
            catch (error) {
                this.logger.debug('Resource-locator availability check failed', {
                    parameter: candidate.name,
                    error: error instanceof Error ? error.message : String(error),
                });
                return { options: [], complete: false };
            }
            for (const entry of result.results) {
                const value = String(entry.value);
                if (!byValue.has(value))
                    byValue.set(value, { name: entry.name, value });
            }
            paginationToken = result.paginationToken;
            if (paginationToken === undefined)
                return { options: [...byValue.values()], complete: true };
        }
        this.logger.debug('Resource-locator list too long to validate against', {
            parameter: candidate.name,
            pagesFetched: MAX_AVAILABILITY_PAGES,
            valuesSeen: byValue.size,
        });
        return { options: [...byValue.values()], complete: false };
    }
    getNodeDescription(nodeType, version) {
        try {
            return this.nodeTypes.getByNameAndVersion(nodeType, version).description;
        }
        catch {
            return undefined;
        }
    }
};
exports.NodeResourceExplorerService = NodeResourceExplorerService;
exports.NodeResourceExplorerService = NodeResourceExplorerService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, dynamic_node_parameters_service_1.DynamicNodeParametersService, backend_services_1.CredentialsFinderService, db_1.ProjectRepository, node_types_1.NodeTypes])
], NodeResourceExplorerService);
const IDENTIFIER_LOCATOR_MODES = new Set(['list', 'id']);
function readLocatorValue(raw) {
    if (typeof raw === 'string')
        return staticIdentifier(raw);
    if (typeof raw !== 'object' || raw === null)
        return undefined;
    const mode = Reflect.get(raw, 'mode');
    if (typeof mode === 'string' && !IDENTIFIER_LOCATOR_MODES.has(mode))
        return undefined;
    const value = Reflect.get(raw, 'value');
    if (typeof value === 'string')
        return staticIdentifier(value);
    if (typeof value === 'number')
        return String(value);
    return undefined;
}
function staticIdentifier(value) {
    if (value === '')
        return undefined;
    if (value.startsWith('='))
        return undefined;
    return value;
}
function collectListBackedLocators(nodeDescription, parameters, typeVersion) {
    const node = { typeVersion };
    const resolved = n8n_workflow_1.NodeHelpers.getNodeParameters(nodeDescription.properties, parameters, true, false, node, nodeDescription) ?? parameters;
    const candidates = [];
    const seen = new Set();
    for (const property of nodeDescription.properties) {
        if (seen.has(property.name))
            continue;
        let methodName;
        let methodType = 'listSearch';
        if (property.type === 'resourceLocator') {
            methodName = property.modes?.reduce((found, mode) => found ?? (mode.type === 'list' ? mode.typeOptions?.searchListMethod : undefined), undefined);
            methodType = 'listSearch';
        }
        else if (property.type === 'options') {
            if (property.typeOptions?.loadOptionsMethod) {
                methodName = property.typeOptions.loadOptionsMethod;
                methodType =
                    property.typeOptions.loadOptionsMethod === 'listSearch' ? 'listSearch' : 'loadOptions';
            }
            else if (property.typeOptions?.searchListMethod) {
                methodName = property.typeOptions.searchListMethod;
                methodType = 'listSearch';
            }
            else if (property.typeOptions?.loadOptions?.routing) {
                methodName = property.name;
                methodType = 'loadOptions';
            }
        }
        if (!methodName)
            continue;
        if (!n8n_workflow_1.NodeHelpers.displayParameter(resolved, property, node, nodeDescription))
            continue;
        const currentValue = readLocatorValue(resolved[property.name]);
        if (currentValue === undefined)
            continue;
        seen.add(property.name);
        candidates.push({
            name: property.name,
            displayName: property.displayName,
            methodName,
            methodType,
            currentValue,
        });
    }
    return candidates;
}
function findBuilderHintForMethod(nodeDesc, methodName, methodType) {
    const referencesMethod = (prop) => {
        switch (methodType) {
            case 'loadOptions':
                return (prop.typeOptions?.loadOptionsMethod === methodName ||
                    (Boolean(prop.typeOptions?.loadOptions?.routing) && prop.name === methodName));
            case 'listSearch': {
                const modes = prop.modes ?? [];
                return modes.some((mode) => mode.typeOptions?.searchListMethod === methodName);
            }
        }
    };
    const isCollection = (item) => 'values' in item;
    const isProperty = (item) => 'type' in item;
    const searchProps = (items) => {
        for (const item of items ?? []) {
            if (isCollection(item)) {
                const nested = searchProps(item.values);
                if (nested)
                    return nested;
                continue;
            }
            if (!isProperty(item))
                continue;
            if (referencesMethod(item) && item.builderHint?.propertyHint) {
                return item.builderHint.propertyHint;
            }
            const nested = searchProps(item.options);
            if (nested)
                return nested;
        }
        return undefined;
    };
    return searchProps(nodeDesc.properties);
}
function isRoutedLoadOptionsProperty(nodeDesc, propertyName) {
    const search = (items) => {
        for (const item of items ?? []) {
            if ('values' in item && Array.isArray(item.values)) {
                if (search(item.values))
                    return true;
                continue;
            }
            if ('type' in item) {
                if (item.name === propertyName && Boolean(item.typeOptions?.loadOptions?.routing)) {
                    return true;
                }
                if (item.options && search(item.options))
                    return true;
            }
        }
        return false;
    };
    return search(nodeDesc.properties);
}
//# sourceMappingURL=node-resource-explorer.service.js.map