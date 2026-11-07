import { z } from 'zod';
declare const UpdateExternalSecretsSettingsDto_base: import("../../zod-class").ZodClass<{
    systemRolesEnabled: boolean;
}, {
    systemRolesEnabled: z.ZodBoolean;
}>;
export declare class UpdateExternalSecretsSettingsDto extends UpdateExternalSecretsSettingsDto_base {
}
export {};
