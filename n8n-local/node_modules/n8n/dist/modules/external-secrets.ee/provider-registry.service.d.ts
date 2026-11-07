import type { SecretsProvider } from './types';
export declare class ExternalSecretsProviderRegistry {
    private providers;
    set(name: string, provider: SecretsProvider): void;
    remove(name: string): void;
    get(name: string): SecretsProvider | undefined;
    has(name: string): boolean;
    getAll(): Map<string, SecretsProvider>;
    getConnected(): Map<string, SecretsProvider>;
    getConnectedNames(): string[];
    getNames(): string[];
    clear(): void;
    disconnectAll(): Promise<void>;
}
