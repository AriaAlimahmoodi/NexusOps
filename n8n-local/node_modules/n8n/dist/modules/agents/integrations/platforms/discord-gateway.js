"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordGateway = void 0;
const GATEWAY_SESSION_MS = 12 * 60 * 60 * 1000;
const GATEWAY_HEALTHY_RUN_MS = 60_000;
const GATEWAY_MAX_BACKOFF_MS = 5 * 60_000;
class DiscordGateway {
    constructor(logger, instanceSettings) {
        this.logger = logger;
        this.instanceSettings = instanceSettings;
        this.sessions = new Map();
        this.sweep = 0;
    }
    register(key, connection) {
        this.sessions.set(key, { ...connection });
        if (this.instanceSettings.isLeader)
            this.start(key);
    }
    async discard(key) {
        const session = this.sessions.get(key);
        if (!session)
            return;
        this.sessions.delete(key);
        await this.drain(session);
    }
    startAll() {
        this.sweep += 1;
        for (const key of this.sessions.keys())
            this.start(key);
    }
    async pauseAll() {
        const sweep = ++this.sweep;
        for (const key of [...this.sessions.keys()]) {
            if (this.sweep !== sweep)
                return;
            await this.pause(key);
        }
    }
    botTokenFor(key) {
        return this.sessions.get(key)?.botToken;
    }
    sessionKeyUsingBotToken(botToken, excludeKey) {
        for (const [key, session] of this.sessions) {
            if (excludeKey !== undefined && key === excludeKey)
                continue;
            if (session.botToken === botToken)
                return key;
        }
        return undefined;
    }
    async pause(key) {
        const session = this.sessions.get(key);
        if (!session)
            return;
        session.desired = false;
        if (!(await this.drain(session)))
            return;
        if (session.desired && this.instanceSettings.isLeader)
            this.start(key);
    }
    async drain(session) {
        if (!session.abort)
            return false;
        session.abort.abort();
        await session.running?.catch(() => { });
        if (session.abort)
            return false;
        session.running = undefined;
        return true;
    }
    start(key) {
        const session = this.sessions.get(key);
        if (!session?.ingressEnabled)
            return;
        session.desired = true;
        if (session.abort)
            return;
        const abort = new AbortController();
        session.abort = abort;
        session.running = this.runLoop(key, session, abort).catch((error) => {
            this.logger.error(`[DiscordIntegration] Gateway loop for ${key} crashed: ${error instanceof Error ? error.message : String(error)}`);
        });
    }
    async runLoop(key, session, abort) {
        let consecutiveFastExits = 0;
        try {
            while (!abort.signal.aborted) {
                const startedAt = Date.now();
                let listener;
                const response = await session.adapter.startGatewayListener({
                    waitUntil: (task) => {
                        listener = task;
                    },
                }, GATEWAY_SESSION_MS, abort.signal, undefined);
                if (response.ok) {
                    await listener?.catch((error) => {
                        this.logger.warn(`[DiscordIntegration] Gateway listener for ${key} ended with an error: ${error instanceof Error ? error.message : String(error)}`);
                    });
                }
                else {
                    this.logger.error(`[DiscordIntegration] Gateway listener failed to start for ${key}: ${await response.text()}`);
                }
                if (abort.signal.aborted)
                    break;
                if (Date.now() - startedAt >= GATEWAY_HEALTHY_RUN_MS) {
                    consecutiveFastExits = 0;
                    continue;
                }
                consecutiveFastExits += 1;
                const backoffMs = Math.min(2 ** (consecutiveFastExits - 1) * 1000, GATEWAY_MAX_BACKOFF_MS);
                this.logger.warn(`[DiscordIntegration] Gateway listener for ${key} exited early; retrying in ${backoffMs}ms`);
                await sleepUnlessAborted(backoffMs, abort.signal);
            }
        }
        finally {
            session.abort = undefined;
            session.running = undefined;
        }
    }
}
exports.DiscordGateway = DiscordGateway;
async function sleepUnlessAborted(ms, signal) {
    if (signal.aborted)
        return;
    await new Promise((resolve) => {
        const onAbort = () => {
            clearTimeout(timer);
            resolve();
        };
        const timer = setTimeout(() => {
            signal.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        timer.unref();
        signal.addEventListener('abort', onAbort, { once: true });
    });
}
//# sourceMappingURL=discord-gateway.js.map