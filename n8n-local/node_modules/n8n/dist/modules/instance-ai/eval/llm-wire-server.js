"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmWireServer = void 0;
const express_1 = __importDefault(require("express"));
const mock_handler_1 = require("./mock-handler");
const openai_envelope_1 = require("./openai-envelope");
const openai_responses_envelope_1 = require("./openai-responses-envelope");
const chatCompletionsAdapter = {
    name: 'chat-completions',
    extractModel: openai_envelope_1.extractRequestModel,
    isStreamRequested: openai_envelope_1.isStreamRequested,
    reverseTranslate: openai_envelope_1.reverseTranslateOpenAiRequest,
    forwardObject: openai_envelope_1.forwardTranslateToChatCompletion,
    buildSseFrames: (response, model) => {
        const chunks = (0, openai_envelope_1.forwardTranslateToSseChunks)(response, model);
        const frames = chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`);
        frames.push('data: [DONE]\n\n');
        return frames;
    },
    buildErrorEnvelope: openai_envelope_1.buildOpenAiErrorEnvelope,
    stubResponse: () => ({
        body: { content: '[eval wire server stub] — no mock handler attached' },
        headers: { 'content-type': 'application/json' },
        statusCode: 200,
    }),
};
const responsesAdapter = {
    name: 'responses',
    extractModel: openai_responses_envelope_1.extractResponsesRequestModel,
    isStreamRequested: openai_responses_envelope_1.isResponsesStreamRequested,
    reverseTranslate: openai_responses_envelope_1.reverseTranslateOpenAiResponsesRequest,
    forwardObject: openai_responses_envelope_1.forwardTranslateToResponsesEnvelope,
    buildSseFrames: (response, model) => {
        const events = (0, openai_responses_envelope_1.forwardTranslateToResponsesSseEvents)(response, model);
        return events.map(({ event, data }) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    buildErrorEnvelope: openai_responses_envelope_1.buildResponsesErrorEnvelope,
    stubResponse: () => ({
        body: { output_text: '[eval wire server stub] — no mock handler attached' },
        headers: { 'content-type': 'application/json' },
        statusCode: 200,
    }),
};
class LlmWireServer {
    constructor(options) {
        this.options = options;
        this.inFlight = new Set();
        this.stopping = false;
        this.handleUnrouted = (_req, res) => {
            res
                .status(500)
                .json((0, openai_envelope_1.buildOpenAiErrorEnvelope)('Wire server received an OpenAI request without an /eval/<root>/ prefix. ' +
                'Credential rewrite is misconfigured — check EvalMockedCredentialsHelper.'));
        };
    }
    get url() {
        if (!this.resolvedUrl) {
            throw new Error('LlmWireServer.url accessed before start() resolved');
        }
        return this.resolvedUrl;
    }
    async start() {
        if (this.server)
            return this.url;
        this.stopping = false;
        const app = this.buildApp();
        this.server = await new Promise((resolve, reject) => {
            const s = app.listen(0, '127.0.0.1', () => resolve(s));
            s.once('error', reject);
        });
        const address = this.server.address();
        if (!address || typeof address === 'string') {
            throw new Error('LlmWireServer failed to bind a TCP port');
        }
        this.resolvedUrl = `http://127.0.0.1:${address.port}`;
        return this.resolvedUrl;
    }
    async stop() {
        const server = this.server;
        if (!server)
            return;
        this.stopping = true;
        this.server = undefined;
        this.resolvedUrl = undefined;
        await Promise.allSettled(Array.from(this.inFlight));
        server.closeAllConnections();
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
    buildApp() {
        const app = (0, express_1.default)();
        app.use(express_1.default.json({ limit: '4mb' }));
        app.post('/eval/:root/v1/chat/completions', this.routeFor(chatCompletionsAdapter));
        app.post('/eval/:root/v1/responses', this.routeFor(responsesAdapter));
        app.post('/v1/chat/completions', this.handleUnrouted);
        app.post('/v1/responses', this.handleUnrouted);
        return app;
    }
    routeFor(adapter) {
        return async (req, res) => {
            if (this.stopping) {
                res.status(503).json(adapter.buildErrorEnvelope('Wire server is shutting down'));
                return;
            }
            const promise = this.handleProtocol(adapter, req, res);
            this.inFlight.add(promise);
            try {
                await promise;
            }
            finally {
                this.inFlight.delete(promise);
            }
        };
    }
    async handleProtocol(adapter, req, res) {
        const rootName = req.params.root;
        const model = adapter.extractModel(req.body);
        const stream = adapter.isStreamRequested(req.body);
        const subNode = this.resolveSubNode(rootName);
        if (!this.options.mockHandler) {
            this.respondWithStub(adapter, req, res, model, stream);
            return;
        }
        let synthetic;
        let mockResponse;
        try {
            synthetic = adapter.reverseTranslate(req.body);
            mockResponse = await this.options.mockHandler(synthetic, subNode);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.options.logger.error(`[EvalMock] Wire-server mock generation failed for root "${rootName}": ${message}`);
            try {
                this.options.onIntercept?.({
                    rootName,
                    url: req.originalUrl ?? req.url ?? '',
                    method: req.method ?? 'POST',
                    nodeType: subNode.type,
                    requestBody: req.body,
                    mockResponse: { evalMockGenerationError: message },
                });
            }
            catch {
            }
            this.respondWithError(adapter, res, message);
            return;
        }
        this.options.logger.info(`[EvalMock] wire turn root="${rootName}" stream=${String(stream)} responseHead=${JSON.stringify(mockResponse?.body ?? null).slice(0, 300)}`);
        let wireBody;
        try {
            wireBody = adapter.forwardObject(mockResponse, model);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.options.logger.error(`[EvalMock] Wire-server envelope translation failed for root "${rootName}": ${message}`);
            try {
                this.options.onIntercept?.({
                    rootName,
                    url: synthetic.url,
                    method: synthetic.method ?? 'POST',
                    nodeType: subNode.type,
                    requestBody: req.body,
                    mockResponse: { evalMockGenerationError: `envelope translation failed: ${message}` },
                });
            }
            catch {
            }
            this.respondWithError(adapter, res, message);
            return;
        }
        const ledgerBody = mockResponse && (0, mock_handler_1.isMockErrorSentinel)(mockResponse) ? mockResponse.body : wireBody;
        try {
            this.options.onIntercept?.({
                rootName,
                url: synthetic.url,
                method: synthetic.method ?? 'POST',
                nodeType: subNode.type,
                requestBody: req.body,
                mockResponse: ledgerBody,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.options.logger.warn(`[EvalMock] Wire-server ledger write failed: ${message}`);
        }
        try {
            if (stream) {
                this.writeSseResponse(adapter, req, res, mockResponse, model);
            }
            else {
                res.status(200).json(wireBody);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.options.logger.error(`[EvalMock] Wire-server response write failed: ${message}`);
            if (!res.headersSent) {
                this.respondWithError(adapter, res, message);
            }
            else if (!res.writableEnded) {
                res.end();
            }
        }
    }
    writeSseResponse(adapter, req, res, mockResponse, model) {
        const frames = adapter.buildSseFrames(mockResponse, model);
        res.status(200);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        let aborted = false;
        const onClose = () => {
            aborted = true;
        };
        req.once('close', onClose);
        try {
            for (const frame of frames) {
                if (aborted || res.writableEnded || res.destroyed)
                    break;
                res.write(frame);
            }
        }
        finally {
            req.off('close', onClose);
            if (!res.writableEnded)
                res.end();
        }
    }
    respondWithStub(adapter, req, res, model, stream) {
        const stubBody = adapter.stubResponse();
        if (stream) {
            this.writeSseResponse(adapter, req, res, stubBody, model);
            return;
        }
        res.status(200).json(adapter.forwardObject(stubBody, model));
    }
    respondWithError(adapter, res, message) {
        res.status(500).json(adapter.buildErrorEnvelope(`Mock generation failed: ${message}`));
    }
    resolveSubNode(rootName) {
        const subNode = this.options.rootToSubNode?.get(rootName);
        if (subNode)
            return subNode;
        this.options.logger.warn(`[EvalMock] Wire server has no sub-node mapping for root "${rootName}" — using synthetic identity`);
        return {
            id: `eval-wire-server:${rootName}`,
            name: rootName,
            type: '@n8n/eval-wire-server.unknown-vendor-llm',
            typeVersion: 1,
            position: [0, 0],
            parameters: {},
        };
    }
}
exports.LlmWireServer = LlmWireServer;
//# sourceMappingURL=llm-wire-server.js.map