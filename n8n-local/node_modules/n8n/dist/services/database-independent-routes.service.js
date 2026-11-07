"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseIndependentRoutes = void 0;
const di_1 = require("@n8n/di");
let DatabaseIndependentRoutes = class DatabaseIndependentRoutes {
    constructor() {
        this.paths = new Set();
    }
    add(path) {
        this.paths.add(withoutTrailingSlash(path));
    }
    has(path) {
        return this.paths.has(withoutTrailingSlash(path));
    }
};
exports.DatabaseIndependentRoutes = DatabaseIndependentRoutes;
exports.DatabaseIndependentRoutes = DatabaseIndependentRoutes = __decorate([
    (0, di_1.Service)()
], DatabaseIndependentRoutes);
function withoutTrailingSlash(path) {
    return path.replace(/\/$/, '');
}
//# sourceMappingURL=database-independent-routes.service.js.map