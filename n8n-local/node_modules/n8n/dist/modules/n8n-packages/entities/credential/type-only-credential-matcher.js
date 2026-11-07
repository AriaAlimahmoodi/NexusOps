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
exports.TypeOnlyCredentialMatcher = void 0;
const di_1 = require("@n8n/di");
const credential_types_1 = require("../../../../credential-types");
const credentials_service_1 = require("../../../../credentials/credentials.service");
const credential_matcher_1 = require("./credential-matcher");
const credential_tier_selection_1 = require("./credential-tier-selection");
let TypeOnlyCredentialMatcher = class TypeOnlyCredentialMatcher extends credential_matcher_1.CredentialMatcher {
    constructor(credentialTypes, credentialsService) {
        super(credentialTypes, credentialsService);
    }
    resolve(unbound, usableCredentials, context) {
        return (0, credential_tier_selection_1.resolveByCandidateFilter)(unbound, usableCredentials, context.projectId, (candidate, reference) => candidate.type === reference.type);
    }
};
exports.TypeOnlyCredentialMatcher = TypeOnlyCredentialMatcher;
exports.TypeOnlyCredentialMatcher = TypeOnlyCredentialMatcher = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credential_types_1.CredentialTypes, credentials_service_1.CredentialsService])
], TypeOnlyCredentialMatcher);
//# sourceMappingURL=type-only-credential-matcher.js.map