"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKFLOW_TEST_REQUEST_CLOSE_TAG = exports.WORKFLOW_TEST_REQUEST_OPEN_TAG = exports.WORKFLOW_SETUP_STATE_CLOSE_TAG = exports.WORKFLOW_SETUP_STATE_OPEN_TAG = exports.INSTANCE_URLS_CLOSE_TAG = exports.INSTANCE_URLS_OPEN_TAG = exports.PAST_CONVERSATIONS_CLOSE_TAG = exports.PAST_CONVERSATIONS_OPEN_TAG = exports.PROJECT_CONTEXT_CLOSE_TAG = exports.PROJECT_CONTEXT_OPEN_TAG = exports.THREAD_ARTIFACTS_CLOSE_TAG = exports.THREAD_ARTIFACTS_OPEN_TAG = exports.THREAD_CONTEXT_CLOSE_TAG = exports.THREAD_CONTEXT_OPEN_TAG = exports.INSTANCE_CONTEXT_CLOSE_TAG = exports.INSTANCE_CONTEXT_OPEN_TAG = exports.AGENT_PREVIEW_CONTEXT_CLOSE_TAG = exports.AGENT_PREVIEW_CONTEXT_OPEN_TAG = exports.CREDENTIAL_CONTEXT_CLOSE_TAG = exports.CREDENTIAL_CONTEXT_OPEN_TAG = exports.EDITOR_CONTEXT_CLOSE_TAG = exports.EDITOR_CONTEXT_OPEN_TAG = exports.AUTO_FOLLOW_UP_MESSAGE = void 0;
exports.buildWorkflowTestRequestBlock = buildWorkflowTestRequestBlock;
exports.buildCurrentDateTimeBlock = buildCurrentDateTimeBlock;
exports.buildProjectContextBlock = buildProjectContextBlock;
exports.buildPastConversationsBlock = buildPastConversationsBlock;
exports.buildInstanceUrlsBlock = buildInstanceUrlsBlock;
exports.asStoredThreadContextSection = asStoredThreadContextSection;
exports.buildThreadContextBlock = buildThreadContextBlock;
exports.withCurrentDateTime = withCurrentDateTime;
exports.withProjectContext = withProjectContext;
exports.withPastConversations = withPastConversations;
exports.withAiPreferences = withAiPreferences;
exports.extractAiPreferencesBlock = extractAiPreferencesBlock;
exports.extractThreadArtifactsBlock = extractThreadArtifactsBlock;
exports.sanitisePromptText = sanitisePromptText;
exports.buildOnboardingSkillBlock = buildOnboardingSkillBlock;
exports.buildOnboardingAnswerMessage = buildOnboardingAnswerMessage;
exports.getProjectContextSection = getProjectContextSection;
exports.cleanStoredUserMessage = cleanStoredUserMessage;
exports.extractEditorContextResourceAttachments = extractEditorContextResourceAttachments;
exports.extractAgentPreviewHandoffContext = extractAgentPreviewHandoffContext;
exports.buildThreadArtifactsBlock = buildThreadArtifactsBlock;
const api_types_1 = require("@n8n/api-types");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
exports.AUTO_FOLLOW_UP_MESSAGE = '(continue)';
exports.EDITOR_CONTEXT_OPEN_TAG = '<editor-context>';
exports.EDITOR_CONTEXT_CLOSE_TAG = '</editor-context>';
exports.CREDENTIAL_CONTEXT_OPEN_TAG = '<credential-context>';
exports.CREDENTIAL_CONTEXT_CLOSE_TAG = '</credential-context>';
exports.AGENT_PREVIEW_CONTEXT_OPEN_TAG = '<agent-preview-context>';
exports.AGENT_PREVIEW_CONTEXT_CLOSE_TAG = '</agent-preview-context>';
exports.INSTANCE_CONTEXT_OPEN_TAG = '<instance-context>';
exports.INSTANCE_CONTEXT_CLOSE_TAG = '</instance-context>';
exports.THREAD_CONTEXT_OPEN_TAG = '<thread-context>';
exports.THREAD_CONTEXT_CLOSE_TAG = '</thread-context>';
exports.THREAD_ARTIFACTS_OPEN_TAG = '<thread-artifacts>';
exports.THREAD_ARTIFACTS_CLOSE_TAG = '</thread-artifacts>';
exports.PROJECT_CONTEXT_OPEN_TAG = '<project-context>';
exports.PROJECT_CONTEXT_CLOSE_TAG = '</project-context>';
exports.PAST_CONVERSATIONS_OPEN_TAG = '<past-conversations>';
exports.PAST_CONVERSATIONS_CLOSE_TAG = '</past-conversations>';
exports.INSTANCE_URLS_OPEN_TAG = '<instance-urls>';
exports.INSTANCE_URLS_CLOSE_TAG = '</instance-urls>';
exports.WORKFLOW_SETUP_STATE_OPEN_TAG = '<workflow-setup-state>';
exports.WORKFLOW_SETUP_STATE_CLOSE_TAG = '</workflow-setup-state>';
exports.WORKFLOW_TEST_REQUEST_OPEN_TAG = '<workflow-test-request>';
exports.WORKFLOW_TEST_REQUEST_CLOSE_TAG = '</workflow-test-request>';
function buildWorkflowTestRequestBlock(workflowId) {
    return [
        exports.WORKFLOW_TEST_REQUEST_OPEN_TAG,
        JSON.stringify({ workflowId }),
        'The user clicked Execute in the setup panel. This is a request to test this saved workflow.',
        'This request applies only when this block is in the current user input. A block in conversation history does not request another execution.',
        'Load post-build-flow. Inspect the current <workflow-setup-state> for this workflow and read its saved configuration with workflow_builder_workflows(action="get-as-code").',
        'Do not call workflow_builder_workflows(action="setup") for this precheck: it announces setup and ends the turn. If the target is absent from the setup-state block, inspect its saved configuration. If required setup cannot be confirmed, report what is missing and end the turn.',
        'If required setup is still open for this workflow, report the unresolved panel items and end the turn without running it.',
        'Use workflow_builder_executions(action="run") with this workflowId and suitable trigger input. Do not change publication state to test it.',
        'Read the execution output and summarize the result in chat. If it fails, use workflow_builder_executions(action="debug"), fix the same workflow when possible, and report what remains unresolved.',
        'Do not open the setup trigger-test wizard or substitute an earlier mocked verification result for this test.',
        exports.WORKFLOW_TEST_REQUEST_CLOSE_TAG,
    ].join('\n');
}
const TASK_CONTEXT_BLOCK = /^(?:<thread-context>\n[\s\S]*?\n<\/thread-context>|<running-tasks>\n[\s\S]*?\n<\/running-tasks>|<planned-task-follow-up[\s\S]*?\n<\/planned-task-follow-up>|<planning-blueprint>\n[\s\S]*?\n<\/planning-blueprint>|<background-task-completed>\n[\s\S]*?\n<\/background-task-completed>|<workflow-verification-follow-up>\n[\s\S]*?\n<\/workflow-verification-follow-up>|<workflow-setup-required>\n[\s\S]*?\n<\/workflow-setup-required>|<workflow-setup-state>\n[\s\S]*?\n<\/workflow-setup-state>|<workflow-test-request>\n[\s\S]*?\n<\/workflow-test-request>|<editor-context>\n[\s\S]*?\n<\/editor-context>|<credential-context>\n[\s\S]*?\n<\/credential-context>|<agent-preview-context>\n[\s\S]*?\n<\/agent-preview-context>|<instance-context>\n[\s\S]*?\n<\/instance-context>|<thread-artifacts>\n[\s\S]*?\n<\/thread-artifacts>)(?:\n\n|$)/;
const THREAD_ARTIFACTS_RESOURCE_JSON = /^<thread-context>\n(?:<instance-context>\n[\s\S]*?\n<\/instance-context>\n\n)?<thread-artifacts>\n(\[[\s\S]*?\])\n/;
const EDITOR_CONTEXT_JSON = /^<editor-context>\n(\[[\s\S]*?\])\n/;
const AGENT_PREVIEW_CONTEXT_JSON = /^<agent-preview-context>\n(\{[\s\S]*?\})\n/;
function trailingBlockRegex(tag) {
    return new RegExp(`(?<!\\n)\\n*<${tag}>(?:(?!<${tag}>)[\\s\\S])*?</${tag}>\\s*$`);
}
const TRAILING_CONTEXT_BLOCKS = [
    'current-date-time',
    'project-context',
    'past-conversations',
    'ai-preferences',
    'onboarding-answer',
].map(trailingBlockRegex);
function stripTrailingContextBlocks(message) {
    let text = message;
    const unstripped = new Set(TRAILING_CONTEXT_BLOCKS);
    let stripped;
    do {
        stripped = false;
        for (const block of unstripped) {
            const next = text.replace(block, '');
            if (next === text)
                continue;
            text = next;
            unstripped.delete(block);
            stripped = true;
            break;
        }
    } while (stripped);
    return text;
}
function buildCurrentDateTimeBlock(dateTimeSection) {
    return `<current-date-time>\n${dateTimeSection.trim()}\n</current-date-time>`;
}
function buildProjectContextBlock(projectSection) {
    return `${exports.PROJECT_CONTEXT_OPEN_TAG}\n${projectSection}\n${exports.PROJECT_CONTEXT_CLOSE_TAG}`;
}
function buildPastConversationsBlock(section) {
    return `${exports.PAST_CONVERSATIONS_OPEN_TAG}\n${section}\n${exports.PAST_CONVERSATIONS_CLOSE_TAG}`;
}
function buildInstanceUrlsBlock(urls) {
    return [
        exports.INSTANCE_URLS_OPEN_TAG,
        `Webhook base URL: ${urls.webhookBaseUrl}`,
        `Form base URL: ${urls.formBaseUrl}`,
        exports.INSTANCE_URLS_CLOSE_TAG,
    ].join('\n');
}
function asStoredThreadContextSection(section) {
    return section.trim().replaceAll(exports.THREAD_CONTEXT_CLOSE_TAG, '&lt;/thread-context&gt;');
}
function buildThreadContextBlock(sections) {
    const parts = sections
        .map((section) => section?.trim())
        .filter((section) => Boolean(section))
        .map(asStoredThreadContextSection);
    if (parts.length === 0)
        return '';
    return `${exports.THREAD_CONTEXT_OPEN_TAG}\n${parts.join('\n\n')}\n${exports.THREAD_CONTEXT_CLOSE_TAG}`;
}
function withCurrentDateTime(message, dateTimeSection) {
    return `${message}\n\n${buildCurrentDateTimeBlock(dateTimeSection)}`;
}
function withProjectContext(message, projectSection) {
    return `${message}\n\n${buildProjectContextBlock(projectSection)}`;
}
function withPastConversations(message, section) {
    return `${message}\n\n${buildPastConversationsBlock(section)}`;
}
function withAiPreferences(message, block) {
    return `${message}\n\n${block}`;
}
const AI_PREFERENCES_BLOCK = /<ai-preferences>\n[\s\S]*?\n<\/ai-preferences>/;
function extractAiPreferencesBlock(stored) {
    const threadContext = leadingInternalBlocks(stored).find((block) => block.startsWith(exports.THREAD_CONTEXT_OPEN_TAG));
    return threadContext ? AI_PREFERENCES_BLOCK.exec(threadContext)?.[0] : undefined;
}
const PREVIEW_TABS_HEADER = 'Tabs the user has open in this conversation’s preview, as of this message:';
const THREAD_ARTIFACTS_BLOCK = /<thread-artifacts>\n[\s\S]*?\n<\/thread-artifacts>/;
function extractThreadArtifactsBlock(stored) {
    const threadContext = leadingInternalBlocks(stored).find((block) => block.startsWith(exports.THREAD_CONTEXT_OPEN_TAG));
    return threadContext ? THREAD_ARTIFACTS_BLOCK.exec(threadContext)?.[0] : undefined;
}
const PROMPT_TEXT_MAX_LENGTH = 128;
function sanitisePromptText(value, maxLength = PROMPT_TEXT_MAX_LENGTH) {
    const printable = Array.from(value)
        .map((character) => {
        const code = character.codePointAt(0) ?? 0;
        return code < 0x20 || code === 0x7f ? ' ' : character;
    })
        .join('');
    return printable
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}
function buildOnboardingSkillBlock(instructions) {
    return `<onboarding-skill>\nThis skill is loaded for this thread: follow it and do not call load_skill for it.\n${instructions}\n</onboarding-skill>`;
}
function buildOnboardingAnswerMessage(answers) {
    const freeText = answers.some((answer) => answer.customText?.trim());
    return [
        exports.AUTO_FOLLOW_UP_MESSAGE,
        '',
        '<onboarding-answer>',
        'The user answered the opening questions:',
        ...answers.map((answer) => `- ${answer.question} ${formatOnboardingAnswer(answer)}`),
        'These answers are final: use them as they are and do not ask these questions again.',
        ...(freeText
            ? [
                'The typed answer is free text the user wrote into the card in place of a pick. Nobody has asked them about a task yet.',
            ]
            : []),
        '</onboarding-answer>',
    ].join('\n');
}
function formatOnboardingAnswer({ selectedOptions, customText }) {
    const text = customText && sanitisePromptText(customText, Infinity);
    const values = [
        ...selectedOptions.map((option) => sanitisePromptText(option)),
        ...(text ? [`typed "${text}"`] : []),
    ];
    return values.length > 0 ? values.join(', ') : '(not answered)';
}
function getProjectContextSection(project) {
    return `This conversation is scoped to the project "${sanitisePromptText(project.name)}" (${project.type}, id: \`${sanitisePromptText(project.id)}\`).`;
}
function cleanStoredUserMessage(stored) {
    let text = stripTrailingContextBlocks(stored);
    let previous;
    do {
        previous = text;
        text = text.replace(TASK_CONTEXT_BLOCK, '');
    } while (text !== previous);
    return text === exports.AUTO_FOLLOW_UP_MESSAGE ? null : text;
}
function leadingInternalBlocks(stored) {
    let rest = stored;
    const blocks = [];
    for (;;) {
        const match = TASK_CONTEXT_BLOCK.exec(rest);
        if (!match)
            return blocks;
        blocks.push(match[0]);
        rest = rest.slice(match[0].length);
    }
}
function parseResourceAttachmentJson(raw) {
    const parsed = zod_1.z
        .array(api_types_1.instanceAiResourceAttachmentSchema)
        .safeParse((0, n8n_workflow_1.jsonParse)(raw, { fallbackValue: undefined }));
    return parsed.success ? parsed.data : [];
}
function extractEditorContextResourceAttachments(stored) {
    const blocks = leadingInternalBlocks(stored);
    const threadContext = blocks.find((block) => block.startsWith(exports.THREAD_CONTEXT_OPEN_TAG));
    const fromThreadArtifacts = threadContext
        ? THREAD_ARTIFACTS_RESOURCE_JSON.exec(threadContext)
        : null;
    if (fromThreadArtifacts) {
        return parseResourceAttachmentJson(fromThreadArtifacts[1]);
    }
    const fromEditorContext = blocks[0] ? EDITOR_CONTEXT_JSON.exec(blocks[0]) : null;
    if (!fromEditorContext)
        return [];
    return parseResourceAttachmentJson(fromEditorContext[1]);
}
function extractAgentPreviewHandoffContext(stored) {
    const match = AGENT_PREVIEW_CONTEXT_JSON.exec(stored);
    if (!match)
        return undefined;
    const parsed = api_types_1.instanceAiAgentPreviewHandoffContextSchema.safeParse((0, n8n_workflow_1.jsonParse)(match[1], { fallbackValue: undefined }));
    return parsed.success ? parsed.data : undefined;
}
const THREAD_ARTIFACT_KIND = {
    workflow: 'Workflow',
    agent: 'Agent',
    'data-table': 'Data table',
};
function formatThreadArtifactLine(artifact, current, executionId) {
    const pendingAgent = artifact.type === 'agent' && artifact.pending;
    const kind = pendingAgent ? 'New unsaved Agent' : THREAD_ARTIFACT_KIND[artifact.type];
    const name = artifact.name ? ` "${sanitisePromptText(artifact.name)}"` : '';
    const idLabel = pendingAgent ? 'pending id' : 'id';
    const project = artifact.projectId
        ? `, in project \`${sanitisePromptText(artifact.projectId)}\``
        : '';
    const flags = [current ? 'current' : '', artifact.archived ? 'archived' : '']
        .filter(Boolean)
        .join(', ');
    const flagSuffix = flags ? ` [${flags}]` : '';
    const execution = artifact.type === 'workflow' && executionId
        ? `, currently viewing its execution \`${sanitisePromptText(executionId)}\``
        : '';
    return `  - ${kind}${name} (${idLabel}: \`${sanitisePromptText(artifact.id)}\`${project})${flagSuffix}${execution}`;
}
function buildNodesAttachmentLine(attachment) {
    const label = (ref) => sanitisePromptText(ref.name ?? ref.id);
    const setLines = attachment.sets.map((set) => {
        const names = set.nodes.map(label);
        const head = names.length === 1
            ? `Node "${names[0]}"`
            : `A chain of connected nodes: ${names.join(' → ')}`;
        const input = set.inputNode ? `, receiving input from "${label(set.inputNode)}"` : '';
        const output = set.outputNode ? `, sending output to "${label(set.outputNode)}"` : '';
        const group = set.canvasGroupName
            ? `, part of canvas group "${sanitisePromptText(set.canvasGroupName)}"`
            : set.canvasGroupId
                ? `, part of canvas group \`${sanitisePromptText(set.canvasGroupId)}\``
                : '';
        return `    - ${head}${input}${output}${group}.`;
    });
    const hasBoundary = attachment.sets.some((set) => set.inputNode ?? set.outputNode);
    const boundaryNote = hasBoundary
        ? '\n  The "receiving input from"/"sending output to" nodes show only where the selection connects; they are not part of the selection. Do not describe, inspect, or make claims about them — scope your answer to the selected nodes.'
        : '';
    return `  - Selected nodes in workflow \`${sanitisePromptText(attachment.workflowId)}\`:\n${setLines.join('\n')}${boundaryNote}`;
}
function toTagSafeJson(value) {
    return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}
