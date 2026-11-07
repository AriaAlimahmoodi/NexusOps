import { ResponseError } from '@n8n/errors';
export type DeprecatedNodeViolation = {
    kind: 'added' | 'edited';
    nodeName: string;
    nodeType: string;
};
export declare class DeprecatedNodesError extends ResponseError {
    readonly meta: {
        violations: DeprecatedNodeViolation[];
    };
    constructor(message: string, meta: {
        violations: DeprecatedNodeViolation[];
    });
}
