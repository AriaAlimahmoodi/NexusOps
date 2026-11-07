"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptCategorizationTemplate = exports.examplePrompts = void 0;
exports.formatExamplePrompts = formatExamplePrompts;
exports.formatTechniqueList = formatTechniqueList;
const prompts_1 = require("@langchain/core/prompts");
const categorization_1 = require("../../types/categorization");
exports.examplePrompts = [
    {
        prompt: 'Monitor social channels for product mentions and auto-respond with campaign messages',
        techniques: [
            categorization_1.WorkflowTechnique.MONITORING,
            categorization_1.WorkflowTechnique.CHATBOT,
            categorization_1.WorkflowTechnique.CONTENT_GENERATION,
        ],
    },
    {
        prompt: 'Collect partner referral submissions and verify client instances via BigQuery',
        techniques: [categorization_1.WorkflowTechnique.FORM_INPUT, categorization_1.WorkflowTechnique.HUMAN_IN_THE_LOOP],
    },
    {
        prompt: 'Scrape competitor pricing pages weekly and generate a summary report of changes',
        techniques: [
            categorization_1.WorkflowTechnique.SCHEDULING,
            categorization_1.WorkflowTechnique.SCRAPING_AND_RESEARCH,
            categorization_1.WorkflowTechnique.DATA_EXTRACTION,
            categorization_1.WorkflowTechnique.DATA_PERSISTENCE,
            categorization_1.WorkflowTechnique.DATA_ANALYSIS,
        ],
    },
    {
        prompt: 'Process uploaded PDF contracts to extract client details and update CRM records',
        techniques: [
            categorization_1.WorkflowTechnique.DOCUMENT_PROCESSING,
            categorization_1.WorkflowTechnique.DATA_EXTRACTION,
            categorization_1.WorkflowTechnique.DATA_TRANSFORMATION,
            categorization_1.WorkflowTechnique.ENRICHMENT,
        ],
    },
    {
        prompt: 'Build a searchable internal knowledge base from past support tickets',
        techniques: [
            categorization_1.WorkflowTechnique.DATA_TRANSFORMATION,
            categorization_1.WorkflowTechnique.DATA_ANALYSIS,
            categorization_1.WorkflowTechnique.KNOWLEDGE_BASE,
        ],
    },
    {
        prompt: 'Store customer feedback from our webhook for later analysis',
        techniques: [categorization_1.WorkflowTechnique.DATA_PERSISTENCE],
    },
    {
        prompt: 'Collect form submissions and save them to Google Sheets with automatic email notifications',
        techniques: [
            categorization_1.WorkflowTechnique.FORM_INPUT,
            categorization_1.WorkflowTechnique.DATA_PERSISTENCE,
            categorization_1.WorkflowTechnique.NOTIFICATION,
        ],
    },
];
function formatExamplePrompts() {
    return exports.examplePrompts
        .map((example) => `- ${example.prompt} → ${example.techniques.join(',')}`)
        .join('\n');
}
function formatTechniqueList() {
    return Object.entries(categorization_1.TechniqueDescription)
        .map(([key, description]) => `- **${key}**: ${description}`)
        .join('\n');
}
exports.promptCategorizationTemplate = prompts_1.PromptTemplate.fromTemplate(`Analyze the following user prompt and identify the workflow techniques required to fulfill the request.
Be specific and identify all relevant techniques.

<user_prompt>
{userPrompt}
</user_prompt>

<workflow_techniques>
{techniques}
</workflow_techniques>

The following prompt categorization examples show a prompt → techniques involved to provide a sense
of how the categorization should be carried out.
<example_categorization>
${formatExamplePrompts()}
</example_categorization>

Select the techniques that you believe are applicable, but only select them if you are
confident that they are applicable. If the prompt is ambiguous or does not provide an obvious workflow
do not provide any techniques - if confidence is low avoid providing techniques.

Select ALL techniques that apply to this workflow. Most workflows use multiple techniques.
Rate your confidence in this categorization from 0.0 to 1.0.
`);
//# sourceMappingURL=categorization.prompt.js.map