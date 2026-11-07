"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decideWorkflowPublishingAction = decideWorkflowPublishingAction;
const workflow_publishing_policy_types_1 = require("./workflow-publishing-policy.types");
const WORKFLOW_PUBLISHING_POLICIES = {
    [workflow_publishing_policy_types_1.WorkflowPublishingPolicy.PreservePublishedState]: ({ status, currentlyPublished, sourcePublished, }) => (status === 'updated' && currentlyPublished && sourcePublished ? 'publish' : 'noop'),
    [workflow_publishing_policy_types_1.WorkflowPublishingPolicy.MatchSource]: ({ status, sourcePublished, currentlyPublished }) => {
        if (sourcePublished === undefined)
            return 'noop';
        if (sourcePublished && (status === 'created' || status === 'updated')) {
            return 'publish';
        }
        if (status === 'updated' && !sourcePublished && currentlyPublished) {
            return 'unpublish';
        }
        return 'noop';
    },
    [workflow_publishing_policy_types_1.WorkflowPublishingPolicy.PublishAll]: () => 'publish',
    [workflow_publishing_policy_types_1.WorkflowPublishingPolicy.UnpublishAll]: ({ status, currentlyPublished }) => status === 'updated' && currentlyPublished ? 'unpublish' : 'noop',
};
function decideWorkflowPublishingAction(policy, context) {
    if (context.status === 'skipped') {
        return 'noop';
    }
    if (context.isArchived) {
        return context.currentlyPublished ? 'unpublish' : 'noop';
    }
    return WORKFLOW_PUBLISHING_POLICIES[policy](context);
}
//# sourceMappingURL=workflow-publishing-policy.js.map