"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseInfoCommand = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const license_1 = require("../../license");
const base_command_1 = require("../base-command");
let LicenseInfoCommand = class LicenseInfoCommand extends base_command_1.BaseCommand {
    async run() {
        const license = di_1.Container.get(license_1.License);
        await license.init({ isCli: true });
        process.stdout.write(license.getInfo() + '\n');
    }
    async catch(error) {
        process.stderr.write('\nGOT ERROR\n');
        process.stderr.write('====================================\n');
        process.stderr.write(error.message + '\n');
    }
};
exports.LicenseInfoCommand = LicenseInfoCommand;
exports.LicenseInfoCommand = LicenseInfoCommand = __decorate([
    (0, decorators_1.Command)({
        name: 'license:info',
        description: 'Print license information',
    })
], LicenseInfoCommand);
//# sourceMappingURL=info.js.map