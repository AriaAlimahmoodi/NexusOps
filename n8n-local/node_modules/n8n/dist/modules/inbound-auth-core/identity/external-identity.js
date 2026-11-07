"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateClaims = translateClaims;
const n8n_workflow_1 = require("n8n-workflow");
function readClaim(claims, source, logger) {
    if (!source.startsWith('=')) {
        return Object.hasOwn(claims, source) ? claims[source] : undefined;
    }
    const expression = source.slice(1);
    try {
        const value = n8n_workflow_1.Expression.resolveWithoutWorkflow(expression, {
            $claims: claims,
        });
        const usable = typeof value === 'string' ? value.trim() !== '' : Array.isArray(value);
        if (!usable)
            logger.debug('Claim mapping expression yielded no usable value', { source });
        return value;
    }
    catch (error) {
        logger.debug('Claim mapping expression failed', { source, error });
        return undefined;
    }
}
function nonEmptyStringExact(value) {
    return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}
function nonEmptyString(value) {
    return nonEmptyStringExact(value)?.trim();
}
function toScopes(value) {
    const parts = typeof value === 'string'
        ? value.split(/\s+/).map((scope) => scope.trim())
        : Array.isArray(value) && value.every((v) => typeof v === 'string' && v.trim() !== '')
            ? value
            : [];
    return [...new Set(parts.filter((scope) => scope !== ''))];
}
function toVerified(value) {
    if (value === true || value === 'true')
        return true;
    if (value === false || value === 'false')
        return false;
    return undefined;
}
function toAuthTime(value) {
    const seconds = typeof value === 'number'
        ? value
        : typeof value === 'string' && value.trim() !== ''
            ? Number(value)
            : NaN;
    if (!Number.isFinite(seconds) || seconds <= 0)
        return undefined;
    const date = new Date(seconds * 1000);
    return Number.isNaN(date.getTime()) ? undefined : date;
}
function translateClaims(claims, mapping, logger) {
    const subject = nonEmptyStringExact(Object.hasOwn(claims, mapping.subject) ? claims[mapping.subject] : undefined);
    if (subject === undefined) {
        return {
            ok: false,
            reason: 'unknown-subject',
        };
    }
    const read = (source) => readClaim(claims, source, logger);
    const email = nonEmptyString(read(mapping.email))?.toLowerCase();
    const acr = nonEmptyString(claims['acr']);
    const amr = Array.isArray(claims['amr'])
        ? claims['amr'].filter((v) => typeof v === 'string')
        : undefined;
    const authTime = toAuthTime(claims['auth_time']);
    const assurance = acr || amr || authTime ? { acr, amr, authTime } : undefined;
    return {
        ok: true,
        value: {
            subject,
            email,
            emailVerified: toVerified(read(mapping.emailVerified)),
            displayName: nonEmptyString(read(mapping.displayName)),
            clientId: nonEmptyString(read(mapping.clientId)),
            scopes: toScopes(read(mapping.scopes)),
            assurance,
            raw: claims,
        },
    };
}
//# sourceMappingURL=external-identity.js.map