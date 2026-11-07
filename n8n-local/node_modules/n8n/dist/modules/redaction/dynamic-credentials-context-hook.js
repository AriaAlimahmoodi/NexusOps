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
exports.DynamicCredentialsContextHook = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const backend_services_1 = require("@n8n/backend-services");
let DynamicCredentialsContextHook = class DynamicCredentialsContextHook {
    constructor(logger, credentialsRepository, executingUserIdentifierProxy) {
        this.logger = logger;
        this.credentialsRepository = credentialsRepository;
        this.executingUserIdentifierProxy = executingUserIdentifierProxy;
        this.hookDescription = {
            name: 'DynamicCredentialsContextHook',
        };
    }
    isApplicableToTriggerNode(_nodeType) {
        return false;
    }
    async execute(options) {
        const contextUpdate = {};
        const credentialIds = new Set();
        for (const node of Object.values(options.workflow.nodes)) {
            for (const credential of Object.values(node.credentials ?? {})) {
                if (credential.id)
                    credentialIds.add(credential.id);
            }
        }
        let hasResolvable;
        try {
            hasResolvable = await this.credentialsRepository.hasResolvableCredential([...credentialIds]);
        }
        catch (error) {
            this.logger.warn('Could not check for resolvable credentials; redacting run for everyone', {
                error,
            });
            return { contextUpdate: { usesDynamicCredentials: true } };
        }
        if (!hasResolvable)
            return {};
        contextUpdate.usesDynamicCredentials = true;
        const credentials = options.context?.credentials;
        if (credentials) {
            const executedByUserId = await this.executingUserIdentifierProxy.identify(credentials);
            if (executedByUserId)
                contextUpdate.executedByUserId = executedByUserId;
        }
        return { contextUpdate };
    }
};
exports.DynamicCredentialsContextHook = DynamicCredentialsContextHook;
exports.DynamicCredentialsContextHook = DynamicCredentialsContextHook = __decorate([
    (0, decorators_1.ContextEstablishmentHook)({
        alwaysExecute: true,
        runForSubExecution: true,
    }),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.CredentialsRepository, backend_services_1.ExecutingUserIdentifierProxy])
], DynamicCredentialsContextHook);
//# sourceMappingURL=dynamic-credentials-context-hook.js.map