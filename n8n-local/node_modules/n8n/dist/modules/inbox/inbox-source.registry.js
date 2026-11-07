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
exports.InboxSourceRegistry = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
let InboxSourceRegistry = class InboxSourceRegistry {
    constructor(logger) {
        this.logger = logger;
        this.sources = new Map();
    }
    register(source) {
        if (this.sources.has(source.type)) {
            throw new errors_1.UnexpectedError('Inbox source is already registered', {
                extra: { type: source.type },
            });
        }
        this.sources.set(source.type, source);
    }
    find(type) {
        return this.sources.get(type);
    }
    types() {
        return [...this.sources.keys()];
    }
    async getAllAvailable(types = this.types()) {
        const checks = await Promise.allSettled(types.map(async (type) => {
            const source = this.sources.get(type);
            return source && (await source.isEnabled()) ? source : undefined;
        }));
        const available = [];
        const failedSources = [];
        const disabledSources = [];
        for (const [index, type] of types.entries()) {
            const check = checks[index];
            if (check.status === 'rejected') {
                this.logger.warn('Inbox source availability check failed', { type, error: check.reason });
                failedSources.push(type);
            }
            else if (check.value) {
                available.push(check.value);
            }
            else {
                disabledSources.push(type);
            }
        }
        return { available, failedSources, disabledSources };
    }
};
exports.InboxSourceRegistry = InboxSourceRegistry;
exports.InboxSourceRegistry = InboxSourceRegistry = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger])
], InboxSourceRegistry);
//# sourceMappingURL=inbox-source.registry.js.map