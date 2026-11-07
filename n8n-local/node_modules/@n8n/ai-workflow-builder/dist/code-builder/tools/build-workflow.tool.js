"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILD_WORKFLOW_TOOL = void 0;
const zod_1 = require("zod");
exports.BUILD_WORKFLOW_TOOL = {
    name: 'build_workflow',
    description: 'Build or modify an n8n workflow. Use this when the user wants to create, modify, configure, ' +
        'fix, or set up a workflow. This includes adding/removing nodes, changing connections, ' +
        'configuring node parameters, setting up credentials on nodes, fixing workflow issues, ' +
        'or any action request on the workflow. ' +
        'IMPORTANT: "fix this", "make it work", "set up X", "help me configure" are all action requests — use this tool.',
    schema: zod_1.z.object({
        instructions: zod_1.z.string().describe('Clear instructions for what to build or modify'),
    }),
};
//# sourceMappingURL=build-workflow.tool.js.map