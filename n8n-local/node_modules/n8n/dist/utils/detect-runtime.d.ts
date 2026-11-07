export type Runtime = 'kubernetes' | 'ecs' | 'cloud-run' | 'azure-container-apps' | 'azure-app-service' | 'docker' | 'other';
export type KubernetesProvider = 'aws' | 'azure' | 'gcp' | 'other';
export declare function detectRuntime(env: NodeJS.ProcessEnv, isDocker: boolean): Runtime;
export declare function detectKubernetesProvider(osRelease: string): KubernetesProvider;
