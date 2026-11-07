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
exports.DynamicCredentialResolverRegistry = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let DynamicCredentialResolverRegistry = class DynamicCredentialResolverRegistry {
    constructor(credentialResolverEntryMetadata, logger) {
        this.credentialResolverEntryMetadata = credentialResolverEntryMetadata;
        this.logger = logger;
        this.resolverMap = new Map();
    }
    async init() {
        this.resolverMap.clear();
        const resolverClasses = this.credentialResolverEntryMetadata.getClasses();
        this.logger.debug(`Registering ${resolverClasses.length} credential resolvers.`);
        for (const ResolverClass of resolverClasses) {
            let resolver;
            try {
                resolver = di_1.Container.get(ResolverClass);
            }
            catch (error) {
                this.logger.error(`Failed to instantiate credential resolver class "${ResolverClass.name}": ${error.message}`, { error });
                continue;
            }
            if (this.resolverMap.has(resolver.metadata.name)) {
                this.logger.warn(`Credential resolver with name "${resolver.metadata.name}" is already registered. Conflicting classes are "${this.resolverMap.get(resolver.metadata.name)?.constructor.name}" and "${ResolverClass.name}". Skipping the latter.`);
                continue;
            }
            if (resolver.init) {
                try {
                    await resolver.init();
                }
                catch (error) {
                    this.logger.error(`Failed to initialize credential resolver "${resolver.metadata.name}": ${error.message}`, { error });
                    continue;
                }
            }
            this.resolverMap.set(resolver.metadata.name, resolver);
        }
    }
    getResolverByTypename(name) {
        return this.resolverMap.get(name);
    }
    getAllResolvers() {
        return Array.from(this.resolverMap.values());
    }
};
exports.DynamicCredentialResolverRegistry = DynamicCredentialResolverRegistry;
exports.DynamicCredentialResolverRegistry = DynamicCredentialResolverRegistry = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [decorators_1.CredentialResolverEntryMetadata, backend_common_1.Logger])
], DynamicCredentialResolverRegistry);
//# sourceMappingURL=credential-resolver-registry.service.js.map