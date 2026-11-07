"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialResolver = exports.CredentialResolverEntryMetadata = void 0;
const di_1 = require("@n8n/di");
let CredentialResolverEntryMetadata = class CredentialResolverEntryMetadata {
    constructor() {
        this.credentialResolverEntries = new Set();
    }
    register(credentialResolverEntry) {
        this.credentialResolverEntries.add(credentialResolverEntry);
    }
    getEntries() {
        return [...this.credentialResolverEntries.entries()];
    }
    getClasses() {
        return [...this.credentialResolverEntries.values()].map((entry) => entry.class);
    }
};
exports.CredentialResolverEntryMetadata = CredentialResolverEntryMetadata;
exports.CredentialResolverEntryMetadata = CredentialResolverEntryMetadata = __decorate([
    (0, di_1.Service)()
], CredentialResolverEntryMetadata);
const CredentialResolver = () => (target) => {
    di_1.Container.get(CredentialResolverEntryMetadata).register({
        class: target,
    });
    return (0, di_1.Service)()(target);
};
exports.CredentialResolver = CredentialResolver;
//# sourceMappingURL=credential-resolver-metadata.js.map