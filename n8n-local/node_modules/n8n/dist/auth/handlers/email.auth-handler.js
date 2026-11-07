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
exports.EmailAuthHandler = void 0;
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const password_utility_1 = require("../../services/password.utility");
let EmailAuthHandler = class EmailAuthHandler {
    constructor(userRepository, passwordUtility, eventService, globalConfig) {
        this.userRepository = userRepository;
        this.passwordUtility = passwordUtility;
        this.eventService = eventService;
        this.globalConfig = globalConfig;
        this.metadata = { name: 'email', type: 'password' };
        this.userClass = db_1.User;
    }
    async handleLogin(email, password) {
        const user = await this.userRepository.findOne({
            where: { email },
            relations: ['authIdentities', 'role'],
        });
        if (user?.password && (await this.passwordUtility.compare(password, user.password))) {
            return user;
        }
        const ldapIdentity = user?.authIdentities?.find((i) => i.providerType === 'ldap');
        if (user && ldapIdentity && !this.globalConfig.sso.ldap.loginEnabled) {
            this.eventService.emit('login-failed-due-to-ldap-disabled', { userId: user.id });
            throw new errors_1.AuthError('Reset your password to gain access to the instance.');
        }
        return undefined;
    }
};
exports.EmailAuthHandler = EmailAuthHandler;
exports.EmailAuthHandler = EmailAuthHandler = __decorate([
    (0, decorators_1.AuthHandler)(),
    __metadata("design:paramtypes", [db_1.UserRepository, password_utility_1.PasswordUtility, backend_services_1.EventService, config_1.GlobalConfig])
], EmailAuthHandler);
//# sourceMappingURL=email.auth-handler.js.map