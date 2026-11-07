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
exports.InstanceAiThreadTabsService = void 0;
exports.withShownTab = withShownTab;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const data_table_repository_1 = require("../../modules/data-table/data-table.repository");
const instance_ai_thread_tabs_repository_1 = require("./repositories/instance-ai-thread-tabs.repository");
function isSameTab(a, b) {
    return a.type === b.type && a.id === b.id;
}
function withShownTab(stored, tab) {
    const existing = stored?.tabs.find((open) => isSameTab(open, tab));
    const name = (tab.name ?? existing?.name ?? tab.id).slice(0, 255);
    const projectId = tab.projectId ?? existing?.projectId;
    const merged = {
        type: tab.type,
        id: tab.id,
        name,
        ...(projectId ? { projectId } : {}),
    };
    const activeTab = { type: tab.type, id: tab.id };
    if (stored === null) {
        return { tabs: [merged], closedTabs: [], activeTab, previewOpen: true };
    }
    const isClosed = stored.closedTabs.some((closed) => isSameTab(closed, tab));
    const isShown = stored.activeTab !== null && isSameTab(stored.activeTab, tab) && stored.previewOpen === true;
    if (!isClosed &&
        isShown &&
        existing?.name === merged.name &&
        existing.projectId === merged.projectId) {
        return null;
    }
    const tabs = existing
        ? stored.tabs.map((open) => (isSameTab(open, tab) ? merged : open))
        : [...stored.tabs, merged];
    let closedTabs = stored.closedTabs.filter((closed) => !isSameTab(closed, tab));
    while (tabs.length > api_types_1.MAX_INSTANCE_AI_THREAD_OPEN_TABS) {
        const index = tabs.findIndex((open) => !isSameTab(open, tab));
        const [dropped] = tabs.splice(index, 1);
        closedTabs = [
            ...closedTabs.filter((closed) => !isSameTab(closed, dropped)),
            { type: dropped.type, id: dropped.id },
        ];
    }
    return {
        tabs,
        closedTabs: closedTabs.slice(-api_types_1.MAX_INSTANCE_AI_THREAD_CLOSED_TABS),
        activeTab,
        previewOpen: true,
    };
}
let InstanceAiThreadTabsService = class InstanceAiThreadTabsService {
    constructor(logger, threadTabsRepository, workflowRepository, dataTableRepository) {
        this.logger = logger;
        this.threadTabsRepository = threadTabsRepository;
        this.workflowRepository = workflowRepository;
        this.dataTableRepository = dataTableRepository;
    }
    async getState(threadId, userId) {
        const stored = await this.threadTabsRepository.findState(threadId, userId);
        return this.parseStored(threadId, stored);
    }
    async saveState(threadId, userId, state) {
        await this.threadTabsRepository.saveState(threadId, userId, state);
    }
    async showArtifactTab(threadId, userId, artifact) {
        const tab = await this.withCurrentName(artifact);
        await this.threadTabsRepository.updateState(threadId, userId, (stored) => withShownTab(this.parseStored(threadId, stored), tab));
    }
    async withCurrentName(artifact) {
        if (artifact.type === 'workflow') {
            const [workflow] = await this.workflowRepository.findByIds([artifact.id], {
                fields: ['name'],
            });
            return workflow ? { ...artifact, name: workflow.name } : artifact;
        }
        if (artifact.type === 'data-table') {
            const [table] = await this.dataTableRepository.findSummariesByIds([artifact.id]);
            return table ? { ...artifact, name: table.name, projectId: table.projectId } : artifact;
        }
        return artifact;
    }
    parseStored(threadId, stored) {
        if (stored === null)
            return null;
        const parsed = api_types_1.instanceAiThreadTabsStateSchema.safeParse(stored);
        if (!parsed.success) {
            this.logger.warn('Ignoring invalid stored Instance AI thread tabs', { threadId });
            return null;
        }
        return parsed.data;
    }
};
exports.InstanceAiThreadTabsService = InstanceAiThreadTabsService;
exports.InstanceAiThreadTabsService = InstanceAiThreadTabsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, instance_ai_thread_tabs_repository_1.InstanceAiThreadTabsRepository, db_1.WorkflowRepository, data_table_repository_1.DataTableRepository])
], InstanceAiThreadTabsService);
//# sourceMappingURL=instance-ai-thread-tabs.service.js.map