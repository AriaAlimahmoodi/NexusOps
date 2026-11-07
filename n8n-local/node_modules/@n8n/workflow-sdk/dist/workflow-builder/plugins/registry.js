"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginRegistry = exports.PluginRegistry = void 0;
class PluginRegistry {
    constructor() {
        this.validators = new Map();
        this.compositeHandlers = new Map();
        this.serializers = new Map();
        this.serializersByFormat = new Map();
    }
    registerValidator(plugin) {
        if (this.validators.has(plugin.id)) {
            throw new Error(`Validator '${plugin.id}' is already registered`);
        }
        this.validators.set(plugin.id, plugin);
    }
    unregisterValidator(id) {
        this.validators.delete(id);
    }
    getValidators() {
        return [...this.validators.values()].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    }
    getValidatorsForNodeType(nodeType) {
        return this.getValidators().filter((v) => {
            if (!v.nodeTypes || v.nodeTypes.length === 0) {
                return true;
            }
            return v.nodeTypes.includes(nodeType);
        });
    }
    registerCompositeHandler(plugin) {
        if (this.compositeHandlers.has(plugin.id)) {
            throw new Error(`Composite handler '${plugin.id}' is already registered`);
        }
        this.compositeHandlers.set(plugin.id, plugin);
    }
    unregisterCompositeHandler(id) {
        this.compositeHandlers.delete(id);
    }
    getCompositeHandlers() {
        return [...this.compositeHandlers.values()].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    }
    findCompositeHandler(input) {
        const handlers = this.getCompositeHandlers();
        return handlers.find((h) => h.canHandle(input));
    }
    isCompositeType(target) {
        return this.findCompositeHandler(target) !== undefined;
    }
    resolveCompositeHeadName(target, nameMapping) {
        const handler = this.findCompositeHandler(target);
        if (!handler?.getHeadNodeName) {
            return undefined;
        }
        const info = handler.getHeadNodeName(target);
        if (typeof info === 'object' && info !== null && 'name' in info && 'id' in info) {
            const { name, id } = info;
            const mappedName = nameMapping?.get(id);
            return mappedName ?? name;
        }
        const baseName = info;
        if (nameMapping) {
            const mappedName = nameMapping.get(baseName);
            if (mappedName)
                return mappedName;
        }
        return baseName;
    }
    registerSerializer(plugin) {
        if (this.serializers.has(plugin.id)) {
            throw new Error(`Serializer '${plugin.id}' is already registered`);
        }
        if (this.serializersByFormat.has(plugin.format)) {
            throw new Error(`Serializer for format '${plugin.format}' is already registered`);
        }
        this.serializers.set(plugin.id, plugin);
        this.serializersByFormat.set(plugin.format, plugin);
    }
    unregisterSerializer(id) {
        const plugin = this.serializers.get(id);
        if (plugin) {
            this.serializers.delete(id);
            this.serializersByFormat.delete(plugin.format);
        }
    }
    getSerializer(format) {
        return this.serializersByFormat.get(format);
    }
    clearAll() {
        this.validators.clear();
        this.compositeHandlers.clear();
        this.serializers.clear();
        this.serializersByFormat.clear();
    }
}
exports.PluginRegistry = PluginRegistry;
exports.pluginRegistry = new PluginRegistry();
//# sourceMappingURL=registry.js.map