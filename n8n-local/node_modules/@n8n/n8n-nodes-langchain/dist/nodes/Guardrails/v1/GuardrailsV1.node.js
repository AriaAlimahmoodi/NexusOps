"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardrailsV1 = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const execute_1 = require("../actions/execute");
const description_1 = require("../description");
const configureNodeInputs_1 = require("../helpers/configureNodeInputs");
class GuardrailsV1 {
    constructor(baseDescription) {
        this.description = {
            ...baseDescription,
            version: [1],
            inputs: `={{(${configureNodeInputs_1.configureNodeInputsV1})($parameter.operation)}}`,
            outputs: `={{
		((parameters) => {
			const operation = parameters.operation ?? 'classify';

			if (operation === 'classify') {
				return [{displayName: "Pass", type: "${n8n_workflow_1.NodeConnectionTypes.Main}"}, {displayName: "Fail", type: "${n8n_workflow_1.NodeConnectionTypes.Main}"}]
			}

			return [{ displayName: "", type: "${n8n_workflow_1.NodeConnectionTypes.Main}"}]
		})($parameter)
	}}`,
            defaults: {
                name: 'Guardrails',
            },
            properties: description_1.propertiesDescription,
        };
    }
    async execute() {
        return await execute_1.execute.call(this);
    }
}
exports.GuardrailsV1 = GuardrailsV1;
//# sourceMappingURL=GuardrailsV1.node.js.map