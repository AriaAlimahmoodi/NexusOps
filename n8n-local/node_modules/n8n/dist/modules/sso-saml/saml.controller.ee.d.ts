import { SamlAcsDto, SamlPreferences, SamlToggleDto } from '@n8n/api-types';
import { EventService, UrlService } from '@n8n/backend-services';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { AuthenticatedRequest } from '@n8n/db';
import { Response } from 'express';
import { AuthService } from '../../auth/auth.service';
import { AuthlessRequest } from '../../requests';
import { SamlService } from './saml.service.ee';
export declare class SamlController {
    private readonly authService;
    private readonly samlService;
    private readonly urlService;
    private readonly eventService;
    private readonly instanceSettingsLoaderConfig;
    constructor(authService: AuthService, samlService: SamlService, urlService: UrlService, eventService: EventService, instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig);
    getServiceProviderMetadata(_: AuthlessRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    configGet(): Promise<{
        mapping?: {
            email: string;
            firstName: string;
            lastName: string;
            userPrincipalName: string;
            emailVerified?: string | undefined;
            n8nInstanceRole?: string | undefined;
            n8nProjectRoles?: string[] | undefined;
        } | undefined;
        metadata?: string | undefined;
        metadataUrl?: string | undefined;
        ignoreSSL: boolean;
        loginBinding: "post" | "redirect";
        loginEnabled?: boolean | undefined;
        loginLabel?: string | undefined;
        authnRequestsSigned: boolean;
        wantAssertionsSigned: boolean;
        wantMessageSigned: boolean;
        emailVerifiedRequired?: boolean | undefined;
        signingCertificate?: string | undefined;
        acsBinding: "post" | "redirect";
        signatureConfig: {
            prefix: string;
            location: {
                reference: string;
                action: "after" | "append" | "before" | "prepend";
            };
        };
        relayState: string;
        signingPrivateKey: string | undefined;
        entityID: string;
        returnUrl: string;
    }>;
    configPost(_req: AuthenticatedRequest, _res: Response, payload: SamlPreferences): Promise<{
        mapping?: {
            email: string;
            firstName: string;
            lastName: string;
            userPrincipalName: string;
            emailVerified?: string | undefined;
            n8nInstanceRole?: string | undefined;
            n8nProjectRoles?: string[] | undefined;
        } | undefined;
        metadata?: string | undefined;
        metadataUrl?: string | undefined;
        ignoreSSL: boolean;
        loginBinding: "post" | "redirect";
        loginEnabled?: boolean | undefined;
        loginLabel?: string | undefined;
        authnRequestsSigned: boolean;
        wantAssertionsSigned: boolean;
        wantMessageSigned: boolean;
        emailVerifiedRequired?: boolean | undefined;
        signingCertificate?: string | undefined;
        acsBinding: "post" | "redirect";
        signatureConfig: {
            prefix: string;
            location: {
                reference: string;
                action: "after" | "append" | "before" | "prepend";
            };
        };
        relayState: string;
        signingPrivateKey: string | undefined;
    } | undefined>;
    toggleEnabledPost(_req: AuthenticatedRequest, res: Response, { loginEnabled }: SamlToggleDto): Promise<Response<any, Record<string, any>>>;
    acsGet(req: AuthlessRequest, res: Response): Promise<void | Response<any, Record<string, any>>>;
    acsPost(req: AuthlessRequest, res: Response, payload: SamlAcsDto): Promise<void | Response<any, Record<string, any>>>;
    private acsHandler;
    initSsoGet(req: AuthlessRequest<{}, {}, {}, {
        redirect?: string;
    }>, res: Response): Promise<string | Response<any, Record<string, any>>>;
    configTestPost(_req: AuthenticatedRequest, res: Response, payload: SamlPreferences): Promise<string | Response<any, Record<string, any>>>;
    private handleInitSSO;
}
