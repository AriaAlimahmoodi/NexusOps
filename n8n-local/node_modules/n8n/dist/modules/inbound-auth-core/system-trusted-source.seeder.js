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
exports.SystemTrustedSourceSeeder = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const constants_1 = require("./constants");
const trusted_source_store_1 = require("./trusted-source.store");
let SystemTrustedSourceSeeder = class SystemTrustedSourceSeeder {
    constructor(store, urlService, logger) {
        this.store = store;
        this.urlService = urlService;
        this.logger = logger;
        this.logger = this.logger.scoped('inbound-auth');
    }
    async seed() {
        const issuer = this.urlService.getInstanceBaseUrl();
        const outcome = await this.store.seedSystemSource({
            id: constants_1.SYSTEM_TRUSTED_SOURCE_ID,
            name: constants_1.SYSTEM_TRUSTED_SOURCE_NAME,
            issuer,
            config: constants_1.SYSTEM_TRUSTED_SOURCE_CONFIG,
        });
        const context = { id: constants_1.SYSTEM_TRUSTED_SOURCE_ID, issuer };
        switch (outcome) {
            case 'inserted':
                this.logger.info('Seeded the system trusted source', context);
                break;
            case 'issuer-updated':
                this.logger.info('Moved the system trusted source to the instance base URL', context);
                break;
            case 'unchanged':
                this.logger.debug('System trusted source is up to date', context);
                break;
            case 'conflict':
                this.logger.error('Could not seed the system trusted source: another trusted source holds its id, name or issuer', { ...context, name: constants_1.SYSTEM_TRUSTED_SOURCE_NAME });
                break;
        }
    }
};
exports.SystemTrustedSourceSeeder = SystemTrustedSourceSeeder;
exports.SystemTrustedSourceSeeder = SystemTrustedSourceSeeder = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [trusted_source_store_1.TrustedSourceDbStore, backend_services_1.UrlService, backend_common_1.Logger])
], SystemTrustedSourceSeeder);
//# sourceMappingURL=system-trusted-source.seeder.js.map