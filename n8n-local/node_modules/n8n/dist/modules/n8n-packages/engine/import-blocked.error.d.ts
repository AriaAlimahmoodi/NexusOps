import { ConflictError, UnprocessableRequestError } from '@n8n/errors';
import type { BlockingIssue } from '../n8n-packages.types';
export declare function toImportBlockedError(issues: BlockingIssue[]): ConflictError | UnprocessableRequestError;
