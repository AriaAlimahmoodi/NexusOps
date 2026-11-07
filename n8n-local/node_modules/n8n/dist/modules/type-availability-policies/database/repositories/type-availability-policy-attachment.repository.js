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
exports.TypeAvailabilityPolicyAttachmentRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const type_availability_policy_attachment_entity_1 = require("../entities/type-availability-policy-attachment.entity");
const type_availability_policy_scope_entity_1 = require("../entities/type-availability-policy-scope.entity");
const type_availability_policy_entity_1 = require("../entities/type-availability-policy.entity");
let TypeAvailabilityPolicyAttachmentRepository = class TypeAvailabilityPolicyAttachmentRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(type_availability_policy_attachment_entity_1.TypeAvailabilityPolicyAttachment, dataSource.manager, transactionRunner);
    }
    async listAttachmentsForScope(scopeId, ctx) {
        const byScope = await this.listAttachmentsForScopes([scopeId], ctx);
        return byScope.get(scopeId) ?? [];
    }
    async listAttachmentsForScopes(scopeIds, ctx) {
        const manager = this.managerFor(ctx);
        const attachments = [];
        for (const ids of (0, db_1.chunkIds)(scopeIds)) {
            attachments.push(...(await manager.findBy(type_availability_policy_attachment_entity_1.TypeAvailabilityPolicyAttachment, { scopeId: (0, typeorm_1.In)(ids) })));
        }
        const rulesByPolicyId = new Map();
        for (const ids of (0, db_1.chunkIds)([...new Set(attachments.map((a) => a.policyId))])) {
            for (const policy of await manager.findBy(type_availability_policy_entity_1.TypeAvailabilityPolicy, { id: (0, typeorm_1.In)(ids) })) {
                rulesByPolicyId.set(policy.id, policy.rules);
            }
        }
        const byScope = new Map();
        for (const { scopeId, policyId, priority, isFloor } of attachments) {
            const rules = rulesByPolicyId.get(policyId);
            if (!rules)
                continue;
            const list = byScope.get(scopeId) ?? [];
            list.push({ policyId, rules, priority, isFloor });
            byScope.set(scopeId, list);
        }
        return byScope;
    }
    async replaceAttachmentsForScope(scopeId, attachments, ctx) {
        await this.runInTransaction(ctx, async (tx) => {
            await this.assertAttachableToScope(scopeId, attachments, tx);
            await tx.delete(type_availability_policy_attachment_entity_1.TypeAvailabilityPolicyAttachment, { scopeId });
            if (attachments.length === 0)
                return;
            await tx.insert(type_availability_policy_attachment_entity_1.TypeAvailabilityPolicyAttachment, attachments.map((a) => ({ scopeId, ...a })));
        });
    }
    async assertAttachableToScope(scopeId, attachments, tx) {
        const scope = await tx.findOne(type_availability_policy_scope_entity_1.TypeAvailabilityPolicyScope, {
            select: { id: true, kind: true },
            where: { id: scopeId },
        });
        if (!scope) {
            throw new n8n_workflow_1.UserError('Cannot attach policies to an unknown scope', { extra: { scopeId } });
        }
        if (attachments.length === 0)
            return;
        const policyIds = attachments.map((a) => a.policyId);
        const policies = await tx.find(type_availability_policy_entity_1.TypeAvailabilityPolicy, {
            select: { id: true, kind: true },
            where: { id: (0, typeorm_1.In)(policyIds) },
        });
        const kindByPolicyId = new Map(policies.map((p) => [p.id, p.kind]));
        for (const policyId of policyIds) {
            const kind = kindByPolicyId.get(policyId);
            if (kind === undefined) {
                throw new n8n_workflow_1.UserError('Cannot attach an unknown policy', { extra: { policyId, scopeId } });
            }
            if (kind !== scope.kind) {
                throw new n8n_workflow_1.UserError(`Cannot attach a "${kind}" policy to a "${scope.kind}" scope`, {
                    extra: { policyId, scopeId },
                });
            }
        }
    }
    async listScopeIdsAttachedToPolicy(policyId, ctx) {
        const attachments = await this.managerFor(ctx).findBy(type_availability_policy_attachment_entity_1.TypeAvailabilityPolicyAttachment, {
            policyId,
        });
        return attachments.map((a) => a.scopeId);
    }
};
exports.TypeAvailabilityPolicyAttachmentRepository = TypeAvailabilityPolicyAttachmentRepository;
exports.TypeAvailabilityPolicyAttachmentRepository = TypeAvailabilityPolicyAttachmentRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], TypeAvailabilityPolicyAttachmentRepository);
//# sourceMappingURL=type-availability-policy-attachment.repository.js.map