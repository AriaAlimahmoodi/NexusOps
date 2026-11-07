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
exports.BrowserUseServer = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const http_1 = require("http");
const ws_1 = require("ws");
const browser_use_ws_constants_1 = require("./browser-use-ws.constants");
const instance_ai_browser_session_service_1 = require("./instance-ai-browser-session.service");
let BrowserUseServer = class BrowserUseServer {
    constructor(sessionService) {
        this.sessionService = sessionService;
        this.wsServer = new ws_1.Server({ noServer: true });
    }
    setup(server, app) {
        server.on('upgrade', (req, socket, head) => {
            const pathname = URL.parse(req.url ?? '', 'http://localhost')?.pathname;
            if (!pathname?.startsWith(`${browser_use_ws_constants_1.BROWSER_USE_WS_NAMESPACE}/`))
                return;
            this.wsServer.handleUpgrade(req, socket, head, (ws) => {
                req.ws = ws;
                const res = new http_1.ServerResponse(req);
                res.writeHead = (statusCode) => {
                    if (statusCode > 200)
                        ws.close();
                    return res;
                };
                app.handle(req, res);
            });
        });
        app.all(`${browser_use_ws_constants_1.BROWSER_USE_WS_NAMESPACE}/extension/:sessionId`, this.onUpgrade((req) => this.sessionService.handleExtensionUpgrade(req)));
        app.all(`${browser_use_ws_constants_1.BROWSER_USE_WS_NAMESPACE}/cdp/:sessionId`, this.onUpgrade((req) => this.sessionService.handleCdpUpgrade(req)));
    }
    onUpgrade(handle) {
        return (req, res) => {
            const wsReq = req;
            if (!wsReq.ws) {
                res.status(426).end();
                return;
            }
            handle(wsReq);
        };
    }
    shutdown() {
        this.wsServer.close();
    }
};
exports.BrowserUseServer = BrowserUseServer;
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BrowserUseServer.prototype, "shutdown", null);
exports.BrowserUseServer = BrowserUseServer = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [instance_ai_browser_session_service_1.InstanceAiBrowserSessionService])
], BrowserUseServer);
//# sourceMappingURL=browser-use-server.js.map