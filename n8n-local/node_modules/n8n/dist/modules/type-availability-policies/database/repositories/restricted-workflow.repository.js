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
exports.RestrictedWorkflowRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const restricted_node_type_match_1 = require("./restricted-node-type-match");
const runningVersionRows = (dependencyAlias, workflowAlias) => `((${workflowAlias}.activeVersionId IS NULL AND ${dependencyAlias}.publishedVersionId IS NULL) OR ${dependencyAlias}.publishedVersionId = ${workflowAlias}.activeVersionId)`;
let RestrictedWorkflowRepository = class RestrictedWorkflowRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(db_1.WorkflowDependency, dataSource.manager);
    }
    async findRunningNodeTypes() {
        const rows = await this.createQueryBuilder('dependency')
            .innerJoin(db_1.WorkflowEntity, 'workflow', 'workflow.id = dependency.workflowId')
            .select('dependency.dependencyKey', 'nodeType')
            .distinct(true)
            .where('dependency.dependencyType = :dependencyType', { dependencyType: 'nodeType' })
            .andWhere(runningVersionRows('dependency', 'workflow'))
            .getRawMany();
        return rows.map(({ nodeType }) => nodeType);
    }
    restrictedWorkflowIdsQuery(restricted) {
        const { condition, parameters } = (0, restricted_node_type_match_1.restrictedNodeTypeMatch)(restricted, this.manager.connection.options.type === 'postgres');
        const subQuery = this.createQueryBuilder('restrictedDep')
            .select('restrictedDep.workflowId')
            .innerJoin(db_1.WorkflowEntity, 'restrictedWorkflow', 'restrictedWorkflow.id = restrictedDep.workflowId')
            .innerJoin(db_1.SharedWorkflow, 'restrictedOwner', "restrictedOwner.workflowId = restrictedDep.workflowId AND restrictedOwner.role = 'workflow:owner'")
            .where('restrictedDep.dependencyType = :restrictedDepType', { restrictedDepType: 'nodeType' })
            .andWhere(runningVersionRows('restrictedDep', 'restrictedWorkflow'))
            .andWhere(condition, parameters);
        return { query: subQuery.getQuery(), parameters: subQuery.getParameters() };
    }
};
exports.RestrictedWorkflowRepository = RestrictedWorkflowRepository;
exports.RestrictedWorkflowRepository = RestrictedWorkflowRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], RestrictedWorkflowRepository);
//# sourceMappingURL=restricted-workflow.repository.js.map