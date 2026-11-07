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
exports.WorkflowFailureNotificationEventRelay = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const event_relay_1 = require("../../events/relays/event-relay");
const email_1 = require("../../user-management/email");
let WorkflowFailureNotificationEventRelay = class WorkflowFailureNotificationEventRelay extends event_relay_1.EventRelay {
    constructor(eventService, mailer, userRepository, logger) {
        super(eventService);
        this.mailer = mailer;
        this.userRepository = userRepository;
        this.logger = logger;
    }
    init() {
        this.setupListeners({
            'instance-first-production-workflow-failed': async (event) => await this.onFirstProductionWorkflowFailed(event),
        });
    }
    async onFirstProductionWorkflowFailed(event) {
        const { workflowId, workflowName, userId } = event;
        if (!this.mailer.isEmailSetUp) {
            this.logger.debug('Skipping first production failure email - SMTP not configured', {
                workflowId,
                userId,
            });
            return;
        }
        try {
            const user = await this.userRepository.findOneBy({ id: userId });
            if (!user?.email) {
                this.logger.warn('Cannot send first production failure email - user not found or no email', {
                    workflowId,
                    userId,
                });
                return;
            }
            await this.mailer.workflowFailure({
                email: user.email,
                firstName: user.firstName,
                workflowId,
                workflowName,
            });
            this.logger.info('Sent first production failure email', {
                workflowId,
                userId,
                email: user.email,
            });
        }
        catch (error) {
            this.logger.error('Failed to send first production failure email', {
                workflowId,
                userId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
};
exports.WorkflowFailureNotificationEventRelay = WorkflowFailureNotificationEventRelay;
exports.WorkflowFailureNotificationEventRelay = WorkflowFailureNotificationEventRelay = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.EventService, email_1.UserManagementMailer, db_1.UserRepository, backend_common_1.Logger])
], WorkflowFailureNotificationEventRelay);
//# sourceMappingURL=workflow-failure-notification.event-relay.js.map