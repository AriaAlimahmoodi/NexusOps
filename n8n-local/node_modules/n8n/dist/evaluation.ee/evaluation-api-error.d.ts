import type { EvaluationApiError as EvaluationApiErrorShape, EvaluationErrorCode } from '@n8n/api-types';
export declare class EvaluationApiError extends Error implements EvaluationApiErrorShape {
    readonly code: EvaluationErrorCode;
    readonly details?: EvaluationApiErrorShape['details'];
    constructor(code: EvaluationErrorCode, message?: string, details?: EvaluationApiErrorShape['details']);
    toResponse(): EvaluationApiErrorShape;
}
