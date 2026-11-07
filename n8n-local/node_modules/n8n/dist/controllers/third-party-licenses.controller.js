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
exports.ThirdPartyLicensesController = void 0;
const decorators_1 = require("@n8n/decorators");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const constants_1 = require("../constants");
let ThirdPartyLicensesController = class ThirdPartyLicensesController {
    async getThirdPartyLicenses(_, res) {
        const licenseFile = (0, path_1.resolve)(constants_1.CLI_DIR, 'THIRD_PARTY_LICENSES.md');
        try {
            const content = await (0, promises_1.readFile)(licenseFile, 'utf-8');
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            res.send(content);
        }
        catch {
            res.status(404).send('Third-party licenses file not found');
        }
    }
};
exports.ThirdPartyLicensesController = ThirdPartyLicensesController;
__decorate([
    (0, decorators_1.Get)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ThirdPartyLicensesController.prototype, "getThirdPartyLicenses", null);
exports.ThirdPartyLicensesController = ThirdPartyLicensesController = __decorate([
    (0, decorators_1.RestController)('/third-party-licenses')
], ThirdPartyLicensesController);
//# sourceMappingURL=third-party-licenses.controller.js.map