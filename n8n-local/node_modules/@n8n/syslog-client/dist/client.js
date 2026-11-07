"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyslogClient = void 0;
const dgram = __importStar(require("dgram"));
const events_1 = require("events");
const net = __importStar(require("net"));
const os = __importStar(require("os"));
const tls = __importStar(require("tls"));
const constants_1 = require("./constants");
const errors_1 = require("./errors");
const schemas_1 = require("./schemas");
const utils_1 = require("./utils");
class SyslogClient extends events_1.EventEmitter {
    constructor(target, options) {
        super();
        this.connecting = false;
        this.getTransportRequests = [];
        this.target = target ?? '127.0.0.1';
        const validationResult = schemas_1.clientOptionsSchema.safeParse(options ?? {});
        if (!validationResult.success) {
            throw errors_1.ValidationError.fromZod('Invalid client options', validationResult.error.errors);
        }
        const opts = validationResult.data;
        this.syslogHostname = opts.syslogHostname ?? os.hostname();
        this.port = opts.port ?? 514;
        this.tcpTimeout = opts.tcpTimeout ?? 10000;
        this.facility = typeof opts.facility === 'number' ? opts.facility : constants_1.Facility.Local0;
        this.severity = typeof opts.severity === 'number' ? opts.severity : constants_1.Severity.Informational;
        this.rfc3164 = opts.rfc3164 ?? true;
        this.appName = opts.appName ?? process.title.substring(process.title.lastIndexOf('/') + 1, 48);
        this.dateFormatter = opts.dateFormatter ?? utils_1.defaultDateFormatter;
        this.udpBindAddress = opts.udpBindAddress;
        this.transport = opts.transport ?? constants_1.Transport.Udp;
        this.tlsCA = opts.tlsCA;
    }
    log(message, options, errorCb) {
        let opts = {};
        let logCallback;
        if (typeof options === 'function') {
            logCallback = options;
        }
        else if (typeof options === 'object') {
            opts = options;
            logCallback = errorCb;
        }
        if (!logCallback) {
            return new Promise((resolve, reject) => {
                this.logInternal(message, opts, (error) => {
                    if (error)
                        reject(error);
                    else
                        resolve();
                });
            });
        }
        this.logInternal(message, opts, logCallback);
    }
    logInternal(message, options, errorCb) {
        const validationResult = schemas_1.logOptionsSchema.safeParse(options);
        if (!validationResult.success) {
            errorCb(errors_1.ValidationError.fromZod('Invalid log options', validationResult.error.errors));
            return;
        }
        const resolvedOptions = {
            facility: options.facility ?? this.facility,
            severity: options.severity ?? this.severity,
            rfc3164: options.rfc3164 ?? this.rfc3164,
            appName: options.appName ?? this.appName,
            syslogHostname: options.syslogHostname ?? this.syslogHostname,
            timestamp: options.timestamp,
            msgid: options.msgid,
        };
        const formattedMessage = (0, utils_1.buildFormattedMessage)(message, resolvedOptions, this.dateFormatter);
        this.getTransport((error, transport) => {
            if (error || !transport) {
                errorCb(error ?? new errors_1.ConnectionError('Failed to get transport'));
                return;
            }
            this.sendMessage(transport, formattedMessage, errorCb);
        });
    }
    sendMessage(transport, message, completionCb) {
        try {
            if (this.isStreamSocket(transport)) {
                transport.write(message, (error) => {
                    if (error) {
                        completionCb(new errors_1.TransportError('Write failed', this.getTransportName(), error));
                    }
                    else {
                        completionCb();
                    }
                });
            }
            else if (this.isUdpSocket(transport)) {
                transport.send(message, 0, message.length, this.port, this.target, (error) => {
                    if (error) {
                        completionCb(new errors_1.TransportError('Send failed', 'UDP', error));
                    }
                    else {
                        completionCb();
                    }
                });
            }
            else {
                completionCb(new errors_1.SyslogClientError(`Unknown transport: ${this.transport}`));
            }
        }
        catch (error) {
            this.onError(this.normalizeError(error));
            completionCb(this.normalizeError(error));
        }
    }
    getTransport(completionCb) {
        if (this.transport_) {
            completionCb(null, this.transport_);
            return;
        }
        this.getTransportRequests.push(completionCb);
        if (this.connecting) {
            return;
        }
        this.connecting = true;
        const notifyAllWaitingRequests = (error, transport) => {
            while (this.getTransportRequests.length > 0) {
                const listenerCb = this.getTransportRequests.shift();
                if (listenerCb)
                    listenerCb(error, transport);
            }
            this.connecting = false;
        };
        if (this.transport === constants_1.Transport.Udp) {
            this.createUdpTransport(notifyAllWaitingRequests);
        }
        else if (this.transport === constants_1.Transport.Tcp || this.transport === constants_1.Transport.Unix) {
            this.createTcpTransport(notifyAllWaitingRequests);
        }
        else if (this.transport === constants_1.Transport.Tls) {
            this.createTlsTransport(notifyAllWaitingRequests);
        }
        else {
            notifyAllWaitingRequests(new errors_1.SyslogClientError(`Unknown transport: ${this.getTransportName()}`));
        }
    }
    createTcpTransport(completionCb) {
        const options = this.transport === constants_1.Transport.Unix
            ? { path: this.target }
            : {
                host: this.target,
                port: this.port,
                family: (0, utils_1.isIPv6)(this.target) ? 6 : 4,
            };
        let transport;
        try {
            transport = net.createConnection(options, () => this.onSocketConnected(transport, completionCb));
        }
        catch (error) {
            completionCb(new errors_1.ConnectionError('Failed to create TCP connection', this.normalizeError(error)));
            this.onError(this.normalizeError(error));
            return;
        }
        this.setupSocketHandlers(transport, completionCb);
    }
    createTlsTransport(completionCb) {
        const options = {
            host: this.target,
            port: this.port,
            ca: this.tlsCA,
            minVersion: 'TLSv1.2',
        };
        let transport;
        try {
            transport = tls.connect(options, () => this.onSocketConnected(transport, completionCb));
        }
        catch (error) {
            completionCb(new errors_1.ConnectionError('Failed to create TLS connection', this.normalizeError(error)));
            this.onError(this.normalizeError(error));
            return;
        }
        this.setupSocketHandlers(transport, completionCb);
    }
    setupSocketHandlers(socket, completionCb) {
        socket.setTimeout(this.tcpTimeout, () => {
            const error = new errors_1.TimeoutError();
            socket.destroy();
            this.emit('error', error);
            completionCb(error);
        });
        socket.on('error', (socketError) => {
            socket.destroy();
            const error = new errors_1.ConnectionError('Transport error', socketError);
            this.onError(socketError);
            completionCb(error);
        });
        socket.on('close', this.onClose.bind(this));
        socket.unref();
    }
    onSocketConnected(socket, completionCb) {
        this.transport_ = socket;
        socket.setTimeout(0);
        completionCb(null, this.transport_);
    }
    createUdpTransport(completionCb) {
        try {
            const family = (0, utils_1.isIPv6)(this.target) ? 6 : 4;
            this.transport_ = dgram.createSocket(`udp${family}`);
            if (this.udpBindAddress) {
                this.transport_.bind({ address: this.udpBindAddress });
            }
            this.transport_.on('close', this.onClose.bind(this));
            this.transport_.on('error', (transportError) => {
                const error = new errors_1.ConnectionError('UDP socket error', transportError);
                this.onError(error);
                completionCb(error);
            });
            this.transport_.unref();
            completionCb(null, this.transport_);
        }
        catch (transportError) {
            if (this.transport_ && this.isUdpSocket(this.transport_)) {
                try {
                    this.transport_.close();
                }
                catch {
                }
            }
            const error = this.normalizeError(transportError);
            this.onError(error);
            completionCb(new errors_1.ConnectionError('Failed to create UDP socket', error));
        }
    }
    close() {
        if (this.transport_) {
            if (this.isStreamSocket(this.transport_)) {
                this.transport_.destroy();
            }
            else if (this.isUdpSocket(this.transport_)) {
                this.transport_.close();
            }
            this.transport_ = undefined;
        }
        else {
            this.onClose();
        }
        return this;
    }
    onClose() {
        if (this.transport_) {
            if ('destroy' in this.transport_) {
                this.transport_.destroy();
            }
            this.transport_ = undefined;
        }
        this.emit('close');
        return this;
    }
    onError(error) {
        if (this.transport_) {
            if ('destroy' in this.transport_) {
                this.transport_.destroy();
            }
            this.transport_ = undefined;
        }
        this.emit('error', error);
        return this;
    }
    isStreamSocket(transport) {
        return 'write' in transport && typeof transport.write === 'function';
    }
    isUdpSocket(transport) {
        return 'send' in transport && typeof transport.send === 'function';
    }
    getTransportName() {
        switch (this.transport) {
            case constants_1.Transport.Tcp:
                return 'TCP';
            case constants_1.Transport.Udp:
                return 'UDP';
            case constants_1.Transport.Tls:
                return 'TLS';
            case constants_1.Transport.Unix:
                return 'Unix';
            default:
                return 'Unknown';
        }
    }
    normalizeError(error) {
        return error instanceof Error ? error : new Error(String(error));
    }
}
exports.SyslogClient = SyslogClient;
//# sourceMappingURL=client.js.map