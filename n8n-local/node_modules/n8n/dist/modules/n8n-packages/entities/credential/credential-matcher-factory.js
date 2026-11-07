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
exports.CredentialMatcherFactory = void 0;
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const id_based_credential_matcher_1 = require("./id-based-credential-matcher");
const name_and_type_credential_matcher_1 = require("./name-and-type-credential-matcher");
const type_only_credential_matcher_1 = require("./type-only-credential-matcher");
let CredentialMatcherFactory = class CredentialMatcherFactory {
    constructor(idBasedMatcher, nameAndTypeMatcher, typeOnlyMatcher) {
        this.matchers = {
            'id-only': idBasedMatcher,
            'name-and-type': nameAndTypeMatcher,
            'type-only': typeOnlyMatcher,
        };
    }
    getMatcher(mode) {
        const matcher = this.matchers[mode];
        if (!matcher) {
            throw new errors_1.BadRequestError(`Unsupported credential matching mode: ${mode}`);
        }
        return matcher;
    }
};
exports.CredentialMatcherFactory = CredentialMatcherFactory;
exports.CredentialMatcherFactory = CredentialMatcherFactory = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [id_based_credential_matcher_1.IdBasedCredentialMatcher, name_and_type_credential_matcher_1.NameAndTypeCredentialMatcher, type_only_credential_matcher_1.TypeOnlyCredentialMatcher])
], CredentialMatcherFactory);
//# sourceMappingURL=credential-matcher-factory.js.map