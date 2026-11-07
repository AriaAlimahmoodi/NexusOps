import { CreateEncryptionKeyDto, ListEncryptionKeysQueryDto, type EncryptionKey, type EncryptionKeysList } from '@n8n/api-types';
import { KeyManagerService } from '../../encryption/key-manager.service';
export declare class EncryptionKeyController {
    private readonly keyManagerService;
    constructor(keyManagerService: KeyManagerService);
    list(_req: unknown, _res: unknown, query: ListEncryptionKeysQueryDto): Promise<EncryptionKeysList>;
    create(_req: unknown, _res: unknown, _body: CreateEncryptionKeyDto): Promise<EncryptionKey>;
}
