import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { GlobalConfig } from '@n8n/config';
export declare const TEMPLATE_REQUEST_TIMEOUT_MS = 5000;
export type WorkflowTemplateResult = {
    available: true;
    template: Record<string, unknown>;
} | {
    available: false;
};
export declare class WorkflowTemplatesService {
    private readonly logger;
    private readonly globalConfig;
    private readonly http;
    constructor(logger: Logger, globalConfig: GlobalConfig, outboundHttp: OutboundHttp);
    getTemplate(templateId: string): Promise<WorkflowTemplateResult>;
}
