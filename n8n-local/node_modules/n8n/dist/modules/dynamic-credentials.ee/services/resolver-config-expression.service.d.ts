import { CredentialResolverConfiguration } from '@n8n/decorators';
import { NodeTypes } from '../../../node-types';
export declare class ResolverConfigExpressionService {
    private readonly nodeTypes;
    constructor(nodeTypes: NodeTypes);
    resolve(config: CredentialResolverConfiguration, canUseExternalSecrets?: boolean): Promise<CredentialResolverConfiguration>;
}
