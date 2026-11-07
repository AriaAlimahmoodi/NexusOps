"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reset = void 0;
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const base_command_1 = require("../base-command");
const defaultUserProps = {
    firstName: null,
    lastName: null,
    email: null,
    password: null,
    lastActiveAt: null,
    role: 'global:owner',
};
let Reset = class Reset extends base_command_1.BaseCommand {
    async run() {
        const owner = await this.getInstanceOwner();
        const personalProject = await di_1.Container.get(db_1.ProjectRepository).getPersonalProjectForUserOrFail(owner.id);
        await di_1.Container.get(db_1.SharedWorkflowRepository).makeOwnerOfAllWorkflows(personalProject);
        await di_1.Container.get(db_1.SharedCredentialsRepository).makeOwnerOfAllCredentials(personalProject);
        await di_1.Container.get(db_1.UserRepository).deleteAllExcept(owner);
        await di_1.Container.get(db_1.UserRepository).save(Object.assign(owner, defaultUserProps));
        const danglingCredentials = await di_1.Container.get(db_1.CredentialsRepository).findDanglingProjectCredentials();
        const newSharedCredentials = danglingCredentials.map((credentials) => di_1.Container.get(db_1.SharedCredentialsRepository).create({
            credentials,
            projectId: personalProject.id,
            role: 'credential:owner',
        }));
        await di_1.Container.get(db_1.SharedCredentialsRepository).save(newSharedCredentials);
        this.logger.info('Successfully reset the database to default user state.');
    }
    async getInstanceOwner() {
        const owner = await di_1.Container.get(db_1.UserRepository).findOneBy({
            role: { slug: db_1.GLOBAL_OWNER_ROLE.slug },
        });
        if (owner)
            return owner;
        const user = new db_1.User();
        Object.assign(user, defaultUserProps);
        await di_1.Container.get(db_1.UserRepository).save(user);
        return await di_1.Container.get(db_1.UserRepository).findOneByOrFail({
            role: { slug: db_1.GLOBAL_OWNER_ROLE.slug },
        });
    }
    async catch(error) {
        this.logger.error('Error resetting database. See log messages for details.');
        this.logger.error(error.message);
        process.exit(1);
    }
};
exports.Reset = Reset;
exports.Reset = Reset = __decorate([
    (0, decorators_1.Command)({
        name: 'user-management:reset',
        description: 'Resets the database to the default user state',
    })
], Reset);
//# sourceMappingURL=reset.js.map