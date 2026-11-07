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
exports.AgentEvalRatingService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const agent_repository_1 = require("../../modules/agents/repositories/agent.repository");
const agent_eval_record_mappers_1 = require("./agent-eval-record-mappers");
const agent_evals_required_modules_1 = require("./agent-evals-required-modules");
const MAX_CORRECTION_CHARS = 32_000;
let AgentEvalRatingService = class AgentEvalRatingService {
    constructor(logger, moduleRegistry, ratingRepository, resultRepository, runRepository, agentRepository) {
        this.logger = logger;
        this.moduleRegistry = moduleRegistry;
        this.ratingRepository = ratingRepository;
        this.resultRepository = resultRepository;
        this.runRepository = runRepository;
        this.agentRepository = agentRepository;
    }
    async rateResult(user, agentId, projectId, resultId, payload) {
        await this.assertAgentInProject(agentId, projectId);
        assertPayloadWithinBounds(payload);
        const result = await this.resolveResult(agentId, resultId);
        if (result.status === 'new' || result.status === 'running') {
            throw new errors_1.BadRequestError('This case has not finished running yet.');
        }
        const rating = await this.ratingRepository.createRating({
            resultId: result.id,
            vote: payload.vote,
            comment: payload.comment ?? null,
            correction: payload.correction ?? null,
            ratedById: user.id,
        });
        this.logger.debug('Recorded agent eval rating', {
            resultId: result.id,
            vote: rating.vote,
            hasCorrection: rating.correction !== null,
        });
        return (0, agent_eval_record_mappers_1.toRatingRecord)(rating);
    }
    async listRatingsForResult(agentId, projectId, resultId) {
        await this.assertAgentInProject(agentId, projectId);
        const result = await this.resolveResult(agentId, resultId);
        const ratings = await this.ratingRepository.findByResultId(result.id);
        return ratings.map(agent_eval_record_mappers_1.toRatingRecord);
    }
    async listLatestRatingsForRun(agentId, projectId, runId) {
        await this.assertAgentInProject(agentId, projectId);
        await this.resolveRun(agentId, runId);
        const ratings = await this.ratingRepository.findLatestByRunId(runId);
        return ratings.map(agent_eval_record_mappers_1.toRatingRecord);
    }
    async assertAgentInProject(agentId, projectId) {
        (0, agent_evals_required_modules_1.assertRequiredModulesActive)(this.moduleRegistry);
        const inProject = await this.agentRepository.existsByIdAndProjectId(agentId, projectId);
        if (!inProject)
            throw new errors_1.NotFoundError(`Agent ${agentId} not found.`);
    }
    async resolveResult(agentId, resultId) {
        const notFound = () => new errors_1.NotFoundError(`Agent eval result ${resultId} not found.`);
        const result = await this.resultRepository.findById(resultId);
        if (!result)
            throw notFound();
        const run = await this.runRepository.findByIdAndAgentId(result.runId, agentId);
        if (!run)
            throw notFound();
        return result;
    }
    async resolveRun(agentId, runId) {
        const run = await this.runRepository.findByIdAndAgentId(runId, agentId);
        if (!run)
            throw new errors_1.NotFoundError(`Agent eval run ${runId} not found.`);
    }
};
exports.AgentEvalRatingService = AgentEvalRatingService;
exports.AgentEvalRatingService = AgentEvalRatingService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_common_1.ModuleRegistry, db_1.AgentEvalRatingRepository, db_1.AgentEvalResultRepository, db_1.AgentEvalRunRepository, agent_repository_1.AgentRepository])
], AgentEvalRatingService);
function assertPayloadWithinBounds(payload) {
    if (payload.comment !== undefined && payload.comment.length > api_types_1.AGENT_EVAL_MAX_COMMENT_CHARS) {
        throw new errors_1.BadRequestError(`A rating comment cannot exceed ${api_types_1.AGENT_EVAL_MAX_COMMENT_CHARS} characters.`);
    }
    const { correction } = payload;
    if (correction === undefined)
        return;
    const finalText = correction.finalText;
    if (typeof finalText !== 'string' || finalText.trim().length === 0) {
        throw new errors_1.BadRequestError("A correction must carry the edited answer in 'finalText'.");
    }
    if (finalText.length > api_types_1.AGENT_EVAL_MAX_CORRECTION_TEXT_CHARS) {
        throw new errors_1.BadRequestError(`A corrected answer cannot exceed ${api_types_1.AGENT_EVAL_MAX_CORRECTION_TEXT_CHARS} characters.`);
    }
    if (JSON.stringify(correction).length > MAX_CORRECTION_CHARS) {
        throw new errors_1.BadRequestError(`A correction cannot exceed ${MAX_CORRECTION_CHARS} characters in total.`);
    }
}
//# sourceMappingURL=agent-eval-rating.service.js.map