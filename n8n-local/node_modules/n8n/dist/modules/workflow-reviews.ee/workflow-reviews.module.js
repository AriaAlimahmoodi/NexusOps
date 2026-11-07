"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowReviewsModule = void 0;
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
let WorkflowReviewsModule = class WorkflowReviewsModule {
    async init() {
        await import('./workflow-review-requests.controller.js');
        const { InboxSourceRegistry } = await import('../inbox/inbox-source.registry.js');
        const { WorkflowReviewInboxService } = await import('./workflow-review-inbox.service.js');
        const inbox = di_1.Container.get(WorkflowReviewInboxService);
        di_1.Container.get(InboxSourceRegistry).register({
            type: 'workflow_review',
            isEnabled: async () => await inbox.isInboxAvailable(),
            list: async (user, query) => await inbox.listForInbox(user, query),
            count: async (user) => await inbox.getInboxSummaryForUser(user),
        });
        const { WorkflowReviewPublishGuard } = await import('./workflow-review-publish-guard.service.js');
        di_1.Container.get(backend_services_1.WorkflowPublishGuardProxy).registerProvider(di_1.Container.get(WorkflowReviewPublishGuard));
        const { WorkflowReviewLifecycleService } = await import('./workflow-review-lifecycle.service.js');
        di_1.Container.get(backend_services_1.WorkflowMutationHooksProxy).registerProvider(di_1.Container.get(WorkflowReviewLifecycleService));
    }
};
exports.WorkflowReviewsModule = WorkflowReviewsModule;
exports.WorkflowReviewsModule = WorkflowReviewsModule = __decorate([
    (0, decorators_1.BackendModule)({ name: 'workflow-reviews', licenseFlag: constants_1.LICENSE_FEATURES.WORKFLOW_REVIEWS })
], WorkflowReviewsModule);
//# sourceMappingURL=workflow-reviews.module.js.map