import { LicenseState, Logger } from '@n8n/backend-common';
import { SettingsRepository, UserRepository } from '@n8n/db';
import { Cipher } from 'n8n-core';
import { CacheService } from '@n8n/backend-services';
import { TOTPService } from './totp.service';
export declare const MFA_CACHE_KEY = "mfa:enforce";
export declare class MfaService {
    private userRepository;
    private settingsRepository;
    private cacheService;
    private license;
    totp: TOTPService;
    private cipher;
    private logger;
    constructor(userRepository: UserRepository, settingsRepository: SettingsRepository, cacheService: CacheService, license: LicenseState, totp: TOTPService, cipher: Cipher, logger: Logger);
    init(): Promise<void>;
    generateRecoveryCodes(n?: number): string[];
    private loadMFASettings;
    enforceMFA(value: boolean): Promise<void>;
    isMFAEnforced(): Promise<boolean>;
    saveSecretAndRecoveryCodes(userId: string, secret: string, recoveryCodes: string[]): Promise<void>;
    encryptSecretAndRecoveryCodes(rawSecret: string, rawRecoveryCodes: string[]): Promise<{
        encryptedRecoveryCodes: string[];
        encryptedSecret: string;
    }>;
    private decryptSecretAndRecoveryCodes;
    getSecretAndRecoveryCodes(userId: string): Promise<{
        decryptedSecret: string;
        decryptedRecoveryCodes: string[];
    }>;
    validateMfa(userId: string, mfaCode: string | undefined, mfaRecoveryCode: string | undefined): Promise<boolean>;
    enableMfa(userId: string): Promise<import("@n8n/db").User>;
    disableMfaWithMfaCode(userId: string, mfaCode: string): Promise<void>;
    disableMfaWithRecoveryCode(userId: string, recoveryCode: string): Promise<void>;
    private disableMfaForUser;
}
