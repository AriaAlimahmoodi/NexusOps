import type { ValidatorPlugin, CompositeHandlerPlugin, SerializerPlugin } from './types';
export declare class PluginRegistry {
    private validators;
    private compositeHandlers;
    private serializers;
    private serializersByFormat;
    registerValidator(plugin: ValidatorPlugin): void;
    unregisterValidator(id: string): void;
    getValidators(): ValidatorPlugin[];
    getValidatorsForNodeType(nodeType: string): ValidatorPlugin[];
    registerCompositeHandler(plugin: CompositeHandlerPlugin): void;
    unregisterCompositeHandler(id: string): void;
    getCompositeHandlers(): CompositeHandlerPlugin[];
    findCompositeHandler(input: unknown): CompositeHandlerPlugin | undefined;
    isCompositeType(target: unknown): boolean;
    resolveCompositeHeadName(target: unknown, nameMapping?: Map<string, string>): string | undefined;
    registerSerializer(plugin: SerializerPlugin): void;
    unregisterSerializer(id: string): void;
    getSerializer(format: string): SerializerPlugin | undefined;
    clearAll(): void;
}
export declare const pluginRegistry: PluginRegistry;
