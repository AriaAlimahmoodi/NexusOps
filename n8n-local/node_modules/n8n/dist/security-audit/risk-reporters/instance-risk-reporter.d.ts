import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { GlobalConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import type { IWorkflowBase } from 'n8n-workflow';
import type { RiskReporter, Risk } from '../../security-audit/types';
export declare class InstanceRiskReporter implements RiskReporter {
    private readonly instanceSettings;
    private readonly logger;
    private readonly globalConfig;
    private readonly http;
    constructor(instanceSettings: InstanceSettings, logger: Logger, globalConfig: GlobalConfig, outboundHttp: OutboundHttp);
    report(workflows: IWorkflowBase[]): Promise<Risk.InstanceReport | null>;
    private getSecuritySettings;
    private hasValidatorChild;
    private getUnprotectedWebhookNodes;
    private getNextVersions;
    private removeIconData;
    private classify;
    private getOutdatedState;
}