function attachmentToThreadArtifact(attachment) {
    return {
        type: attachment.type,
        id: attachment.id,
        ...(attachment.name ? { name: attachment.name } : {}),
        ...(attachment.type === 'agent' ? { projectId: attachment.projectId } : {}),
        ...(attachment.type === 'agent' && attachment.pending ? { pending: true } : {}),
    };
}
function buildThreadArtifactsBlock(context, resourceAttachments = []) {
    const previewArtifacts = [...(context?.artifacts ?? [])].sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`));
    if (previewArtifacts.length === 0 && resourceAttachments.length === 0) {
        return context
            ? `${exports.THREAD_ARTIFACTS_OPEN_TAG}\nThe user has no tabs open in this conversation’s preview.\n${exports.THREAD_ARTIFACTS_CLOSE_TAG}`
            : '';
    }
    const executionByWorkflowId = new Map();
    for (const attachment of resourceAttachments) {
        if (attachment.type === 'workflow' && attachment.executionId) {
            executionByWorkflowId.set(attachment.id, attachment.executionId);
        }
    }
    const activeId = context?.activeId && previewArtifacts.some((artifact) => artifact.id === context.activeId)
        ? context.activeId
        : undefined;
    const previewLines = previewArtifacts.map((artifact) => formatThreadArtifactLine(artifact, artifact.id === activeId, executionByWorkflowId.get(artifact.id)));
    const listedKeys = new Set(previewArtifacts.map((artifact) => `${artifact.type}:${artifact.id}`));
    const handoffLines = [];
    for (const attachment of resourceAttachments) {
        if (attachment.type === 'nodes') {
            handoffLines.push(buildNodesAttachmentLine(attachment));
            continue;
        }
        if (listedKeys.has(`${attachment.type}:${attachment.id}`))
            continue;
        handoffLines.push(formatThreadArtifactLine(attachmentToThreadArtifact(attachment), false, attachment.type === 'workflow' ? attachment.executionId : undefined));
    }
    const pendingAgentGuidance = resourceAttachments.some((attachment) => attachment.type === 'agent' && attachment.pending)
        ? "Treat references such as “the agent” as this pending artifact. It has no persisted agent row yet. When the user asks to build or change it, call `agent_builder_select_agent` with a name to create it. If a different Agent is already bound, also pass `createNew: true`. Do not pass its pending id as an existing `agentId`. The thread's pending target will make creation reuse that id."
        : '';
    const currentGuidance = activeId
        ? 'Treat “this workflow”, “the agent”, “the data table”, or “it” as the item marked current.'
        : 'When the user refers to an artifact in this conversation, match it against this list.';
    const inspectGuidance = 'Use these ids when you act on the user’s request. Do not inspect, run, or describe their contents beyond what that request needs.';
    const prose = [
        ...(previewLines.length > 0 ? [PREVIEW_TABS_HEADER, ...previewLines] : []),
        ...(handoffLines.length > 0
            ? [
                'The user opened this conversation from the editor, where they are looking at:',
                ...handoffLines,
            ]
            : []),
        currentGuidance,
        pendingAgentGuidance,
        inspectGuidance,
    ]
        .filter(Boolean)
        .join('\n');
    const durableJson = resourceAttachments.length > 0 ? `${toTagSafeJson(resourceAttachments)}\n\n` : '';
    return `${exports.THREAD_ARTIFACTS_OPEN_TAG}\n${durableJson}${prose}\n${exports.THREAD_ARTIFACTS_CLOSE_TAG}`;
}
//# sourceMappingURL=internal-messages.js.map