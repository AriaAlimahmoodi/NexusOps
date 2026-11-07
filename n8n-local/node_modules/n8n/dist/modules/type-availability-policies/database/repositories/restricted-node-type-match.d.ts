export interface NodeTypesInProjects {
    projectIds: string[];
    nodeTypes: string[];
}
export interface RestrictedNodeTypes {
    shared: string[];
    byProjects: NodeTypesInProjects[];
    nodeTypesInUse: string[];
}
export declare function keyProjectOutcomes({ byProjects, nodeTypesInUse }: RestrictedNodeTypes): {
    exceptProjectIds: string[];
    deniedKeys: string[];
    allowlistProjectIds: string[];
    allowedKeys: string[];
};
export declare function restrictedNodeTypeMatch(restricted: RestrictedNodeTypes, isPostgres: boolean): {
    condition: string;
    parameters: {
        restrictedShared: string | string[];
        restrictedExceptProjectIds: string | string[];
        restrictedDeniedKeys: string | string[];
        restrictedAllowlistProjectIds: string | string[];
        restrictedAllowedKeys: string | string[];
    };
};
