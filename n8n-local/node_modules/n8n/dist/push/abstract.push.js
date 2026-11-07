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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractPush = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
let AbstractPush = class AbstractPush extends backend_common_1.TypedEmitter {
    constructor(logger, errorReporter) {
        super();
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.connections = {};
        this.userIdByPushRef = {};
        setInterval(() => this.pingAll(), 60 * 1000);
    }
    add(pushRef, userId, connection) {
        const { connections, userIdByPushRef } = this;
        this.logger.debug('Add editor-UI session', { pushRef });
        const existingConnection = connections[pushRef];
        if (existingConnection) {
            this.close(existingConnection);
        }
        connections[pushRef] = connection;
        userIdByPushRef[pushRef] = userId;
    }
    onMessageReceived(pushRef, msg) {
        this.logger.debug('Received message from editor-UI', { pushRef, msg });
        const userId = this.userIdByPushRef[pushRef];
        this.emit('message', { pushRef, userId, msg });
    }
    getConnection(pushRef) {
        return this.connections[pushRef];
    }
    remove(pushRef) {
        if (!pushRef)
            return;
        this.logger.debug('Removed editor-UI session', { pushRef });
        delete this.connections[pushRef];
        delete this.userIdByPushRef[pushRef];
    }
    sendTo({ type, data }, pushRefs, asBinary = false) {
        if (pushRefs.length === 0)
            return;
        this.logger.debug(`Pushed to frontend: ${type}`, {
            dataType: type,
            pushRefs: pushRefs.join(', '),
        });
        const stringifiedPayload = (0, n8n_workflow_1.jsonStringify)({ type, data }, { replaceCircularRefs: true });
        for (const pushRef of pushRefs) {
            const connection = this.connections[pushRef];
            (0, n8n_workflow_1.assert)(connection);
            this.sendToOneConnection(connection, stringifiedPayload, asBinary);
        }
    }
    pingAll() {
        for (const pushRef in this.connections) {
            this.ping(this.connections[pushRef]);
        }
    }
    sendToAll(pushMsg) {
        this.sendTo(pushMsg, Object.keys(this.connections));
    }
    sendToOne(pushMsg, pushRef, asBinary = false) {
        if (this.connections[pushRef] === undefined) {
            this.logger.debug(`The session "${pushRef}" is not registered.`, { pushRef });
            return;
        }
        this.sendTo(pushMsg, [pushRef], asBinary);
    }
    sendToUsers(pushMsg, userIds, options) {
        const { connections } = this;
        const userIdSet = new Set(userIds);
        const userPushRefs = Object.keys(connections).filter((pushRef) => pushRef !== options?.excludePushRef && userIdSet.has(this.userIdByPushRef[pushRef]));
        this.sendTo(pushMsg, userPushRefs);
    }
    getDiagnosticCounts() {
        return { connections: Object.keys(this.connections).length };
    }
    closeAllConnections() {
        for (const pushRef in this.connections) {
            this.close(this.connections[pushRef]);
        }
    }
    hasPushRef(pushRef) {
        return this.connections[pushRef] !== undefined;
    }
};
exports.AbstractPush = AbstractPush;
exports.AbstractPush = AbstractPush = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.ErrorReporter])
], AbstractPush);
//# sourceMappingURL=abstract.push.js.map