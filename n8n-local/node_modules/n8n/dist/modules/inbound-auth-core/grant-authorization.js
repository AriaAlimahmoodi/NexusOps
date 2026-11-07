"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeAgainstGrant = authorizeAgainstGrant;
async function authorizeAgainstGrant(workflowFinderService, grant, user) {
    if (!grant.executeAccessWorkflowId)
        return true;
    const allowed = await workflowFinderService.findWorkflowIdsWithScopeForUser([grant.executeAccessWorkflowId], user, ['workflow:execute']);
    return allowed.has(grant.executeAccessWorkflowId);
}
//# sourceMappingURL=grant-authorization.js.map