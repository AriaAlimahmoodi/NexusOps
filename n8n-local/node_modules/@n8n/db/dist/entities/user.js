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
exports.User = void 0;
const typeorm_1 = require("@n8n/typeorm");
const abstract_entity_1 = require("./abstract-entity");
const role_1 = require("./role");
const constants_1 = require("../constants");
const is_valid_email_1 = require("../utils/is-valid-email");
const transformers_1 = require("../utils/transformers");
let User = class User extends abstract_entity_1.WithTimestamps {
    preUpsertHook() {
        this.email = this.email?.toLowerCase() ?? null;
        if (this.email !== null && this.email !== undefined) {
            const result = (0, is_valid_email_1.isValidEmail)(this.email);
            if (!result) {
                throw new Error(`Cannot save user <${this.email}>: Provided email is invalid`);
            }
        }
    }
    computeIsPending() {
        const hasExternalAuthIdentity = this.authIdentities?.some((identity) => identity.providerType !== 'email') ?? false;
        this.isPending =
            this.password === null &&
                !hasExternalAuthIdentity &&
                this.role?.slug !== constants_1.GLOBAL_OWNER_ROLE.slug;
    }
    toJSON() {
        const { password, mfaSecret, mfaRecoveryCodes, ...rest } = this;
        return rest;
    }
    createPersonalProjectName() {
        if (this.firstName && this.lastName && this.email) {
            return `${this.firstName} ${this.lastName} <${this.email}>`;
        }
        else if (this.email) {
            return `<${this.email}>`;
        }
        else {
            return 'Unnamed Project';
        }
    }
    toIUser() {
        const { id, email, firstName, lastName } = this;
        return { id, email, firstName, lastName };
    }
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        length: 254,
        nullable: true,
        transformer: transformers_1.lowerCaser,
    }),
    (0, typeorm_1.Index)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 32, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 32, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "password", void 0);
__decorate([
    (0, abstract_entity_1.JsonColumn)({
        nullable: true,
        transformer: transformers_1.objectRetriever,
    }),
    __metadata("design:type", Object)
], User.prototype, "personalizationAnswers", void 0);
__decorate([
    (0, abstract_entity_1.JsonColumn)({ nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_1.Role),
    (0, typeorm_1.JoinColumn)({ name: 'roleSlug', referencedColumnName: 'slug' }),
    __metadata("design:type", role_1.Role)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('AuthIdentity', 'user'),
    __metadata("design:type", Array)
], User.prototype, "authIdentities", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('ApiKey', 'user'),
    __metadata("design:type", Array)
], User.prototype, "apiKeys", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('SharedWorkflow', 'user'),
    __metadata("design:type", Array)
], User.prototype, "sharedWorkflows", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('SharedCredentials', 'user'),
    __metadata("design:type", Array)
], User.prototype, "sharedCredentials", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('ProjectRelation', 'user'),
    __metadata("design:type", Array)
], User.prototype, "projectRelations", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "disabled", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    (0, typeorm_1.BeforeUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], User.prototype, "preUpsertHook", null);
__decorate([
    (0, typeorm_1.Column)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "mfaEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: String, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "mfaSecret", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: '' }),
    __metadata("design:type", Array)
], User.prototype, "mfaRecoveryCodes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "lastActiveAt", void 0);
__decorate([
    (0, typeorm_1.AfterLoad)(),
    (0, typeorm_1.AfterUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], User.prototype, "computeIsPending", null);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)()
], User);
//# sourceMappingURL=user.js.map