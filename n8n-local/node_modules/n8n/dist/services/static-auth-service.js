"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticAuthService = void 0;
const di_1 = require("@n8n/di");
let StaticAuthService = class StaticAuthService {
    static getStaticAuthMiddleware(endpointAuthToken, headerName = 'authorization') {
        if (!endpointAuthToken?.trim()) {
            return null;
        }
        const expectedAuthorizationHeaderValue = `Bearer ${endpointAuthToken.trim()}`;
        return (req, res, next) => {
            if (req.headers[headerName] !== expectedAuthorizationHeaderValue) {
                res.status(401).send('Unauthorized');
                return;
            }
            next();
        };
    }
};
exports.StaticAuthService = StaticAuthService;
exports.StaticAuthService = StaticAuthService = __decorate([
    (0, di_1.Service)()
], StaticAuthService);
//# sourceMappingURL=static-auth-service.js.map