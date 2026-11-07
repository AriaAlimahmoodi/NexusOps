import { TrustedSourceStore } from '@n8n/inbound-auth';
import type { TrustedSourceDirectory, TrustedSourceFilter, TrustedSourceOption } from 'n8n-workflow';
export declare class TrustedSourceDbDirectory implements TrustedSourceDirectory {
    private readonly store;
    constructor(store: TrustedSourceStore);
    listTrustedSources({ surface, capability, }: TrustedSourceFilter): Promise<TrustedSourceOption[]>;
}
