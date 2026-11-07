"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Currents = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const ActionDescription_1 = require("./descriptions/ActionDescription");
const InstanceDescription_1 = require("./descriptions/InstanceDescription");
const ProjectDescription_1 = require("./descriptions/ProjectDescription");
const RunDescription_1 = require("./descriptions/RunDescription");
const SignatureDescription_1 = require("./descriptions/SignatureDescription");
const SpecFileDescription_1 = require("./descriptions/SpecFileDescription");
const TestDescription_1 = require("./descriptions/TestDescription");
const TestResultDescription_1 = require("./descriptions/TestResultDescription");
const methods_1 = require("./methods");
class Currents {
    description = {
        displayName: 'Currents',
        name: 'currents',
        icon: 'file:currents.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
        description: 'Interact with the Currents API for test orchestration and analytics',
        defaults: {
            name: 'Currents',
        },
        usableAsTool: true,
        inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
        outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
        credentials: [
            {
                name: 'currentsApi',
                required: true,
            },
        ],
        requestDefaults: {
            baseURL: 'https://api.currents.dev/v1',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            arrayFormat: 'brackets',
        },
        properties: [
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Action',
                        value: 'action',
                        description: 'Test action rules (skip, quarantine, tag)',
                    },
                    {
                        name: 'Instance',
                        value: 'instance',
                        description: 'Spec file execution instance',
                    },
                    {
                        name: 'Project',
                        value: 'project',
                        description: 'Test project',
                    },
                    {
                        name: 'Run',
                        value: 'run',
                        description: 'Test run',
                    },
                    {
                        name: 'Signature',
                        value: 'signature',
                        description: 'Generate unique test signatures',
                    },
                    {
                        name: 'Spec File',
                        value: 'specFile',
                        description: 'Spec file performance metrics',
                    },
                    {
                        name: 'Test',
                        value: 'test',
                        description: 'Individual test performance metrics',
                    },
                    {
                        name: 'Test Result',
                        value: 'testResult',
                        description: 'Historical test execution results',
                    },
                ],
                default: 'run',
            },
            // Action
            ...ActionDescription_1.actionOperations,
            ...ActionDescription_1.actionFields,
            // Instance
            ...InstanceDescription_1.instanceOperations,
            ...InstanceDescription_1.instanceFields,
            // Project
            ...ProjectDescription_1.projectOperations,
            ...ProjectDescription_1.projectFields,
            // Run
            ...RunDescription_1.runOperations,
            ...RunDescription_1.runFields,
            // Signature
            ...SignatureDescription_1.signatureOperations,
            ...SignatureDescription_1.signatureFields,
            // Spec File
            ...SpecFileDescription_1.specFileOperations,
            ...SpecFileDescription_1.specFileFields,
            // Test
            ...TestDescription_1.testOperations,
            ...TestDescription_1.testFields,
            // Test Result
            ...TestResultDescription_1.testResultOperations,
            ...TestResultDescription_1.testResultFields,
        ],
    };
    methods = {
        listSearch: methods_1.listSearch,
    };
}
exports.Currents = Currents;
//# sourceMappingURL=Currents.node.js.map