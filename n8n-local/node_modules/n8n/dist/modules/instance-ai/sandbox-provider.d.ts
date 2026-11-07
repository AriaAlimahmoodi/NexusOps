import type { InstanceAiSandboxProvider } from '@n8n/api-types';
export declare function normalizeSandboxProvider(value: string | undefined): InstanceAiSandboxProvider;
export declare const N8N_SANDBOX_SERVICE_URL_REQUIRED_MESSAGE = "N8N_SANDBOX_SERVICE_URL is required when Instance AI sandbox provider is n8n-sandbox.";
export declare function requireN8nSandboxServiceUrl(value: string): string;
