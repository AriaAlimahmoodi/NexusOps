"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOidcClaimsContext = buildOidcClaimsContext;
exports.buildSamlClaimsContext = buildSamlClaimsContext;
exports.withProjectContext = withProjectContext;
function buildOidcClaimsContext(idTokenClaims, userInfo) {
    return {
        $claims: structuredClone({ ...idTokenClaims, ...userInfo }),
        $oidc: {
            idToken: structuredClone(idTokenClaims),
            userInfo: structuredClone(userInfo),
        },
        $provider: 'oidc',
    };
}
function buildSamlClaimsContext(rawAttributes) {
    return {
        $claims: structuredClone(rawAttributes),
        $saml: {
            attributes: structuredClone(rawAttributes),
        },
        $provider: 'saml',
    };
}
function withProjectContext(context, project) {
    return {
        ...context,
        $project: { ...project },
    };
}
//# sourceMappingURL=claims-context.builder.js.map