"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pipedrive = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const PipedriveV1_node_1 = require("./v1/PipedriveV1.node");
const PipedriveV2_node_1 = require("./v2/PipedriveV2.node");
class Pipedrive extends n8n_workflow_1.VersionedNodeType {
    constructor() {
        const baseDescription = {
            displayName: 'Pipedrive',
            name: 'pipedrive',
            icon: 'file:pipedrive.svg',
            group: ['transform'],
            defaultVersion: 2,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Create and edit data in Pipedrive',
        };
        const nodeVersions = {
            1: new PipedriveV1_node_1.PipedriveV1(baseDescription),
            2: new PipedriveV2_node_1.PipedriveV2(baseDescription),
        };
        super(nodeVersions, baseDescription);
    }
}
exports.Pipedrive = Pipedrive;
//# sourceMappingURL=Pipedrive.node.js.map