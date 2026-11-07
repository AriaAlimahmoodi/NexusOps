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
exports.MigrationRegistry = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const migrations_1 = require("./migrations");
let MigrationRegistry = class MigrationRegistry {
    constructor(logger) {
        this.logger = logger;
        this.migrations = new Map();
        this.logger = logger.scoped('breaking-changes');
    }
    registerAll() {
        for (const migration of migrations_1.nodeMigrations) {
            if (this.migrations.has(migration.ruleId)) {
                this.logger.warn(`Migration for rule ${migration.ruleId} is already registered. Overwriting.`);
            }
            this.migrations.set(migration.ruleId, migration);
        }
    }
    get(ruleId) {
        return this.migrations.get(ruleId);
    }
    has(ruleId) {
        return this.migrations.has(ruleId);
    }
};
exports.MigrationRegistry = MigrationRegistry;
exports.MigrationRegistry = MigrationRegistry = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger])
], MigrationRegistry);
//# sourceMappingURL=breaking-changes.migration-registry.service.js.map