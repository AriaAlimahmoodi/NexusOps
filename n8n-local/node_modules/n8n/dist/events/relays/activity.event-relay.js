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
exports.ActivityEventRelay = void 0;
const backend_common_1 = require("@n8n/backend-common");
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const event_relay_1 = require("../../events/relays/event-relay");
const posthog_1 = require("../../posthog");
const CORE_NODE_TYPE_PREFIX = 'n8n-nodes-base.';
const maxListedNodeTypes = 5;
const maxDetailStringLength = 64;
let ActivityEventRelay = class ActivityEventRelay extends event_relay_1.EventRelay {
    constructor(eventService, activityEventRepository, sharedWorkflowRepository, sharedCredentialsRepository, globalConfig, postHogClient, logger) {
        super(eventService);
        this.activityEventRepository = activityEventRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.globalConfig = globalConfig;
        this.postHogClient = postHogClient;
        this.logger = logger;
        this.logger = this.logger.scoped('activity-log');
    }
    init() {
        if (!this.globalConfig.diagnostics.enabled && !this.overrideEnablesFlag()) {
            return;
        }
        this.setupListeners(this.guarded({
            'workflow-created': async (e) => await this.onWorkflowCreated(e),
            'workflow-saved': async (e) => await this.onWorkflowSaved(e),
            'workflow-activated': async (e) => await this.onPublishToggled(e, 'published'),
            'workflow-deactivated': async (e) => await this.onPublishToggled(e, 'unpublished'),
            'workflow-archived': async (e) => await this.onWorkflowFlagged(e, 'archived'),
            'workflow-unarchived': async (e) => await this.onWorkflowFlagged(e, 'unarchived'),
            'workflow-deleted': async (e) => await this.onWorkflowDeleted(e),
            'workflow-version-updated': async (e) => await this.onWorkflowVersionUpdated(e),
            'credentials-created': async (e) => await this.onCredentialCreated(e),
            'credentials-updated': async (e) => await this.onCredentialUpdated(e),
            'credentials-deleted': async (e) => await this.onCredentialDeleted(e),
        }));
    }
    overrideEnablesFlag() {
        const override = this.globalConfig.featureFlags.override[api_types_1.INSTANCE_ACTIVITY_CONTEXT_FLAG];
        const value = typeof override === 'object' ? override.value : override;
        return value === true;
    }
    async shouldRecord() {
        if (this.gateCheck)
            return await this.gateCheck;
        const check = this.readGate().finally(() => {
            this.gateCheck = undefined;
        });
        this.gateCheck = check;
        return await check;
    }
    async readGate() {
        try {
            return ((await this.postHogClient.getFeatureFlagForInstance(api_types_1.INSTANCE_ACTIVITY_CONTEXT_FLAG)) ===
                true);
        }
        catch {
            return false;
        }
    }
    guarded(handlers) {
        const entries = Object.entries(handlers);
        const wrapped = entries.map(([event, handle]) => [
            event,
            async (payload) => {
                try {
                    if (!(await this.shouldRecord()))
                        return;
                    await handle(payload);
                }
                catch (error) {
                    this.logger.warn('Failed to record activity for an event', { event, error });
                }
            },
        ]);
        return Object.fromEntries(wrapped);
    }
    async onWorkflowCreated({ user, workflow, projectId, source, }) {
        await this.record({
            category: 'workflow',
            action: 'created',
            userId: user.id,
            projectId,
            resourceType: 'workflow',
            resourceId: workflow.id,
            resourceName: workflow.name,
            data: { ...provenance(source), nodeCount: nodeCount(workflow) },
        });
    }
    async onWorkflowSaved(event) {
        const { user, workflow } = event;
        await this.record({
            category: 'workflow',
            action: 'saved',
            userId: user.id,
            projectId: await this.resolveWorkflowProject(workflow.id),
            resourceType: 'workflow',
            resourceId: workflow.id,
            resourceName: workflow.name,
            data: savedDetail(event),
        });
    }
    async onPublishToggled({ user, workflowId, workflow, source, }, action) {
        await this.record({
            category: 'workflow',
            action,
            userId: user.id,
            projectId: await this.resolveWorkflowProject(workflowId),
            resourceType: 'workflow',
            resourceId: workflowId,
            resourceName: workflow.name,
            data: { ...provenance(source), ...versionName(workflow.activeVersion?.name) },
        });
    }
    async onWorkflowFlagged({ user, workflowId }, action) {
        await this.record({
            category: 'workflow',
            action,
            userId: user.id,
            projectId: await this.resolveWorkflowProject(workflowId),
            resourceType: 'workflow',
            resourceId: workflowId,
        });
    }
    async onWorkflowDeleted({ user, workflowId, workflowName, projectId, }) {
        await this.record({
            category: 'workflow',
            action: 'deleted',
            userId: user.id,
            projectId,
            resourceType: 'workflow',
            resourceId: workflowId,
            resourceName: workflowName,
        });
    }
    async onWorkflowVersionUpdated({ user, workflowId, workflowName, versionId, versionName: updatedVersionName, }) {
        await this.record({
            category: 'workflow',
            action: 'version-updated',
            userId: user.id,
            projectId: await this.resolveWorkflowProject(workflowId),
            resourceType: 'workflow',
            resourceId: workflowId,
            resourceName: workflowName,
            data: { versionId, ...versionName(updatedVersionName) },
        });
    }
    async onCredentialCreated({ user, credentialId, credentialName, credentialType, projectId, }) {
        await this.record({
            category: 'credential',
            action: 'created',
            userId: user.id,
            projectId: projectId ?? (await this.resolveCredentialProject(credentialId)),
            resourceType: 'credential',
            resourceId: credentialId,
            resourceName: credentialName,
            data: { credentialType },
        });
    }
    async onCredentialUpdated({ user, credentialId, credentialName, credentialType, }) {
        await this.record({
            category: 'credential',
            action: 'updated',
            userId: user.id,
            projectId: await this.resolveCredentialProject(credentialId),
            resourceType: 'credential',
            resourceId: credentialId,
            resourceName: credentialName,
            data: { credentialType },
        });
    }
    async onCredentialDeleted({ user, credentialId, credentialName, credentialType, projectId, }) {
        await this.record({
            category: 'credential',
            action: 'deleted',
            userId: user.id,
            projectId,
            resourceType: 'credential',
            resourceId: credentialId,
            resourceName: credentialName,
            data: { credentialType },
        });
    }
    async record(input) {
        const { projectId, ...rest } = input;
        if (!projectId) {
            const unattributed = rest.category === 'credential'
                ? this.logger.debug.bind(this.logger)
                : this.logger.warn.bind(this.logger);
            unattributed('Dropped an activity entry with no project to attribute it to', {
                category: rest.category,
                action: rest.action,
                resourceId: rest.resourceId,
            });
            return;
        }
        try {
            await this.activityEventRepository.record({ ...rest, projectId });
        }
        catch (error) {
            this.logger.warn('Failed to record an activity entry', {
                category: rest.category,
                action: rest.action,
                error,
            });
        }
    }
    async resolveWorkflowProject(workflowId) {
        const project = await this.sharedWorkflowRepository.getWorkflowOwningProject(workflowId);
        return project?.id;
    }
    async resolveCredentialProject(credentialId) {
        const project = await this.sharedCredentialsRepository.findCredentialOwningProject(credentialId);
        return project?.id;
    }
};
exports.ActivityEventRelay = ActivityEventRelay;
exports.ActivityEventRelay = ActivityEventRelay = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.EventService, db_1.ActivityEventRepository, db_1.SharedWorkflowRepository, db_1.SharedCredentialsRepository, config_1.GlobalConfig, posthog_1.PostHogClient, backend_common_1.Logger])
], ActivityEventRelay);
function nodeCount(workflow) {
    return workflow.nodes?.length ?? 0;
}
function provenance(source, aiBuilderAssisted) {
    return {
        ...(source ? { source } : {}),
        ...(aiBuilderAssisted === undefined ? {} : { aiBuilderAssisted }),
    };
}
function shortNodeType(node) {
    const type = node?.type;
    if (typeof type !== 'string')
        return 'unknown';
    return type.startsWith(CORE_NODE_TYPE_PREFIX) ? type.slice(CORE_NODE_TYPE_PREFIX.length) : type;
}
function distinctNodeTypes(nodes) {
    return new Set((nodes ?? []).map(shortNodeType));
}
function nodeTypeDelta(after, before) {
    const beforeTypes = distinctNodeTypes(before);
    const afterTypes = distinctNodeTypes(after);
    return {
        added: [...afterTypes].filter((type) => !beforeTypes.has(type)).sort(),
        removed: [...beforeTypes].filter((type) => !afterTypes.has(type)).sort(),
    };
}
function listNodeTypes(types, listKey, totalKey) {
    if (types.length === 0)
        return {};
    if (types.length <= maxListedNodeTypes)
        return { [listKey]: types };
    return { [listKey]: types.slice(0, maxListedNodeTypes), [totalKey]: types.length };
}
function versionName(name) {
    return name ? { versionName: clip(name) } : {};
}
function clip(value) {
    return value.length > maxDetailStringLength ? value.slice(0, maxDetailStringLength) : value;
}
function fitsBudget(data) {
    return JSON.stringify(data).length <= db_1.activityDataMaxLength;
}
function savedDetail(event) {
    const { workflow, previousWorkflow, source, aiBuilderAssisted, settingsChanged } = event;
    const base = {
        ...provenance(source, aiBuilderAssisted),
        nodeCount: nodeCount(workflow),
    };
    if (!previousWorkflow)
        return base;
    const { added, removed } = nodeTypeDelta(workflow.nodes, previousWorkflow.nodes);
    const types = {
        ...listNodeTypes(added, 'nodesAdded', 'nodesAddedTotal'),
        ...listNodeTypes(removed, 'nodesRemoved', 'nodesRemovedTotal'),
    };
    const changedSettings = Object.keys(settingsChanged ?? {}).sort();
    const candidates = [
        { ...base, ...types, ...(changedSettings.length ? { settingsChanged: changedSettings } : {}) },
        { ...base, ...types },
        {
            ...base,
            ...(added.length ? { nodesAddedTotal: added.length } : {}),
            ...(removed.length ? { nodesRemovedTotal: removed.length } : {}),
        },
    ];
    return candidates.find(fitsBudget) ?? base;
}
//# sourceMappingURL=activity.event-relay.js.map