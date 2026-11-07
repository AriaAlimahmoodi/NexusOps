import type { AgentEvalDatasetRecord, AgentEvalRatingRecord, AgentEvalResultRecord, AgentEvalRunRecord } from '@n8n/api-types';
import type { AgentEvalDataset, AgentEvalRating, AgentEvalResult, AgentEvalRun } from '@n8n/db';
export declare function toDatasetRecord(dataset: AgentEvalDataset): AgentEvalDatasetRecord;
export declare function toRunRecord(run: AgentEvalRun): AgentEvalRunRecord;
export declare function toResultRecord(result: AgentEvalResult): AgentEvalResultRecord;
export declare function toRatingRecord(rating: AgentEvalRating): AgentEvalRatingRecord;
