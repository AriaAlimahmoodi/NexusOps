"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configSkill = configSkill;
const config_mutation_prompt_1 = require("../prompts/config-mutation.prompt");
function configSkill() {
    return {
        id: 'agent-builder-config',
        name: 'Agent Builder Config',
        description: 'Load before the first agent_builder_write_config or agent_builder_patch_config call in a conversation. Contains the Agent config rules, the config schema reference, and recipes for config writes.',
        recommendedTools: ['agent-context', 'agent_builder_write_config', 'agent_builder_patch_config'],
        instructions: (0, config_mutation_prompt_1.getConfigMutationPrompt)(),
    };
}
//# sourceMappingURL=config.skill.js.map