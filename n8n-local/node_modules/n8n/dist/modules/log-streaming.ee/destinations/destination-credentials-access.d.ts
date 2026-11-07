import type { User } from '@n8n/db';
import type { MessageEventBusDestinationOptions } from 'n8n-workflow';
import type { CredentialsFinderService } from '@n8n/backend-services';
export declare function assertUserCanUseDestinationCredentials(credentialsFinderService: CredentialsFinderService, user: User, options: Pick<MessageEventBusDestinationOptions, 'credentials'>): Promise<void>;
