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
exports.SkillsTelemetry = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const telemetry_1 = require("@n8n/telemetry");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const telemetry_2 = require("../../../telemetry");
const skill_repository_1 = require("../repositories/skill.repository");
let SkillsTelemetry = class SkillsTelemetry {
    constructor(telemetry, skillRepository, logger) {
        this.telemetry = telemetry;
        this.skillRepository = skillRepository;
        this.logger = logger;
    }
    async created(userId, refs, source, method) {
        await this.safely(async () => {
            const skills = await this.resolve(refs);
            const placeOf = await this.placeResolver(skills);
            for (const skill of skills) {
                this.telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.USER_CREATED_SKILL, {
                    user_id: userId,
                    skill_id: skill.id,
                    ...placeOf(skill),
                    source,
                    method,
                });
            }
        });
    }
    async updated(userId, ref, source, version, scopeChanged) {
        await this.safely(async () => {
            const [skill] = await this.resolve([ref]);
            if (!skill)
                return;
            const placeOf = await this.placeResolver([skill]);
            this.telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.USER_UPDATED_SKILL, {
                user_id: userId,
                skill_id: skill.id,
                ...placeOf(skill),
                source,
                version,
                scope_changed: scopeChanged,
            });
        });
    }
    async deleted(userId, skill, source) {
        await this.safely(async () => {
            const placeOf = await this.placeResolver([skill]);
            this.telemetry.track(telemetry_1.TELEMETRY_EVENT.CONTEXT.USER_DELETED_SKILL, {
                user_id: userId,
                skill_id: skill.id,
                ...placeOf(skill),
                source,
            });
        });
    }
    async resolve(refs) {
        const ids = refs.filter((ref) => typeof ref === 'string');
        const read = ids.length > 0 ? await this.skillRepository.findByIds(ids) : [];
        return [...refs.filter((ref) => typeof ref !== 'string'), ...read];
    }
    async placeResolver(skills) {
        const agents = await this.skillRepository.findAgents(skills.flatMap((skill) => (skill.agentId ? [skill.agentId] : [])));
        return (skill) => {
            if (skill.agentId) {
                const projectId = agents.get(skill.agentId)?.projectId;
                return { scope: 'agent', ...(projectId ? { project_id: projectId } : {}) };
            }
            if (skill.projectId)
                return { scope: 'project', project_id: skill.projectId };
            return { scope: 'instance' };
        };
    }
    async safely(emit) {
        try {
            await emit();
        }
        catch (error) {
            this.logger.warn('Could not send skills telemetry', { error: (0, ensure_error_1.ensureError)(error).message });
        }
    }
};
exports.SkillsTelemetry = SkillsTelemetry;
exports.SkillsTelemetry = SkillsTelemetry = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [telemetry_2.Telemetry, skill_repository_1.SkillRepository, backend_common_1.Logger])
], SkillsTelemetry);
//# sourceMappingURL=skills-telemetry.js.map