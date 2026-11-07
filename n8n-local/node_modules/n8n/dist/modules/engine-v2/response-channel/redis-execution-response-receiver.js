"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisExecutionResponseReceiver = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const execution_response_frame_1 = require("./execution-response-frame");
class RedisExecutionResponseReceiver {
    constructor(subscriber, getChannelName, logger) {
        this.subscriber = subscriber;
        this.getChannelName = getChannelName;
        this.logger = logger;
        this.subscriptionsByChannel = new Map();
        this.started = false;
        this.stopped = false;
        this.lostConnection = false;
        this.handleClose = () => {
            this.lostConnection = true;
        };
        this.handleReady = () => {
            if (!this.lostConnection)
                return;
            this.lostConnection = false;
            void this.resubscribe();
        };
        this.handleMessage = (channel, frame) => {
            const subscription = this.subscriptionsByChannel.get(channel);
            if (subscription === undefined)
                return;
            const responseResult = (0, execution_response_frame_1.deserializeExecutionResponse)(frame, this.logger);
            if (!responseResult.ok)
                return;
            const response = responseResult.result;
            try {
                subscription.handler(response);
            }
            catch (error) {
                this.logger.error('An execution response handler failed', {
                    executionId: response.executionId,
                    type: response.type,
                    error,
                });
            }
        };
    }
    async start() {
        if (this.started || this.stopped)
            return;
        this.subscriber.on('message', this.handleMessage);
        this.subscriber.on('close', this.handleClose);
        this.subscriber.on('ready', this.handleReady);
        this.started = true;
    }
    async receive(executionId, handler) {
        if (this.stopped)
            return () => { };
        if (!this.started) {
            throw new n8n_workflow_1.UnexpectedError('The execution response receiver has not started');
        }
        const channel = this.getChannelName(executionId);
        if (this.subscriptionsByChannel.has(channel)) {
            throw new n8n_workflow_1.UnexpectedError(`Execution response receiver already has a subscriber for execution "${executionId}"`);
        }
        const subscription = { executionId, handler };
        this.subscriptionsByChannel.set(channel, subscription);
        try {
            await this.subscriber.subscribe(channel);
        }
        catch (error) {
            if (this.subscriptionsByChannel.get(channel) === subscription) {
                this.subscriptionsByChannel.delete(channel);
            }
            throw error;
        }
        return this.unsubscribeHandler(channel, subscription);
    }
    unsubscribeHandler(channel, subscription) {
        return () => {
            if (this.stopped || this.subscriptionsByChannel.get(channel) !== subscription) {
                return;
            }
            this.subscriptionsByChannel.delete(channel);
            void this.subscriber.unsubscribe(channel).catch((error) => {
                this.logger.error('Failed to unsubscribe from execution responses', {
                    executionId: subscription.executionId,
                    error,
                });
            });
        };
    }
    async stop() {
        if (this.stopped)
            return;
        this.stopped = true;
        this.subscriptionsByChannel.clear();
        this.subscriber.off('message', this.handleMessage);
        this.subscriber.off('close', this.handleClose);
        this.subscriber.off('ready', this.handleReady);
        this.subscriber.disconnect();
    }
    async resubscribe() {
        const channels = Array.from(this.subscriptionsByChannel.keys());
        if (channels.length === 0)
            return;
        try {
            await this.subscriber.subscribe(...channels);
        }
        catch (error) {
            this.lostConnection = true;
            this.logger.error('Failed to resubscribe to execution responses after Redis reconnect', {
                error,
            });
        }
    }
}
exports.RedisExecutionResponseReceiver = RedisExecutionResponseReceiver;
//# sourceMappingURL=redis-execution-response-receiver.js.map