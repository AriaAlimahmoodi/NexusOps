import type { SamlConfigurationPublicDto, SamlPreferences, UpdateSamlConfigurationPublicDto } from '@n8n/api-types';
export declare function toSamlConfigurationResponse(prefs: SamlPreferences): SamlConfigurationPublicDto;
export declare function toSamlPreferencesUpdate(data: UpdateSamlConfigurationPublicDto): Partial<SamlPreferences>;
