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
exports.AuthHandlerRegistry = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
function isUserHandler(handler) {
    return handler.userClass === db_1.User;
}
let AuthHandlerRegistry = class AuthHandlerRegistry {
    constructor(authHandlerEntryMetadata, logger) {
        this.authHandlerEntryMetadata = authHandlerEntryMetadata;
        this.logger = logger;
        this.handlerMap = new Map();
    }
    async init() {
        this.handlerMap.clear();
        const handlerClasses = this.authHandlerEntryMetadata.getClasses();
        this.logger.debug(`Registering ${handlerClasses.length} auth handlers.`);
        for (const HandlerClass of handlerClasses) {
            let handler;
            try {
                const unknownHandler = di_1.Container.get(HandlerClass);
                if (isUserHandler(unknownHandler)) {
                    handler = unknownHandler;
                }
                else {
                    throw new Error(`Handler user class mismatch. Expected User but got ${unknownHandler.userClass.name}`);
                }
            }
            catch (error) {
                this.logger.error(`Failed to instantiate auth handler class "${HandlerClass.name}": ${error.message}`, { error });
                continue;
            }
            if (this.handlerMap.has(handler.metadata.name)) {
                this.logger.warn(`Auth handler with name "${handler.metadata.name}" is already registered. Conflicting classes are "${this.handlerMap.get(handler.metadata.name)?.constructor.name}" and "${HandlerClass.name}". Skipping the latter.`);
                continue;
            }
            if (handler.init) {
                try {
                    await handler.init();
                }
                catch (error) {
                    this.logger.error(`Failed to initialize auth handler "${handler.metadata.name}": ${error.message}`, { error });
                    continue;
                }
            }
            this.handlerMap.set(handler.metadata.name, handler);
        }
    }
    isPasswordAuthHandler(handler) {
        return handler.metadata.type === 'password';
    }
    get(authMethod, type) {
        const handler = this.handlerMap.get(authMethod);
        if (!handler) {
            return undefined;
        }
        if (handler.metadata.type !== type) {
            return undefined;
        }
        if (type === 'password' && this.isPasswordAuthHandler(handler)) {
            return handler;
        }
        return handler;
    }
    has(authMethod) {
        return this.handlerMap.has(authMethod);
    }
};
exports.AuthHandlerRegistry = AuthHandlerRegistry;
exports.AuthHandlerRegistry = AuthHandlerRegistry = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [decorators_1.AuthHandlerEntryMetadata, backend_common_1.Logger])
], AuthHandlerRegistry);
//# sourceMappingURL=auth-handler.registry.js.map