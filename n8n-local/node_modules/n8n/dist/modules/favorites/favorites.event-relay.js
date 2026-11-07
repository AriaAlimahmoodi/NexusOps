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
exports.FavoritesEventRelay = void 0;
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const event_relay_1 = require("../../events/relays/event-relay");
const favorites_service_1 = require("./favorites.service");
let FavoritesEventRelay = class FavoritesEventRelay extends event_relay_1.EventRelay {
    constructor(eventService, favoritesService) {
        super(eventService);
        this.eventService = eventService;
        this.favoritesService = favoritesService;
    }
    init() {
        this.setupListeners({
            'workflow-deleted': async ({ workflowId }) => await this.favoritesService.deleteByResource(workflowId, 'workflow'),
            'data-table-deleted': async ({ dataTableId }) => await this.favoritesService.deleteByResource(dataTableId, 'dataTable'),
            'folder-deleted': async ({ folderId }) => await this.favoritesService.deleteByResource(folderId, 'folder'),
            'team-project-deleted': async ({ projectId }) => await this.favoritesService.deleteByResource(projectId, 'project'),
            'agent-deleted': async ({ agentId }) => await this.favoritesService.deleteByResource(agentId, 'agent'),
        });
    }
};
exports.FavoritesEventRelay = FavoritesEventRelay;
exports.FavoritesEventRelay = FavoritesEventRelay = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.EventService, favorites_service_1.FavoritesService])
], FavoritesEventRelay);
//# sourceMappingURL=favorites.event-relay.js.map