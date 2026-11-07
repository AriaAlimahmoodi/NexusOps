import type { IWorkflowBase } from 'n8n-workflow';
import { LoadNodesAndCredentials } from '../../load-nodes-and-credentials';
import type { Risk, RiskReporter } from '../../security-audit/types';
import { PackagesRepository } from '../security-audit.repository';
export declare class NodesRiskReporter implements RiskReporter {
    private readonly loadNodesAndCredentials;
    private readonly packagesRepository;
    constructor(loadNodesAndCredentials: LoadNodesAndCredentials, packagesRepository: PackagesRepository);
    report(workflows: IWorkflowBase[]): Promise<Risk.StandardReport | null>;
    private getCommunityNodeDetails;
    private getCustomNodeDetails;
}
