import type { ProjectInfo, RoleResolverContext } from './role-resolver-types';
export declare function buildOidcClaimsContext(idTokenClaims: Record<string, unknown>, userInfo: Record<string, unknown>): RoleResolverContext;
export declare function buildSamlClaimsContext(rawAttributes: Record<string, unknown>): RoleResolverContext;
export declare function withProjectContext(context: RoleResolverContext, project: ProjectInfo): RoleResolverContext;
