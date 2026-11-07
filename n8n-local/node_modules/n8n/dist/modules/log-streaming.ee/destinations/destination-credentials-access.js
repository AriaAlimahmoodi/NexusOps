"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertUserCanUseDestinationCredentials = assertUserCanUseDestinationCredentials;
const errors_1 = require("@n8n/errors");
async function assertUserCanUseDestinationCredentials(credentialsFinderService, user, options) {
    const { credentials } = options;
    if (!credentials)
        return;
    for (const reference of Object.values(credentials)) {
        const credentialId = reference?.id;
        if (!credentialId)
            continue;
        const credential = await credentialsFinderService.findCredentialForUser(credentialId, user, [
            'credential:read',
        ]);
        if (!credential) {
            throw new errors_1.ForbiddenError('You do not have access to the credentials selected for this log streaming destination.');
        }
    }
}
//# sourceMappingURL=destination-credentials-access.js.map