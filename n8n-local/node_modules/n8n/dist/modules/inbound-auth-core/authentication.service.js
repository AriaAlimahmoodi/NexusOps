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
exports.OAuth2AuthenticationService = void 0;
const di_1 = require("@n8n/di");
const inbound_auth_1 = require("@n8n/inbound-auth");
const oauth2_bearer_driver_1 = require("./oauth2-bearer.driver");
let OAuth2AuthenticationService = class OAuth2AuthenticationService extends inbound_auth_1.AuthenticationService {
    constructor(store, bearer, drivers = [bearer]) {
        super();
        this.store = store;
        this.drivers = drivers;
    }
    async authenticate(extracted) {
        const { kind } = extracted.credential;
        const candidates = this.drivers.filter((driver) => driver.credentialKind === kind);
        if (candidates.length === 0) {
            return {
                ok: false,
                reason: 'source-unusable',
                detail: `No suitable authentication driver found for the credential kind "${kind}"`,
            };
        }
        let selected;
        for (const driver of candidates) {
            const source = await driver.selectSource(extracted);
            if (source) {
                selected = { driver, source };
                break;
            }
        }
        if (!selected) {
            return {
                ok: false,
                reason: 'unknown-issuer',
            };
        }
        const { driver, source } = selected;
        if (source.config.surfaces[extracted.surface] === undefined)
            return { ok: false, reason: 'source-not-accepted' };
        if (extracted.acceptedSourceIds && !extracted.acceptedSourceIds.includes(source.id))
            return { ok: false, reason: 'source-not-accepted' };
        if (source.status !== 'healthy')
            return { ok: false, reason: 'source-unusable', detail: `source status is ${source.status}` };
        if (!driver.sourceTypes.includes(source.type))
            return {
                ok: false,
                reason: 'source-unusable',
                detail: `source type ${source.type} not handled`,
            };
        if (source.metadata === null)
            return { ok: false, reason: 'source-unusable', detail: 'source not discovered yet' };
        return await driver.verify(extracted, source);
    }
    async advertise(resource) {
        const onSurface = await this.store.listBySurface(resource.surface);
        const { acceptedSourceIds } = resource;
        const accepted = acceptedSourceIds
            ? onSurface.filter((s) => acceptedSourceIds.includes(s.id))
            : onSurface;
        const authorizationServers = new Set();
        const challenges = [];
        for (const driver of this.drivers) {
            const advertised = driver.advertise(resource, accepted);
            for (const issuer of advertised.authorizationServers ?? [])
                authorizationServers.add(issuer);
            if (advertised.challenge)
                challenges.push(advertised.challenge);
        }
        return { authorizationServers: [...authorizationServers], challenges };
    }
};
exports.OAuth2AuthenticationService = OAuth2AuthenticationService;
exports.OAuth2AuthenticationService = OAuth2AuthenticationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [inbound_auth_1.TrustedSourceStore, oauth2_bearer_driver_1.Oauth2BearerDriver, Array])
], OAuth2AuthenticationService);
//# sourceMappingURL=authentication.service.js.map