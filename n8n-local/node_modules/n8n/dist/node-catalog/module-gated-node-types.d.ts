import type { ModuleRegistry } from '@n8n/backend-common';
export declare function getModuleDisabledNodeTypes(moduleRegistry: ModuleRegistry): string[];
export declare function getModuleDisabledNotice(moduleRegistry: ModuleRegistry, nodeType: string): string | undefined;
