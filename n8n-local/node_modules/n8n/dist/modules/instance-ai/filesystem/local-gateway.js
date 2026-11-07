"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalGateway = void 0;
const nanoid_1 = require("nanoid");
const node_events_1 = require("node:events");
const REQUEST_TIMEOUT_MS = 60_000;
class LocalGateway {
    constructor() {
        this.pendingRequests = new Map();
        this.emitter = new node_events_1.EventEmitter();
        this._connected = false;
        this._connectedAt = null;
        this._rootPath = null;
        this._hostIdentifier = null;
        this._toolCategories = [];
        this._availableTools = [];
        this._excludedToolCategories = new Set();
    }
    get isConnected() {
        return this._connected;
    }
    get connectedAt() {
        return this._connectedAt;
    }
    get rootPath() {
        return this._rootPath;
    }
    setExcludedToolCategories(categories) {
        this._excludedToolCategories = new Set(categories);
    }
    isExcluded(tool) {
        const category = tool.annotations?.category;
        return category !== undefined && this._excludedToolCategories.has(category);
    }
    getAvailableTools() {
        return this._availableTools.filter((t) => !this.isExcluded(t));
    }
    getToolsByCategory(category) {
        if (this._excludedToolCategories.has(category))
            return [];
        return this._availableTools.filter((t) => t.annotations?.category === category);
    }
    onRequest(listener) {
        this.emitter.on('filesystem-request', listener);
        return () => this.emitter.off('filesystem-request', listener);
    }
    onDisconnect(listener) {
        this.emitter.on('gateway-disconnect', listener);
        return () => this.emitter.off('gateway-disconnect', listener);
    }
    init(data) {
        this._rootPath = data.rootPath;
        this._hostIdentifier = data.hostIdentifier ?? null;
        this._toolCategories = data.toolCategories ?? [];
        this._availableTools = data.tools;
        this._connected = true;
        this._connectedAt = new Date().toISOString();
    }
    resolveRequest(requestId, result, error) {
        const pending = this.pendingRequests.get(requestId);
        if (!pending)
            return false;
        clearTimeout(pending.timer);
        this.pendingRequests.delete(requestId);
        if (error) {
            pending.reject(new Error(error));
            return true;
        }
        pending.resolve(result ?? { content: [] });
        return true;
    }
    disconnect() {
        this.emitter.emit('gateway-disconnect', {
            type: 'gateway-disconnect',
        });
        this._connected = false;
        this._connectedAt = null;
        this._rootPath = null;
        this._hostIdentifier = null;
        this._toolCategories = [];
        this._availableTools = [];
        for (const [id, pending] of this.pendingRequests) {
            clearTimeout(pending.timer);
            pending.reject(new Error('Local gateway disconnected'));
            this.pendingRequests.delete(id);
        }
    }
    getStatus() {
        return {
            connected: this._connected,
            connectedAt: this._connectedAt,
            directory: this._rootPath,
            hostIdentifier: this._hostIdentifier,
            toolCategories: this._toolCategories.filter((category) => !this._excludedToolCategories.has(category.name)),
        };
    }
    async callTool(toolCall, options) {
        if (!this._connected) {
            throw new Error('Local gateway is not connected');
        }
        const tool = this._availableTools.find((t) => t.name === toolCall.name);
        if (tool && this.isExcluded(tool)) {
            return {
                content: [{ type: 'text', text: `Unknown tool: ${toolCall.name}` }],
                isError: true,
            };
        }
        const abortSignal = options?.abortSignal;
        if (abortSignal?.aborted) {
            const error = new Error(typeof abortSignal.reason === 'string' ? abortSignal.reason : 'This operation was aborted');
            error.name = 'AbortError';
            throw error;
        }
        const requestId = `gw_${(0, nanoid_1.nanoid)()}`;
        return await new Promise((resolve, reject) => {
            let settled = false;
            const settle = (action) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timer);
                abortSignal?.removeEventListener('abort', onAbort);
                this.pendingRequests.delete(requestId);
                action();
            };
            const onAbort = () => {
                settle(() => {
                    const error = new Error(typeof abortSignal?.reason === 'string'
                        ? abortSignal.reason
                        : 'This operation was aborted');
                    error.name = 'AbortError';
                    reject(error);
                });
            };
            const timer = setTimeout(() => {
                settle(() => {
                    reject(new Error(`Local gateway request timed out after ${REQUEST_TIMEOUT_MS}ms`));
                });
            }, REQUEST_TIMEOUT_MS);
            abortSignal?.addEventListener('abort', onAbort, { once: true });
            this.pendingRequests.set(requestId, {
                resolve: (result) => {
                    settle(() => {
                        resolve(result);
                    });
                },
                reject: (error) => {
                    settle(() => {
                        reject(error);
                    });
                },
                timer,
                toolCall,
            });
            this.emitter.emit('filesystem-request', {
                type: 'filesystem-request',
                payload: { requestId, toolCall },
            });
        });
    }
}
exports.LocalGateway = LocalGateway;
//# sourceMappingURL=local-gateway.js.map