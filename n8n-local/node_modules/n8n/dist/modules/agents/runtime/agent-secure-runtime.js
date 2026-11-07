"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSecureRuntime = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const agent_isolate_pool_1 = require("./agent-isolate-pool");
const LIBRARY_BUNDLE_PATH = path_1.default.resolve(__dirname, '../../../../dist/agent-library-bundle.js');
let AgentSecureRuntime = class AgentSecureRuntime {
    constructor(logger) {
        this.logger = logger;
        this.pool = null;
        this.poolInitPromise = null;
        this.disposed = false;
        this.libraryBundle = null;
    }
    async getPool() {
        if (this.pool)
            return this.pool;
        this.poolInitPromise ??= (async () => {
            try {
                const ivmModule = (await import('isolated-vm')).default;
                const libraryBundle = this.getLibraryBundle();
                const pool = new agent_isolate_pool_1.AgentIsolatePool(ivmModule, libraryBundle, {
                    logger: this.logger,
                });
                await pool.initialize();
                if (this.disposed) {
                    void pool.dispose();
                    throw new Error('AgentSecureRuntime was disposed during pool initialization');
                }
                this.pool = pool;
                return pool;
            }
            catch (e) {
                this.poolInitPromise = null;
                throw e;
            }
        })();
        return await this.poolInitPromise;
    }
    async withIsolate(fn) {
        const pool = await this.getPool();
        const slot = await pool.acquire();
        try {
            return await fn(slot);
        }
        catch (error) {
            if (!slot.isHealthy) {
                this.logger.warn('[AgentSecureRuntime] Isolate OOM during execution — retrying with fresh slot');
                const freshSlot = await pool.acquire();
                try {
                    return await fn(freshSlot);
                }
                catch (retryError) {
                    if (!freshSlot.isHealthy) {
                        this.logger.error('[AgentSecureRuntime] Retry slot also OOM — both isolates will be recycled; not retrying further');
                    }
                    throw retryError;
                }
                finally {
                    pool.release(freshSlot);
                }
            }
            throw error;
        }
        finally {
            pool.release(slot);
        }
    }
    getLibraryBundle() {
        if (this.libraryBundle)
            return this.libraryBundle;
        try {
            this.libraryBundle = (0, fs_1.readFileSync)(LIBRARY_BUNDLE_PATH, 'utf8');
        }
        catch (e) {
            throw new Error(`Agent library bundle not found at ${LIBRARY_BUNDLE_PATH}. ` +
                "Run 'pnpm build' in packages/cli to generate it.", { cause: e instanceof Error ? e : undefined });
        }
        return this.libraryBundle;
    }
    async compileTs(tsCode) {
        const { transform } = await import('sucrase');
        const { code } = transform(tsCode, {
            transforms: ['typescript', 'imports'],
        });
        return code;
    }
    loadToolInContext(context, slot, compiledToolCode) {
        const script = slot.isolate.compileScriptSync(`
			var __me = {};
			var __mod = { exports: __me };
			(function(exports, require, module) {
				${compiledToolCode}
			})(__me, require, __mod);

			globalThis.__exportedTool = __mod.exports.default || __mod.exports;
			if (!globalThis.__exportedTool || typeof globalThis.__exportedTool !== 'object') {
				throw new Error('No Tool found');
			}
		`);
        try {
            script.runSync(context, { timeout: 5000 });
        }
        finally {
            script.release();
        }
    }
    parseSandboxJson(raw, context) {
        if (typeof raw !== 'string') {
            throw new Error(`Sandbox (${context}) produced a non-string result: ${typeof raw}. Expected JSON string.`);
        }
        try {
            return JSON.parse(raw, (key, value) => (key === '__proto__' ? undefined : value));
        }
        catch (e) {
            throw new Error(`Sandbox (${context}) produced invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    runInContext(context, slot, code) {
        context.evalSync('var module = { exports: {} }; var exports = module.exports;', {
            timeout: 5000,
        });
        const script = slot.isolate.compileScriptSync(code);
        script.runSync(context, { timeout: 5000 });
        script.release();
        const ref = context.global.getSync('module', { reference: true });
        const moduleObj = ref.copySync();
        ref.release();
        return moduleObj.exports;
    }
    async describeToolSecurely(tsCode) {
        const jsCode = await this.compileTs(tsCode);
        return await this.withIsolate(async (slot) => {
            const context = slot.createContext();
            try {
                const wrapper = `
					var __me = {};
					var __mod = { exports: __me };
					(function(exports, require, module) {
						${jsCode}
					})(__me, require, __mod);

					var __exported = __mod.exports.default || __mod.exports;

					if (!__exported || typeof __exported !== 'object' || typeof __exported.describe !== 'function') {
						throw new Error('No Tool found. Export a Tool as default: export default new Tool(...);');
					}

					module.exports = JSON.stringify(__exported.describe());
				`;
                const resultJson = this.runInContext(context, slot, wrapper);
                return this.parseSandboxJson(resultJson, 'describeToolSecurely');
            }
            finally {
                context.release();
            }
        });
    }
    async executeToolInIsolate(toolCode, input, ctx) {
        const jsCode = await this.compileTs(toolCode);
        return await this.withIsolate(async (slot) => {
            const context = slot.createContext();
            try {
                this.loadToolInContext(context, slot, jsCode);
                const serializedContext = JSON.stringify(ctx);
                const invokeCode = `
					return (async function() {
						var tool = globalThis.__exportedTool;
						var handlerFn = tool.handlerFn || (tool.build ? tool.build().handler : null);
						if (!handlerFn) {
							var built = tool.build ? tool.build() : tool;
							handlerFn = built.handler;
						}
						if (!handlerFn) throw new Error('Tool has no handler');

						var suspendPayload = { called: false, data: null };
						var ctx = Object.assign({}, ${serializedContext ?? 'undefined'} || {}, {
							suspend: function(payload) {
								suspendPayload.called = true;
								suspendPayload.data = payload;
								return Promise.resolve({ suspended: true });
							},
						});

						var result = await handlerFn($0, ctx);

						if (suspendPayload.called) {
							return { __suspend: true, payload: suspendPayload.data };
						}
						return result;
					})()
				`;
                const result = await context.evalClosure(invokeCode, [input], {
                    timeout: 5000,
                    arguments: { copy: true },
                    result: { promise: true, copy: true },
                });
                if (typeof result === 'object' &&
                    result !== null &&
                    '__suspend' in result &&
                    result.__suspend) {
                    return {
                        [Symbol.for('n8n.agent.suspend')]: true,
                        payload: 'payload' in result ? result.payload : undefined,
                    };
                }
                return result;
            }
            finally {
                context.release();
            }
        });
    }
    async executeToMessageInIsolate(toolCode, output) {
        const jsCode = await this.compileTs(toolCode);
        return await this.withIsolate(async (slot) => {
            const context = slot.createContext();
            try {
                this.loadToolInContext(context, slot, jsCode);
                const invokeCode = `
					return (async function() {
						var tool = globalThis.__exportedTool;
						var built = tool.build ? tool.build() : tool;
						var toMessageFn = built.toMessage;
						if (!toMessageFn) return null;

						return (await toMessageFn($0)) ?? null;
					})()
				`;
                const message = (await context.evalClosure(invokeCode, [output], {
                    timeout: 5000,
                    arguments: { copy: true },
                    result: { promise: true, copy: true },
                }));
                return message ?? undefined;
            }
            finally {
                context.release();
            }
        });
    }
    createToolExecutor(toolsByName) {
        return {
            executeTool: async (toolName, input, ctx) => {
                const toolCode = toolsByName[toolName];
                if (!toolCode) {
                    throw new Error(`Tool "${toolName}" not found in tools map`);
                }
                return await this.executeToolInIsolate(toolCode, input, ctx);
            },
            executeToMessage: async (toolName, output) => {
                const toolCode = toolsByName[toolName];
                if (!toolCode) {
                    throw new Error(`Tool "${toolName}" not found in tools map`);
                }
                return await this.executeToMessageInIsolate(toolCode, output);
            },
        };
    }
    dispose() {
        this.disposed = true;
        const poolPromise = this.poolInitPromise;
        this.pool = null;
        this.poolInitPromise = null;
        if (poolPromise) {
            void poolPromise.then(async (pool) => await pool.dispose()).catch(() => { });
        }
    }
};
exports.AgentSecureRuntime = AgentSecureRuntime;
exports.AgentSecureRuntime = AgentSecureRuntime = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger])
], AgentSecureRuntime);
//# sourceMappingURL=agent-secure-runtime.js.map