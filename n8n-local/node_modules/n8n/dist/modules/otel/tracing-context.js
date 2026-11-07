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
exports.TraceContextService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
let TraceContextService = class TraceContextService {
    constructor(executionRepository, logger) {
        this.executionRepository = executionRepository;
        this.logger = logger;
    }
    async persist(executionId, tracingContext) {
        try {
            await this.executionRepository.update(executionId, { tracingContext });
        }
        catch (error) {
            this.logger.error('Failed to persist tracing context', {
                executionId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    async get(executionId) {
        try {
            const execution = await this.executionRepository.findOne({
                where: { id: executionId },
                select: ['tracingContext'],
            });
            return execution?.tracingContext ?? undefined;
        }
        catch (error) {
            this.logger.error('Failed to load tracing context', {
                executionId,
                error: error instanceof Error ? error.message : String(error),
            });
            return undefined;
        }
    }
};
exports.TraceContextService = TraceContextService;
exports.TraceContextService = TraceContextService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.ExecutionRepository, backend_common_1.Logger])
], TraceContextService);
//# sourceMappingURL=tracing-context.js.map