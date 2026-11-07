import type { OtelConfig } from '../../../modules/otel/otel.config';
export type OtelSettingsResponse = OtelConfig;
export declare function toOtelSettingsResponse(config: OtelConfig): OtelSettingsResponse;
