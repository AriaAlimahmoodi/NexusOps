import { GlobalConfig } from '@n8n/config';
import { DataTableSizeStatus, DataTablesSizeData } from 'n8n-workflow';
import { Telemetry } from '../../telemetry';
export declare class DataTableSizeValidator {
    private readonly globalConfig;
    private readonly telemetry;
    private lastCheck;
    private cachedSizeData;
    private pendingCheck;
    constructor(globalConfig: GlobalConfig, telemetry: Telemetry);
    private shouldRefresh;
    getCachedSizeData(fetchSizeDataFn: () => Promise<DataTablesSizeData>, now?: Date): Promise<DataTablesSizeData>;
    validateSize(fetchSizeFn: () => Promise<DataTablesSizeData>, now?: Date): Promise<void>;
    sizeToState(sizeBytes: number): DataTableSizeStatus;
    getSizeStatus(fetchSizeFn: () => Promise<DataTablesSizeData>, now?: Date): Promise<DataTableSizeStatus>;
    reset(): void;
}
