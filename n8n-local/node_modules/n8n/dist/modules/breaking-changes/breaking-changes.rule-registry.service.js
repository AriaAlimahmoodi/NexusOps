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
exports.RuleRegistry = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
let RuleRegistry = class RuleRegistry {
    constructor(logger) {
        this.logger = logger;
        this.rules = new Map();
        this.logger = logger.scoped('breaking-changes');
    }
    register(rule) {
        if (this.rules.has(rule.id)) {
            this.logger.warn(`Rule with ID ${rule.id} is already registered. Overwriting.`);
        }
        this.rules.set(rule.id, rule);
        this.logger.debug(`Registered rule: ${rule.id}`);
    }
    registerAll(rules) {
        rules.forEach((rule) => this.register(rule));
    }
    getRule(id) {
        return this.rules.get(id);
    }
    getRules(version) {
        const rules = Array.from(this.rules.values());
        if (!version) {
            return rules;
        }
        return rules.filter((rule) => rule.getMetadata().version === version);
    }
};
exports.RuleRegistry = RuleRegistry;
exports.RuleRegistry = RuleRegistry = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger])
], RuleRegistry);
//# sourceMappingURL=breaking-changes.rule-registry.service.js.map