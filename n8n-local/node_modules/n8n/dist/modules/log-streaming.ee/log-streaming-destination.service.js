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
exports.LogStreamingDestinationService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const event_message_generic_1 = require("../../eventbus/event-message-classes/event-message-generic");
const message_event_bus_1 = require("../../eventbus/message-event-bus/message-event-bus");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const event_destination_repository_1 = require("./database/repositories/event-destination.repository");
const message_event_bus_destination_from_db_1 = require("./destinations/message-event-bus-destination-from-db");
let LogStreamingDestinationService = class LogStreamingDestinationService {
    constructor(logger, eventDestinationsRepository, eventBus, publisher, outboundHttp) {
        this.logger = logger;
        this.eventDestinationsRepository = eventDestinationsRepository;
        this.eventBus = eventBus;
        this.publisher = publisher;
        this.outboundHttp = outboundHttp;
        this.destinations = {};
        this.isListening = false;
        this.messageHandler = this.handleMessage.bind(this);
    }
    async loadDestinationsFromDb() {
        const savedEventDestinations = await this.eventDestinationsRepository.find({});
        if (savedEventDestinations.length > 0) {
            for (const destinationData of savedEventDestinations) {
                try {
                    const destination = (0, message_event_bus_destination_from_db_1.messageEventBusDestinationFromDb)(this.eventBus, destinationData, this.outboundHttp);
                    if (destination) {
                        this.destinations[destination.getId()] = destination;
                        this.logger.debug(`Loaded destination ${destination.getId()} from database`);
                    }
                }
                catch (error) {
                    this.logger.debug('Failed to load destination from database', { error });
                }
            }
        }
    }
    async saveDestinationToDb(destination) {
        const data = {
            id: destination.getId(),
            destination: destination.serialize(),
        };
        const dbResult = await this.eventDestinationsRepository.upsert(data, {
            skipUpdateIfNoValuesChanged: true,
            conflictPaths: ['id'],
        });
        return dbResult;
    }
    async deleteDestinationFromDb(id) {
        return await this.eventDestinationsRepository.delete({ id });
    }
    async addDestination(destination, notifyInstances = true) {
        await this.destinations[destination.getId()]?.close();
        this.destinations[destination.getId()] = destination;
        this.logger.debug(`Added destination ${destination.getId()}`);
        await this.saveDestinationToDb(destination);
        if (notifyInstances) {
            void this.publisher.publishCommand({ command: 'restart-event-bus' });
        }
        return destination;
    }
    async removeDestination(id, notifyInstances = true) {
        if (this.destinations[id]) {
            await this.destinations[id].close();
            delete this.destinations[id];
            this.logger.debug(`Removed destination ${id}`);
        }
        if (notifyInstances) {
            void this.publisher.publishCommand({ command: 'restart-event-bus' });
        }
        return await this.deleteDestinationFromDb(id);
    }
    async initialize() {
        if (this.isListening) {
            return;
        }
        this.logger.debug('Initializing log streaming destination service...');
        this.eventBus.on('message', this.messageHandler);
        this.isListening = true;
        this.logger.debug(`Log streaming destination service initialized with ${Object.keys(this.destinations).length} destinations`);
    }
    async handleMessage(msg, confirmCallback) {
        if (!this.shouldSendMsg(msg)) {
            confirmCallback(msg, { id: '0', name: 'eventBus' });
            return;
        }
        for (const destination of Object.values(this.destinations)) {
            if (destination.hasSubscribedToEvent(msg)) {
                try {
                    await destination.sendMessage({ msg, confirmCallback });
                }
                catch (error) {
                    this.logger.error(`Failed to send message to destination ${destination.getId()}`, {
                        error,
                    });
                }
            }
        }
    }
    async findDestination(id) {
        const result = id
            ? this.destinations[id]
                ? [this.destinations[id].serialize()]
                : []
            : Object.values(this.destinations).map((dest) => dest.serialize());
        return result.sort((a, b) => (a.__type ?? '').localeCompare(b.__type ?? ''));
    }
    async testDestination(destinationId) {
        const msg = new event_message_generic_1.EventMessageGeneric({
            eventName: event_message_generic_1.eventMessageGenericDestinationTestEvent,
        });
        const destination = await this.findDestination(destinationId);
        if (destination.length > 0) {
            const sendResult = await this.destinations[destinationId].receiveFromEventBus({
                msg,
                confirmCallback: () => this.eventBus.confirmMessageDelivered(msg, { id: '0', name: 'eventBus' }),
            });
            return sendResult;
        }
        return false;
    }
    hasAnyDestinationSubscribedToEvent(msg) {
        return Object.values(this.destinations).some((destination) => destination.hasSubscribedToEvent(msg));
    }
    shouldSendMsg(msg) {
        return (Object.keys(this.destinations).length > 0 && this.hasAnyDestinationSubscribedToEvent(msg));
    }
    async close() {
        this.logger.debug('Closing log streaming destination service...');
        if (this.isListening) {
            this.eventBus.removeListener('message', this.messageHandler);
            this.isListening = false;
        }
        for (const destination of Object.values(this.destinations)) {
            this.logger.debug(`Closing destination ${destination.getId()}...`);
            await destination.close();
        }
        this.destinations = {};
        this.logger.debug('Log streaming destination service closed');
    }
    async restart() {
        this.logger.debug('Restarting log streaming destination service...');
        await this.close();
        await this.loadDestinationsFromDb();
        await this.initialize();
    }
};
exports.LogStreamingDestinationService = LogStreamingDestinationService;
__decorate([
    (0, decorators_1.OnPubSubEvent)('restart-event-bus'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LogStreamingDestinationService.prototype, "restart", null);
exports.LogStreamingDestinationService = LogStreamingDestinationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, event_destination_repository_1.EventDestinationsRepository, message_event_bus_1.MessageEventBus, publisher_service_1.Publisher, backend_network_1.OutboundHttp])
], LogStreamingDestinationService);
//# sourceMappingURL=log-streaming-destination.service.js.map