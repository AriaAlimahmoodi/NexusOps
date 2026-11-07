"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageEventBusDestinationSyslog = exports.isMessageEventBusDestinationSyslogOptions = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const syslog_client_1 = require("@n8n/syslog-client");
const sleep_1 = require("@n8n/utils/sleep");
const event_message_generic_1 = require("../../../eventbus/event-message-classes/event-message-generic");
const message_event_bus_destination_ee_1 = require("./message-event-bus-destination.ee");
const isMessageEventBusDestinationSyslogOptions = (candidate) => {
    const o = candidate;
    if (!o)
        return false;
    return o.host !== undefined;
};
exports.isMessageEventBusDestinationSyslogOptions = isMessageEventBusDestinationSyslogOptions;
class MessageEventBusDestinationSyslog extends message_event_bus_destination_ee_1.MessageEventBusDestination {
    constructor(eventBusInstance, options) {
        super(eventBusInstance, options);
        this.__type = options.__type ?? "$$MessageEventBusDestinationSyslog";
        this.label = options.label ?? 'Syslog Server';
        this.host = options.host ?? 'localhost';
        this.port = options.port ?? 514;
        this.protocol = options.protocol ?? 'udp';
        this.facility = options.facility ?? syslog_client_1.Facility.Local0;
        this.app_name = options.app_name ?? 'n8n';
        this.eol = options.eol ?? '\n';
        this.expectedStatusCode = options.expectedStatusCode ?? 200;
        if (this.protocol === 'tls' && !options.tlsCa) {
            this.logger.error('Syslog - No TLS CA set - Unable to create the syslog client');
        }
        this.client = (0, syslog_client_1.createClient)(this.host, {
            appName: this.app_name,
            facility: syslog_client_1.Facility.Local0,
            port: this.port,
            rfc3164: false,
            tlsCA: options.tlsCa,
            transport: this.protocol === 'tcp'
                ? syslog_client_1.Transport.Tcp
                : this.protocol === 'tls'
                    ? syslog_client_1.Transport.Tls
                    : syslog_client_1.Transport.Udp,
        });
        this.logger.debug(`MessageEventBusDestinationSyslog with id ${this.getId()} initialized`);
        this.client.on('error', function (error) {
            di_1.Container.get(backend_common_1.Logger).error(`${error.message}`);
        });
    }
    async receiveFromEventBus(emitterPayload) {
        const { msg, confirmCallback } = emitterPayload;
        let sendResult = false;
        try {
            const serializedMessage = msg.serialize();
            if (this.anonymizeAuditMessages) {
                serializedMessage.payload = msg.anonymize();
            }
            delete serializedMessage.__type;
            await this.client.log(JSON.stringify(serializedMessage), {
                severity: msg.eventName.toLowerCase().endsWith('error') ? syslog_client_1.Severity.Error : syslog_client_1.Severity.Debug,
                msgid: msg.id.length > 32 ? msg.id.replace(/-/g, '').substring(0, 32) : msg.id,
                timestamp: msg.ts.toJSDate(),
            }, async (error) => {
                if (error?.message) {
                    this.logger.error(error.message);
                }
                else {
                    confirmCallback(msg, { id: this.id, name: this.label });
                    sendResult = true;
                }
            });
        }
        catch (error) {
            if (error.message)
                this.logger.error(error.message);
            throw error;
        }
        if (msg.eventName === event_message_generic_1.eventMessageGenericDestinationTestEvent) {
            await (0, sleep_1.sleep)(500);
        }
        return sendResult;
    }
    serialize() {
        const abstractSerialized = super.serialize();
        return {
            ...abstractSerialized,
            expectedStatusCode: this.expectedStatusCode,
            host: this.host,
            port: this.port,
            protocol: this.protocol,
            facility: this.facility,
            app_name: this.app_name,
            eol: this.eol,
        };
    }
    static deserialize(eventBusInstance, data) {
        if ('__type' in data &&
            data.__type === "$$MessageEventBusDestinationSyslog" &&
            (0, exports.isMessageEventBusDestinationSyslogOptions)(data)) {
            return new MessageEventBusDestinationSyslog(eventBusInstance, data);
        }
        return null;
    }
    toString() {
        return JSON.stringify(this.serialize());
    }
    async close() {
        await super.close();
        this.client.close();
    }
}
exports.MessageEventBusDestinationSyslog = MessageEventBusDestinationSyslog;
//# sourceMappingURL=message-event-bus-destination-syslog.ee.js.map