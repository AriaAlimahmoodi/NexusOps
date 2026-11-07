"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentsTrigger = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const CurrentsTriggerHelpers_1 = require("./CurrentsTriggerHelpers");
const common_descriptions_1 = require("./descriptions/common.descriptions");
const methods_1 = require("./methods");
class CurrentsTrigger {
    description = {
        displayName: 'Currents Trigger',
        name: 'currentsTrigger',
        icon: 'file:currents.svg',
        group: ['trigger'],
        version: 1,
        subtitle: '={{$parameter["events"].join(", ")}}',
        description: 'Starts the workflow when Currents events occur',
        defaults: {
            name: 'Currents Trigger',
        },
        inputs: [],
        outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
        credentials: [
            {
                name: 'currentsApi',
                required: true,
            },
        ],
        webhooks: [
            {
                name: 'default',
                httpMethod: 'POST',
                responseMode: 'onReceived',
                path: 'webhook',
            },
        ],
        properties: [
            {
                ...common_descriptions_1.projectRLC,
            },
            {
                displayName: 'Currents sends separate webhook events for each group in a run. If your run has multiple groups, you will receive separate events for each group.',
                name: 'noticeGroups',
                type: 'notice',
                default: '',
            },
            {
                displayName: 'Events',
                name: 'events',
                type: 'multiOptions',
                options: [
                    {
                        name: 'Run Canceled',
                        value: 'RUN_CANCELED',
                        description: 'Triggered when a run is manually canceled',
                    },
                    {
                        name: 'Run Finished',
                        value: 'RUN_FINISH',
                        description: 'Triggered when a run completes',
                    },
                    {
                        name: 'Run Started',
                        value: 'RUN_START',
                        description: 'Triggered when a new run begins',
                    },
                    {
                        name: 'Run Timeout',
                        value: 'RUN_TIMEOUT',
                        description: 'Triggered when a run exceeds the time limit',
                    },
                ],
                required: true,
                default: [],
                description: 'The events to listen to',
            },
        ],
    };
    methods = {
        listSearch: methods_1.listSearch,
    };
    webhookMethods = {
        default: {
            async checkExists() {
                const webhookUrl = this.getNodeWebhookUrl('default');
                if (!webhookUrl) {
                    return false;
                }
                const webhookData = this.getWorkflowStaticData('node');
                const projectId = this.getNodeParameter('projectId', '', { extractValue: true });
                const events = this.getNodeParameter('events', []);
                const existingWebhook = await CurrentsTriggerHelpers_1.findWebhookByUrl.call(this, projectId, webhookUrl);
                if (existingWebhook) {
                    webhookData.hookId = existingWebhook.hookId;
                    // If secret is missing from static data, we need to recreate
                    if (!webhookData.webhookSecret) {
                        try {
                            await CurrentsTriggerHelpers_1.deleteWebhook.call(this, existingWebhook.hookId);
                        }
                        catch (error) {
                            this.logger.debug('Failed to delete orphaned webhook during checkExists', {
                                hookId: existingWebhook.hookId,
                                error,
                            });
                        }
                        return false;
                    }
                    const currentEvents = existingWebhook.hookEvents ?? [];
                    const eventsMatch = events.length === currentEvents.length &&
                        events.every((e) => currentEvents.includes(e));
                    if (!eventsMatch) {
                        const headers = JSON.stringify({
                            'x-webhook-secret': webhookData.webhookSecret,
                        });
                        await CurrentsTriggerHelpers_1.updateWebhook.call(this, existingWebhook.hookId, {
                            hookEvents: events,
                            headers,
                        });
                    }
                    return true;
                }
                return false;
            },
            async create() {
                const webhookUrl = this.getNodeWebhookUrl('default');
                if (!webhookUrl) {
                    return false;
                }
                const webhookData = this.getWorkflowStaticData('node');
                const projectId = this.getNodeParameter('projectId', '', { extractValue: true });
                const events = this.getNodeParameter('events', []);
                const workflow = this.getWorkflow();
                const webhookSecret = (0, CurrentsTriggerHelpers_1.generateWebhookSecret)();
                const label = `n8n workflow ${workflow.id ?? 'unknown'}`;
                const headers = JSON.stringify({
                    'x-webhook-secret': webhookSecret,
                });
                const webhook = await CurrentsTriggerHelpers_1.createWebhook.call(this, projectId, {
                    url: webhookUrl,
                    hookEvents: events,
                    headers,
                    label,
                });
                webhookData.hookId = webhook.hookId;
                webhookData.webhookSecret = webhookSecret;
                return true;
            },
            async delete() {
                const webhookData = this.getWorkflowStaticData('node');
                let hookId = webhookData.hookId;
                // Fallback: lookup webhook by URL if hookId missing from static data
                if (!hookId) {
                    const webhookUrl = this.getNodeWebhookUrl('default');
                    if (webhookUrl) {
                        try {
                            const projectId = this.getNodeParameter('projectId', '', {
                                extractValue: true,
                            });
                            if (projectId) {
                                const existingWebhook = await CurrentsTriggerHelpers_1.findWebhookByUrl.call(this, projectId, webhookUrl);
                                if (existingWebhook) {
                                    hookId = existingWebhook.hookId;
                                }
                            }
                        }
                        catch (error) {
                            this.logger.debug('Failed to lookup webhook by URL during delete', {
                                webhookUrl,
                                error,
                            });
                        }
                    }
                }
                if (hookId) {
                    try {
                        await CurrentsTriggerHelpers_1.deleteWebhook.call(this, hookId);
                    }
                    catch (error) {
                        // Ignore 404 errors (webhook already deleted)
                        const statusCode = error.httpStatusCode;
                        if (statusCode !== 404) {
                            throw error;
                        }
                    }
                    delete webhookData.hookId;
                    delete webhookData.webhookSecret;
                }
                return true;
            },
        },
    };
    // eslint-disable-next-line @typescript-eslint/require-await
    async webhook() {
        if (!CurrentsTriggerHelpers_1.verifyWebhook.call(this)) {
            const res = this.getResponseObject();
            res.status(401).send('Unauthorized').end();
            return {
                noWebhookResponse: true,
            };
        }
        const bodyData = this.getBodyData();
        const events = this.getNodeParameter('events', []);
        const eventType = typeof bodyData.event === 'string' ? bodyData.event : '';
        if (events.length > 0 && !events.includes(eventType)) {
            return {
                webhookResponse: 'OK',
            };
        }
        return {
            workflowData: [this.helpers.returnJsonArray([bodyData])],
        };
    }
}
exports.CurrentsTrigger = CurrentsTrigger;
//# sourceMappingURL=CurrentsTrigger.node.js.map