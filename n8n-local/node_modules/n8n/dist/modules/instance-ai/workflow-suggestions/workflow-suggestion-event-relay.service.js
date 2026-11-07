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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowSuggestionEventRelay = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const debounce_1 = __importDefault(require("lodash/debounce"));
const workflow_suggestion_service_1 = require("./workflow-suggestion.service");
const SAVE_DEBOUNCE_MS = 30_000;
const MAX_SAVE_WAIT_MS = 60_000;
let WorkflowSuggestionEventRelay = class WorkflowSuggestionEventRelay {
    constructor(events, suggestions, logger) {
        const pendingSaves = new Map();
        const reconcile = async (workflowId) => {
            pendingSaves.get(workflowId)?.cancel();
            pendingSaves.delete(workflowId);
            try {
                await suggestions.reconcileWorkflow(workflowId);
            }
            catch (error) {
                logger.warn('Could not reconcile workflow suggestions', { workflowId, error });
            }
        };
        events.on('workflow-saved', ({ workflow }) => {
            const workflowId = workflow.id;
            let pending = pendingSaves.get(workflowId);
            if (!pending) {
                pending = (0, debounce_1.default)(async () => await reconcile(workflowId), SAVE_DEBOUNCE_MS, {
                    maxWait: MAX_SAVE_WAIT_MS,
                });
                pendingSaves.set(workflowId, pending);
            }
            void pending();
        });
        events.on('workflow-activated', async ({ workflowId }) => await reconcile(workflowId));
        events.on('workflow-deactivated', async ({ workflowId }) => await reconcile(workflowId));
        events.on('workflow-archived', async ({ workflowId }) => await reconcile(workflowId));
    }
};
exports.WorkflowSuggestionEventRelay = WorkflowSuggestionEventRelay;
exports.WorkflowSuggestionEventRelay = WorkflowSuggestionEventRelay = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.EventService, workflow_suggestion_service_1.WorkflowSuggestionService, backend_common_1.Logger])
], WorkflowSuggestionEventRelay);
//# sourceMappingURL=workflow-suggestion-event-relay.service.js.map