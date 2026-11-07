"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageEventBusDestinationWebhook = exports.isMessageEventBusDestinationWebhookOptions = void 0;
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const credentials_helper_1 = require("../../../credentials-helper");
const message_event_bus_destination_ee_1 = require("./message-event-bus-destination.ee");
const isMessageEventBusDestinationWebhookOptions = (candidate) => {
    const o = candidate;
    if (!o)
        return false;
    return o.url !== undefined;
};
exports.isMessageEventBusDestinationWebhookOptions = isMessageEventBusDestinationWebhookOptions;
class MessageEventBusDestinationWebhook extends message_event_bus_destination_ee_1.MessageEventBusDestination {
    constructor(eventBusInstance, options, outboundHttp) {
        super(eventBusInstance, options);
        this.outboundHttp = outboundHttp;
        this.responseCodeMustMatch = false;
        this.expectedStatusCode = 200;
        this.method = 'POST';
        this.authentication = 'none';
        this.sendQuery = false;
        this.sendHeaders = false;
        this.genericAuthType = '';
        this.nodeCredentialType = '';
        this.specifyHeaders = '';
        this.specifyQuery = '';
        this.jsonQuery = '';
        this.jsonHeaders = '';
        this.headerParameters = { parameters: [] };
        this.queryParameters = { parameters: [] };
        this.options = {};
        this.sendPayload = true;
        this.url = options.url;
        this.label = options.label ?? 'Webhook Endpoint';
        this.__type = options.__type ?? "$$MessageEventBusDestinationWebhook";
        if (options.responseCodeMustMatch)
            this.responseCodeMustMatch = options.responseCodeMustMatch;
        if (options.expectedStatusCode)
            this.expectedStatusCode = options.expectedStatusCode;
        if (options.method)
            this.method = options.method;
        if (options.authentication)
            this.authentication = options.authentication;
        if (options.sendQuery)
            this.sendQuery = options.sendQuery;
        if (options.sendHeaders)
            this.sendHeaders = options.sendHeaders;
        if (options.genericAuthType)
            this.genericAuthType = options.genericAuthType;
        if (options.nodeCredentialType)
            this.nodeCredentialType = options.nodeCredentialType;
        if (options.specifyHeaders)
            this.specifyHeaders = options.specifyHeaders;
        if (options.specifyQuery)
            this.specifyQuery = options.specifyQuery;
        if (options.jsonQuery)
            this.jsonQuery = options.jsonQuery;
        if (options.jsonHeaders)
            this.jsonHeaders = options.jsonHeaders;
        if (options.headerParameters)
            this.headerParameters = options.headerParameters;
        if (options.queryParameters)
            this.queryParameters = options.queryParameters;
        if (options.sendPayload)
            this.sendPayload = options.sendPayload;
        if (options.options)
            this.options = options.options;
        this.logger.debug(`MessageEventBusDestinationWebhook with id ${this.getId()} initialized`);
    }
    resolveRedirect(options) {
        const redirect = options?.redirect;
        return redirect && 'redirect' in redirect ? redirect.redirect : redirect;
    }
    resolveProxy(options) {
        const proxyOpt = options?.proxy;
        return proxyOpt && 'proxy' in proxyOpt ? proxyOpt.proxy : proxyOpt;
    }
    buildAgentOptions(options) {
        return {
            keepAlive: options?.socket?.keepAlive ?? true,
            maxSockets: options?.socket?.maxSockets ?? constants_1.LOGSTREAMING_DEFAULT_MAX_SOCKETS,
            maxFreeSockets: options?.socket?.maxFreeSockets ?? constants_1.LOGSTREAMING_DEFAULT_MAX_FREE_SOCKETS,
            maxTotalSockets: options?.socket?.maxSockets ?? constants_1.LOGSTREAMING_DEFAULT_MAX_TOTAL_SOCKETS,
            timeout: options?.timeout ?? constants_1.LOGSTREAMING_DEFAULT_SOCKET_TIMEOUT_MS,
        };
    }
    buildConnectionPool() {
        return {
            agentOptions: this.buildAgentOptions(this.options),
            proxy: this.resolveProxy(this.options),
            skipSslCertificateValidation: this.options?.allowUnauthorizedCerts === true,
        };
    }
    getHttpClient() {
        this.httpClient ??= this.outboundHttp.requests({
            useDefaultSsrfPolicy: 'unsafe',
            connectionPool: this.buildConnectionPool(),
        });
        return this.httpClient;
    }
    buildConnectionOptions() {
        const requestOptions = {
            url: this.url,
            method: this.method,
            headers: {},
            disableFollowRedirect: true,
            timeout: this.options?.timeout ?? constants_1.LOGSTREAMING_DEFAULT_SOCKET_TIMEOUT_MS,
        };
        const redirectInner = this.resolveRedirect(this.options);
        if (redirectInner?.followRedirects) {
            requestOptions.disableFollowRedirect = false;
            requestOptions.maxRedirects = redirectInner.maxRedirects;
        }
        return requestOptions;
    }
    async matchDecryptedCredentialType(credentialType, raw = true) {
        const foundCredential = Object.entries(this.credentials).find((e) => e[0] === credentialType);
        if (foundCredential) {
            const credentialsDecrypted = await this.credentialsHelper?.getDecrypted({
                externalSecretsProxy: di_1.Container.get(n8n_core_1.ExternalSecretsProxy),
            }, foundCredential[1], foundCredential[0], 'internal', undefined, raw, undefined, { actor: { kind: 'system', reason: 'log-streaming' } });
            return credentialsDecrypted;
        }
        return null;
    }
    async generateRequestOptions() {
        if (this.requestOptions) {
            return;
        }
        const requestOptions = this.buildConnectionOptions();
        this.credentialsHelper ??= di_1.Container.get(credentials_helper_1.CredentialsHelper);
        const sendQuery = this.sendQuery;
        const specifyQuery = this.specifyQuery;
        const sendHeaders = this.sendHeaders;
        const specifyHeaders = this.specifyHeaders;
        if (this.sendQuery && this.options?.queryParameterArrays) {
            requestOptions.arrayFormat = this.options.queryParameterArrays;
        }
        const parametersToKeyValue = async (acc, cur) => {
            const accumulator = await acc;
            accumulator[cur.name] = cur.value;
            return accumulator;
        };
        if (sendQuery && this.queryParameters.parameters) {
            if (specifyQuery === 'keypair') {
                requestOptions.qs = await this.queryParameters.parameters.reduce(parametersToKeyValue, Promise.resolve({}));
            }
            else if (specifyQuery === 'json') {
                try {
                    JSON.parse(this.jsonQuery);
                }
                catch {
                    this.logger.error('JSON parameter needs to be valid JSON');
                }
                requestOptions.qs = (0, n8n_workflow_1.jsonParse)(this.jsonQuery);
            }
        }
        if (sendHeaders && this.headerParameters.parameters) {
            if (specifyHeaders === 'keypair') {
                requestOptions.headers = await this.headerParameters.parameters.reduce(parametersToKeyValue, Promise.resolve({}));
            }
            else if (specifyHeaders === 'json') {
                try {
                    JSON.parse(this.jsonHeaders);
                }
                catch {
                    this.logger.error('JSON parameter needs to be valid JSON');
                }
                requestOptions.headers = (0, n8n_workflow_1.jsonParse)(this.jsonHeaders);
            }
        }
        if (requestOptions.headers === undefined) {
            requestOptions.headers = {};
        }
        requestOptions.headers['Content-Type'] = 'application/json';
        this.requestOptions = requestOptions;
    }
    serialize() {
        const abstractSerialized = super.serialize();
        const options = { ...this.options };
        if (options.proxy && !('proxy' in options.proxy)) {
            options.proxy = { proxy: options.proxy };
        }
        if (options.redirect && !('redirect' in options.redirect)) {
            options.redirect = { redirect: options.redirect };
        }
        return {
            ...abstractSerialized,
            url: this.url,
            responseCodeMustMatch: this.responseCodeMustMatch,
            expectedStatusCode: this.expectedStatusCode,
            method: this.method,
            authentication: this.authentication,
            sendQuery: this.sendQuery,
            sendHeaders: this.sendHeaders,
            genericAuthType: this.genericAuthType,
            nodeCredentialType: this.nodeCredentialType,
            specifyHeaders: this.specifyHeaders,
            specifyQuery: this.specifyQuery,
            jsonQuery: this.jsonQuery,
            jsonHeaders: this.jsonHeaders,
            headerParameters: this.headerParameters,
            queryParameters: this.queryParameters,
            sendPayload: this.sendPayload,
            options,
            credentials: this.credentials,
        };
    }
    static deserialize(eventBusInstance, data, outboundHttp) {
        if ('__type' in data &&
            data.__type === "$$MessageEventBusDestinationWebhook" &&
            (0, exports.isMessageEventBusDestinationWebhookOptions)(data)) {
            return new MessageEventBusDestinationWebhook(eventBusInstance, data, outboundHttp);
        }
        return null;
    }
    async receiveFromEventBus(emitterPayload) {
        const { msg, confirmCallback } = emitterPayload;
        let sendResult = false;
        await this.generateRequestOptions();
        const request = {
            ...(this.requestOptions ?? { url: this.url }),
            returnFullResponse: true,
        };
        const payload = this.anonymizeAuditMessages ? msg.anonymize() : msg.payload;
        if (['PATCH', 'POST', 'PUT', 'GET'].includes(this.method.toUpperCase())) {
            request.json = true;
            if (this.sendPayload) {
                request.body = {
                    ...msg,
                    __type: undefined,
                    payload,
                    ts: msg.ts.toISO(),
                };
            }
            else {
                request.body = {
                    ...msg,
                    __type: undefined,
                    payload: undefined,
                    ts: msg.ts.toISO(),
                };
            }
        }
        let httpBasicAuth;
        let httpDigestAuth;
        let httpHeaderAuth;
        let httpQueryAuth;
        let httpTemplatedCustomAuth;
        if (this.authentication === 'genericCredentialType') {
            if (this.genericAuthType === 'httpBasicAuth') {
                try {
                    httpBasicAuth = await this.matchDecryptedCredentialType('httpBasicAuth');
                }
                catch { }
            }
            else if (this.genericAuthType === 'httpDigestAuth') {
                try {
                    httpDigestAuth = await this.matchDecryptedCredentialType('httpDigestAuth');
                }
                catch { }
            }
            else if (this.genericAuthType === 'httpHeaderAuth') {
                try {
                    httpHeaderAuth = await this.matchDecryptedCredentialType('httpHeaderAuth');
                }
                catch { }
            }
            else if (this.genericAuthType === 'httpQueryAuth') {
                try {
                    httpQueryAuth = await this.matchDecryptedCredentialType('httpQueryAuth');
                }
                catch { }
            }
            else if (this.genericAuthType === 'httpTemplatedCustomAuth') {
                httpTemplatedCustomAuth = await this.matchDecryptedCredentialType('httpTemplatedCustomAuth', false);
            }
        }
        if (httpBasicAuth) {
            request.auth = {
                username: httpBasicAuth.user,
                password: httpBasicAuth.password,
            };
        }
        else if (httpHeaderAuth) {
            request.headers = {
                ...request.headers,
                [httpHeaderAuth.name]: httpHeaderAuth.value,
            };
        }
        else if (httpQueryAuth) {
            request.qs = {
                ...request.qs,
                [httpQueryAuth.name]: httpQueryAuth.value,
            };
        }
        else if (httpDigestAuth) {
            request.auth = {
                username: httpDigestAuth.user,
                password: httpDigestAuth.password,
            };
        }
        else if (httpTemplatedCustomAuth) {
            this.credentialsHelper ??= di_1.Container.get(credentials_helper_1.CredentialsHelper);
            Object.assign(request, await this.credentialsHelper.authenticate(httpTemplatedCustomAuth, 'httpTemplatedCustomAuth', request));
        }
        try {
            const requestResponse = await this.getHttpClient().request(request);
            if (requestResponse) {
                if (this.responseCodeMustMatch) {
                    if (requestResponse.statusCode === this.expectedStatusCode) {
                        confirmCallback(msg, { id: this.id, name: this.label });
                        sendResult = true;
                    }
                    else {
                        sendResult = false;
                    }
                }
                else {
                    confirmCallback(msg, { id: this.id, name: this.label });
                    sendResult = true;
                }
            }
        }
        catch (error) {
            this.logger.warn(`Webhook destination ${this.label} (${this.id}) failed to send message to: ${this.url} - ${error.message}`);
            throw error;
        }
        return sendResult;
    }
    async close() {
        await super.close();
        this.httpClient?.close();
    }
}
exports.MessageEventBusDestinationWebhook = MessageEventBusDestinationWebhook;
//# sourceMappingURL=message-event-bus-destination-webhook.ee.js.map