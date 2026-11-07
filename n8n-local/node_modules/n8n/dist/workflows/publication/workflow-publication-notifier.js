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
exports.WorkflowPublicationNotifier = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
let WorkflowPublicationNotifier = class WorkflowPublicationNotifier {
    constructor(errorReporter, instanceSettings, publisher, workflowsConfig) {
        this.errorReporter = errorReporter;
        this.instanceSettings = instanceSettings;
        this.publisher = publisher;
        this.workflowsConfig = workflowsConfig;
    }
    requestDrain() {
        if (!this.workflowsConfig.useWorkflowPublicationService)
            return;
        const wake = this.instanceSettings.isMultiMain
            ? this.publisher.publishCommand({ command: 'workflow-publish-wake-up' })
            : this.wakeLocalConsumer();
        void wake.catch((error) => this.errorReporter.error(error, { shouldBeLogged: true }));
    }
    async wakeLocalConsumer() {
        const { WorkflowPublicationOutboxConsumer } = await import('./workflow-publication-outbox-consumer.js');
        await di_1.Container.get(WorkflowPublicationOutboxConsumer).wakeUp();
    }
};
exports.WorkflowPublicationNotifier = WorkflowPublicationNotifier;
exports.WorkflowPublicationNotifier = WorkflowPublicationNotifier = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.ErrorReporter, n8n_core_1.InstanceSettings, publisher_service_1.Publisher, config_1.WorkflowsConfig])
], WorkflowPublicationNotifier);
//# sourceMappingURL=workflow-publication-notifier.js.map