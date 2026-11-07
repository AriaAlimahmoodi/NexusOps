"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeWorkflowPublishedVersionFKsToRestrict1772619247762 = void 0;
class ChangeWorkflowPublishedVersionFKsToRestrict1772619247762 {
    async up({ schemaBuilder: { dropForeignKey, addForeignKey } }) {
        await dropForeignKey('workflow_published_version', 'workflowId', ['workflow_entity', 'id']);
        await addForeignKey('workflow_published_version', 'workflowId', ['workflow_entity', 'id'], undefined, 'RESTRICT');
        await dropForeignKey('workflow_published_version', 'publishedVersionId', [
            'workflow_history',
            'versionId',
        ]);
        await addForeignKey('workflow_published_version', 'publishedVersionId', ['workflow_history', 'versionId'], undefined, 'RESTRICT');
    }
    async down({ schemaBuilder: { dropForeignKey, addForeignKey } }) {
        await dropForeignKey('workflow_published_version', 'workflowId', ['workflow_entity', 'id']);
        await addForeignKey('workflow_published_version', 'workflowId', ['workflow_entity', 'id'], undefined, 'CASCADE');
        await dropForeignKey('workflow_published_version', 'publishedVersionId', [
            'workflow_history',
            'versionId',
        ]);
        await addForeignKey('workflow_published_version', 'publishedVersionId', ['workflow_history', 'versionId'], undefined, 'CASCADE');
    }
}
exports.ChangeWorkflowPublishedVersionFKsToRestrict1772619247762 = ChangeWorkflowPublishedVersionFKsToRestrict1772619247762;
//# sourceMappingURL=1772619247762-ChangeWorkflowPublishedVersionFKsToRestrict.js.map