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
exports.N8nResolverSeeder = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../constants");
const credential_resolver_registry_service_1 = require("./credential-resolver-registry.service");
const credential_resolver_1 = require("../database/entities/credential-resolver");
const credential_resolver_repository_1 = require("../database/repositories/credential-resolver.repository");
let N8nResolverSeeder = class N8nResolverSeeder {
    constructor(repository, cipher, registry, logger) {
        this.repository = repository;
        this.cipher = cipher;
        this.registry = registry;
        this.logger = logger;
        this.logger = this.logger.scoped('dynamic-credentials');
    }
    async seed() {
        if (!this.registry.getResolverByTypename(constants_1.SYSTEM_RESOLVER_TYPE)) {
            throw new n8n_workflow_1.UnexpectedError(`SYSTEM_RESOLVER_TYPE "${constants_1.SYSTEM_RESOLVER_TYPE}" is not registered in the resolver registry. The constant must match the seeded resolver class's metadata.name.`);
        }
        const encryptedConfig = await this.cipher.encryptV2({});
        const result = await this.repository
            .createQueryBuilder()
            .insert()
            .into(credential_resolver_1.DynamicCredentialResolver)
            .values({
            id: constants_1.SYSTEM_RESOLVER_ID,
            name: constants_1.SYSTEM_RESOLVER_NAME,
            type: constants_1.SYSTEM_RESOLVER_TYPE,
            config: encryptedConfig,
        })
            .orIgnore()
            .execute();
        const inserted = result.identifiers.length > 0;
        if (inserted) {
            this.logger.info(`Seeded system credential resolver "${constants_1.SYSTEM_RESOLVER_ID}"`);
        }
        else {
            this.logger.debug(`System credential resolver "${constants_1.SYSTEM_RESOLVER_ID}" already seeded`);
        }
        return (await this.repository.findOneBy({ id: constants_1.SYSTEM_RESOLVER_ID })) ?? undefined;
    }
};
exports.N8nResolverSeeder = N8nResolverSeeder;
exports.N8nResolverSeeder = N8nResolverSeeder = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credential_resolver_repository_1.DynamicCredentialResolverRepository, n8n_core_1.Cipher, credential_resolver_registry_service_1.DynamicCredentialResolverRegistry, backend_common_1.Logger])
], N8nResolverSeeder);
//# sourceMappingURL=n8n-resolver-seeder.service.js.map