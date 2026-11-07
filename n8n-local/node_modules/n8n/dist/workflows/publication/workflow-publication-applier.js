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
exports.WorkflowPublicationApplier = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const telemetry_1 = require("@n8n/telemetry");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const node_types_1 = require("../../node-types");
const enforce_workflow_publish_1 = require("../../policy/enforce-workflow-publish");
const policy_enforcement_service_1 = require("../../policy/policy-enforcement.service");
const policy_violation_error_1 = require("../../policy/policy-violation.error");
const durable_job_provisioner_1 = require("../../scheduling/durable-job-provisioner");
const workflow_scheduled_job_owner_1 = require("../../scheduling/workflow-scheduled-job-owner");
const ownership_service_1 = require("../../services/ownership.service");
const telemetry_2 = require("../../telemetry");
const format_node_failures_1 = require("../../workflows/publication/format-node-failures");
const heal_node_ids_1 = require("../../workflows/publication/heal-node-ids");
const trigger_diff_1 = require("../../workflows/publication/trigger-diff");
const enabled_trigger_nodes_1 = require("../../workflows/triggers/enabled-trigger-nodes");
const workflow_service_1 = require("../../workflows/workflow.service");
const workflow_trigger_activator_1 = require("../../workflows/triggers/workflow-trigger-activator");
const backend_services_1 = require("@n8n/backend-services");
const ACTIVATION_MODE_BY_REASON = {
    [db_1.WorkflowPublicationReason.Publish]: 'update',
    [db_1.WorkflowPublicationReason.Startup]: 'init',
    [db_1.WorkflowPublicationReason.LeadershipTakeover]: 'leadershipChange',
    [db_1.WorkflowPublicationReason.Reconcile]: 'update',
};
let WorkflowPublicationApplier = class WorkflowPublicationApplier {
    constructor(logger, workflowRepository, workflowHistoryRepository, workflowPublishedVersionRepository, workflowTriggerActivator, workflowPublishedDataService, nodeTypes, workflowService, telemetry, policyEnforcementService, ownershipService, workflowScheduledJobOwner, durableJobProvisioner) {
        this.logger = logger;
        this.workflowRepository = workflowRepository;
        this.workflowHistoryRepository = workflowHistoryRepository;
        this.workflowPublishedVersionRepository = workflowPublishedVersionRepository;
        this.workflowTriggerActivator = workflowTriggerActivator;
        this.workflowPublishedDataService = workflowPublishedDataService;
        this.nodeTypes = nodeTypes;
        this.workflowService = workflowService;
        this.telemetry = telemetry;
        this.policyEnforcementService = policyEnforcementService;
        this.ownershipService = ownershipService;
        this.workflowScheduledJobOwner = workflowScheduledJobOwner;
        this.durableJobProvisioner = durableJobProvisioner;
        this.logger = this.logger.scoped('workflow-publication');
    }
    async apply(record, abort) {
        const { workflow, oldVersion, newVersion } = await this.resolveVersions(record);
        if (!workflow)
            return { type: 'skipped', reason: 'workflow-not-found' };
        if (workflow.activeVersionId === null) {
            return await this.unpublish(workflow, oldVersion, record, abort);
        }
        if (!newVersion)
            return { type: 'version-missing' };
        return await this.publish(workflow, oldVersion, newVersion, record, abort);
    }
    async publish(workflow, oldVersion, newVersion, record, abort) {
        const healSkip = await this.healBrokenNodeIds(workflow, newVersion);
        if (healSkip !== null)
            return healSkip;
        const unrunnable = await this.handleUnrunnableVersion(workflow, oldVersion, newVersion, record, abort);
        if (unrunnable !== null)
            return unrunnable;
        const blocked = await this.enforcePublishPolicy(workflow, newVersion);
        if (blocked !== null)
            return blocked;
        const { old, oldTriggerCandidates } = this.resolveOldTriggerCandidates(oldVersion);
        const desiredTriggerNodes = this.workflowTriggerActivator.getEnabledTriggerNodes(newVersion);
        const triggerKinds = this.workflowTriggerActivator.getTriggerKinds(desiredTriggerNodes);
        const { toAdd, toRemove } = (0, trigger_diff_1.computeTriggerDiff)(oldTriggerCandidates, desiredTriggerNodes, {
            versionChanged: oldVersion !== null && oldVersion.versionId !== newVersion.versionId,
        });
        this.logger.debug(`Calculated trigger diff for workflow publication: ${toAdd.size} to add, ${toRemove.size} to remove`, {
            workflowId: record.workflowId,
            publishedVersionId: record.publishedVersionId,
            toAdd: Array.from(toAdd),
            toRemove: Array.from(toRemove),
        });
        this.workflowTriggerActivator
            .getUnregisteredNonWebhookTriggerNodeIds(record.workflowId, desiredTriggerNodes)
            .forEach((nodeId) => toAdd.add(nodeId));
        const nodesWithUnregisteredWebhooks = await this.workflowTriggerActivator.getNodesWithUnregisteredWebhooks(workflow, newVersion);
        nodesWithUnregisteredWebhooks.forEach((nodeId) => toAdd.add(nodeId));
        if (toAdd.size === 0 && toRemove.size === 0) {
            await this.advancePublishedVersion(record);
            return {
                type: 'completed',
                triggerStatuses: this.buildTriggerStatuses(desiredTriggerNodes, triggerKinds, {
                    activated: [],
                    failures: [],
                }),
            };
        }
        abort.signal.throwIfAborted();
        const teardownFailures = await this.teardownOldVersionNodes(workflow, old, toRemove, abort);
        const withTeardownFailures = (result) => this.withTeardownFailures(result, teardownFailures);
        try {
            await this.advancePublishedVersion(record);
            abort.signal.throwIfAborted();
            if (toAdd.size > 0) {
                const activationMode = this.resolveActivationMode(record, oldVersion);
                const outcome = await this.workflowTriggerActivator.activate(workflow, newVersion, toAdd, activationMode, abort);
                return withTeardownFailures(this.classifyActivationOutcome(outcome, desiredTriggerNodes, triggerKinds));
            }
            if (toRemove.size > 0) {
                await this.workflowTriggerActivator.updateTriggerCount(workflow, newVersion);
            }
        }
        catch (e) {
            return withTeardownFailures({ type: 'failed', error: (0, ensure_error_1.ensureError)(e) });
        }
        return withTeardownFailures({
            type: 'completed',
            triggerStatuses: this.buildTriggerStatuses(desiredTriggerNodes, triggerKinds, {
                activated: [],
                failures: [],
            }),
        });
    }
    partitionByResolvability(version) {
        const unresolvable = [];
        const resolvable = [];
        for (const node of version.nodes) {
            try {
                this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
                resolvable.push(node);
            }
            catch (e) {
                unresolvable.push({ node, error: (0, ensure_error_1.ensureError)(e) });
            }
        }
        const runnable = unresolvable.length === 0 ? version : { nodes: resolvable, connections: version.connections };
        return { runnable, unresolvable };
    }
    resolveOldTriggerCandidates(oldVersion) {
        const old = oldVersion === null ? null : this.partitionByResolvability(oldVersion);
        const oldTriggerCandidates = [
            ...this.workflowTriggerActivator.getEnabledTriggerNodes(old?.runnable ?? null),
            ...(old?.unresolvable ?? []).map(({ node }) => node),
        ];
        return { old, oldTriggerCandidates };
    }
    async handleUnrunnableVersion(workflow, oldVersion, newVersion, record, abort) {
        const { runnable, unresolvable } = this.partitionByResolvability(newVersion);
        if (unresolvable.length === 0)
            return null;
        this.logger.warn('Published version holds node types this instance cannot load', {
            workflowId: workflow.id,
            versionId: record.publishedVersionId,
            nodeTypes: [...new Set(unresolvable.map(({ node }) => node.type))],
        });
        const { old, oldTriggerCandidates } = this.resolveOldTriggerCandidates(oldVersion);
        const toRemove = new Set(oldTriggerCandidates.map((node) => node.id));
        abort.signal.throwIfAborted();
        const teardownFailures = await this.teardownOldVersionNodes(workflow, old, toRemove, abort);
        try {
            await this.advancePublishedVersion(record);
            await this.workflowTriggerActivator.updateTriggerCount(workflow, runnable);
        }
        catch (e) {
            return this.withTeardownFailures({ type: 'failed', error: (0, ensure_error_1.ensureError)(e) }, teardownFailures);
        }
        const error = new n8n_workflow_1.UserError(`Workflow cannot run on this instance: ${(0, format_node_failures_1.formatNodeFailures)(unresolvable.map(({ node, error }) => ({ nodeName: node.name, message: error.message })))}`);
        const desiredTriggerNodes = this.workflowTriggerActivator.getEnabledTriggerNodes(runnable);
        const triggerKinds = this.workflowTriggerActivator.getTriggerKinds(desiredTriggerNodes);
        const triggerStatuses = [
            ...this.buildTriggerStatuses(desiredTriggerNodes, triggerKinds, {
                activated: [],
                failures: desiredTriggerNodes.map((node) => ({
                    nodeId: node.id,
                    nodeName: node.name,
                    error,
                })),
            }),
            ...unresolvable.map(({ node, error }) => ({
                nodeId: node.id,
                nodeName: node.name,
                status: 'failed',
                triggerKind: 'persisted',
                errorMessage: error.message,
            })),
        ];
        return this.withTeardownFailures({ type: 'failed', error, triggerStatuses }, teardownFailures);
    }
    async teardownOldVersionNodes(workflow, old, nodeIds, abort) {
        if (!old || nodeIds.size === 0)
            return [];
        abort.signal.throwIfAborted();
        const unresolvableIds = new Set(old.unresolvable.map(({ node }) => node.id));
        const resolvable = new Set([...nodeIds].filter((id) => !unresolvableIds.has(id)));
        let teardownFailures = [];
        if (resolvable.size > 0) {
            ({ externalTeardownFailures: teardownFailures } =
                await this.workflowTriggerActivator.deactivate(workflow, old.runnable, resolvable, abort));
        }
        await this.workflowTriggerActivator.deregisterUnresolvableNodes(workflow.id, old.unresolvable.map(({ node }) => node).filter((node) => nodeIds.has(node.id)), abort);
        return teardownFailures;
    }
    withTeardownFailures(result, teardownFailures) {
        return (result.type === 'completed' || result.type === 'partial' || result.type === 'failed') &&
            teardownFailures.length > 0
            ? { ...result, teardownFailures }
            : result;
    }
    async enforcePublishPolicy(workflow, newVersion) {
        try {
            await (0, enforce_workflow_publish_1.enforceWorkflowPublishPolicy)(this.policyEnforcementService, this.ownershipService, { id: workflow.id, name: workflow.name, nodes: newVersion.nodes }, { kind: 'system', reason: 'publication' });
            return null;
        }
        catch (e) {
            if (!(e instanceof policy_violation_error_1.PolicyViolationError))
                throw e;
            this.logger.warn('Workflow publication blocked by policy', {
                workflowId: workflow.id,
                versionId: newVersion.versionId,
                violations: e.violations.map((violation) => violation.kind),
            });
            const desiredTriggerNodes = this.workflowTriggerActivator.getEnabledTriggerNodes(newVersion);
            const triggerKinds = this.workflowTriggerActivator.getTriggerKinds(desiredTriggerNodes);
            return {
                type: 'failed',
                error: e,
                triggerStatuses: this.buildTriggerStatuses(desiredTriggerNodes, triggerKinds, {
                    activated: [],
                    failures: desiredTriggerNodes.map((node) => ({
                        nodeId: node.id,
                        nodeName: node.name,
                        error: e,
                    })),
                }),
            };
        }
    }
    resolveActivationMode(record, oldVersion) {
        const reason = record.reason ?? db_1.WorkflowPublicationReason.Publish;
        if (reason === db_1.WorkflowPublicationReason.Publish && oldVersion === null)
            return 'activate';
        return ACTIVATION_MODE_BY_REASON[reason];
    }
    async unpublish(workflow, oldVersion, record, abort) {
        const { old, oldTriggerCandidates } = this.resolveOldTriggerCandidates(oldVersion);
        const toRemove = new Set(oldTriggerCandidates.map((node) => node.id));
        const teardownFailures = await this.teardownOldVersionNodes(workflow, old, toRemove, abort);
        await this.workflowPublishedDataService.invalidateCache(record.workflowId);
        await this.durableJobProvisioner.deprovisionOwner(this.workflowScheduledJobOwner.ref(record.workflowId));
        await this.workflowPublishedVersionRepository.removePublishedVersion(record.workflowId);
        return teardownFailures.length > 0
            ? { type: 'unpublished', teardownFailures }
            : { type: 'unpublished' };
    }
    classifyActivationOutcome(outcome, desiredTriggerNodes, triggerKinds) {
        const triggerStatuses = this.buildTriggerStatuses(desiredTriggerNodes, triggerKinds, outcome);
        if (outcome.failures.length === 0)
            return { type: 'completed', triggerStatuses };
        const hasRunningTrigger = triggerStatuses.some((s) => s.status === 'activated');
        if (!hasRunningTrigger) {
            return { type: 'failed', error: this.toActivationError(outcome.failures), triggerStatuses };
        }
        return { type: 'partial', triggerStatuses };
    }
    buildTriggerStatuses(desiredTriggerNodes, triggerKinds, outcome) {
        const failureByNodeId = new Map(outcome.failures.map((f) => [f.nodeId, f]));
        return desiredTriggerNodes.map((node) => {
            const triggerKind = triggerKinds.get(node.id) ?? 'persisted';
            const failure = failureByNodeId.get(node.id);
            return failure
                ? {
                    nodeId: node.id,
                    nodeName: node.name,
                    status: 'failed',
                    triggerKind,
                    errorMessage: failure.error.message,
                }
                : { nodeId: node.id, nodeName: node.name, status: 'activated', triggerKind };
        });
    }
    toActivationError(failures) {
        if (failures.length === 1)
            return failures[0].error;
        return new Error((0, format_node_failures_1.formatFailedActivationError)(failures.map(({ nodeName, error }) => ({ nodeName, message: error.message }))));
    }
    async resolveVersions(record) {
        const [workflow, currentlyPublishedVersion, newVersion] = await Promise.all([
            this.workflowRepository.findOneBy({ id: record.workflowId }),
            this.workflowPublishedVersionRepository.findOne({
                where: { workflowId: record.workflowId },
                relations: { publishedVersion: true },
                loadEagerRelations: false,
            }),
            this.workflowHistoryRepository.findOneBy({ versionId: record.publishedVersionId }),
        ]);
        const oldVersion = currentlyPublishedVersion?.publishedVersion ?? null;
        return { workflow, oldVersion, newVersion };
    }
    async healBrokenNodeIds(workflow, newVersion) {
        const healed = (0, heal_node_ids_1.healNodeIds)(newVersion.nodes, {
            isTriggerLike: (node) => this.isTriggerLikeNode(node),
        });
        if (!healed.changed)
            return null;
        this.logger.warn('Published version carries duplicate or missing node ids, publishing a healed version', {
            workflowId: workflow.id,
            versionId: newVersion.versionId,
            filled: healed.report.filled.length,
            reassigned: healed.report.reassigned.length,
            dropped: healed.report.dropped.length,
        });
        const published = await this.workflowService.publishAsSystem(workflow.id, {
            nodes: healed.nodes,
            connections: newVersion.connections,
            nodeGroups: newVersion.nodeGroups,
        }, newVersion.versionId);
        this.telemetry.track(telemetry_1.TELEMETRY_EVENT.WORKFLOW.NODE_IDS_HEALED, {
            workflow_id: workflow.id,
            filled_count: healed.report.filled.length,
            reassigned_count: healed.report.reassigned.length,
            dropped_count: healed.report.dropped.length,
            superseded: !published.published,
        });
        return { type: 'skipped', reason: published.published ? 'node-ids-healed' : 'superseded' };
    }
    isTriggerLikeNode(node) {
        try {
            return (0, enabled_trigger_nodes_1.isTriggerLikeNodeType)(this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion));
        }
        catch {
            return false;
        }
    }
    async advancePublishedVersion(record) {
        await this.workflowPublishedDataService.invalidateCache(record.workflowId);
        await this.workflowPublishedVersionRepository.setPublishedVersion(record.workflowId, record.publishedVersionId);
        await this.workflowPublishedDataService.refreshCache(record.workflowId);
    }
};
exports.WorkflowPublicationApplier = WorkflowPublicationApplier;
exports.WorkflowPublicationApplier = WorkflowPublicationApplier = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.WorkflowRepository, db_1.WorkflowHistoryRepository, db_1.WorkflowPublishedVersionRepository, workflow_trigger_activator_1.WorkflowTriggerActivator, backend_services_1.WorkflowPublishedDataService, node_types_1.NodeTypes, workflow_service_1.WorkflowService, telemetry_2.Telemetry, policy_enforcement_service_1.PolicyEnforcementService, ownership_service_1.OwnershipService, workflow_scheduled_job_owner_1.WorkflowScheduledJobOwner, durable_job_provisioner_1.DurableJobProvisioner])
], WorkflowPublicationApplier);
//# sourceMappingURL=workflow-publication-applier.js.map