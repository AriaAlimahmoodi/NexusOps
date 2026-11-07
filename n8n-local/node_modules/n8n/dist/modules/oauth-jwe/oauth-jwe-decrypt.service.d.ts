import type { IDataObject } from 'n8n-workflow';
import { UrlService } from '@n8n/backend-services';
import { type DcrJweFields } from '@n8n/backend-services/auth';
import { OAuthJweKeyService } from './oauth-jwe-key.service';
export declare class OAuthJweDecryptService {
    private readonly keyService;
    private readonly urlService;
    constructor(keyService: OAuthJweKeyService, urlService: UrlService);
    getDcrJweFields(inlineJwks: boolean): Promise<DcrJweFields>;
    decryptOAuth2TokenData(tokenData: IDataObject): Promise<IDataObject>;
}
