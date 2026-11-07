"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentMapper = exports.INTERACTIVE_CARD_RESUME_JSON_SCHEMA = void 0;
exports.expandSelectsToButtons = expandSelectsToButtons;
exports.componentTextToString = componentTextToString;
const di_1 = require("@n8n/di");
const agent_chat_integration_1 = require("./agent-chat-integration");
const esm_loader_1 = require("./esm-loader");
exports.INTERACTIVE_CARD_RESUME_JSON_SCHEMA = {
    type: 'object',
    properties: {
        type: { type: 'string' },
        id: { type: 'string' },
        value: { type: 'string' },
    },
};
function expandSelectsToButtons(components) {
    const normalized = [];
    for (const c of components) {
        if (c.type === 'select' || c.type === 'radio_select') {
            for (const opt of c.options ?? []) {
                normalized.push({ type: 'button', label: opt.label, value: opt.value });
            }
            continue;
        }
        normalized.push(c);
    }
    return normalized;
}
class ComponentMapper {
    async toCard(payload, runId, toolCallId, resumeSchema, shortenCallback, platform) {
        const sdk = await (0, esm_loader_1.loadChatSdk)();
        const integration = platform ? di_1.Container.get(agent_chat_integration_1.ChatIntegrationRegistry).get(platform) : undefined;
        const components = integration?.normalizeComponents?.(payload.components, {
            runId,
            toolCallId,
            wrapResumeValue: (rawValue) => JSON.stringify(this.wrapValueForSchema(rawValue, resumeSchema)),
        }) ?? payload.components;
        const children = [];
        const buttons = [];
        const buttonIndex = { value: 0 };
        const makeButton = async (label, rawValue, style) => {
            let id = `resume:${runId}:${toolCallId}:${buttonIndex.value++}`;
            let value = JSON.stringify(this.wrapValueForSchema(rawValue, resumeSchema));
            if (shortenCallback) {
                const shortened = await shortenCallback(id, value, label);
                id = shortened.id;
                value = shortened.value;
            }
            return sdk.Button({
                id,
                label,
                ...(isButtonStyle(style) ? { style } : {}),
                value,
            });
        };
        for (const component of components) {
            await this.appendComponent({
                component,
                sdk,
                runId,
                toolCallId,
                children,
                buttons,
                makeButton,
            });
        }
        if (buttons.length > 0) {
            children.push(sdk.Actions(buttons));
        }
        const title = payload.title ?? payload.message;
        return sdk.Card({ title, children: children });
    }
    async appendComponent(ctx) {
        const { component, children, buttons, makeButton } = ctx;
        switch (component.type) {
            case 'button':
                buttons.push(await makeButton(component.label ?? componentTextToString(component.text) ?? 'Action', component.value ?? '', component.style));
                return;
            case 'section':
                await this.appendSection(ctx);
                return;
            case 'divider':
                children.push(ctx.sdk.Divider());
                return;
            case 'image':
                this.appendImage(ctx);
                return;
            case 'context':
                this.appendContext(ctx);
                return;
            case 'select':
                this.appendSelect(ctx);
                return;
            case 'radio_select':
                this.appendRadioSelect(ctx);
                return;
            case 'fields':
                this.appendFields(ctx);
                return;
            default:
                return;
        }
    }
    async appendSection({ component, sdk, children, makeButton, }) {
        const text = componentTextToString(component.text);
        if (text) {
            children.push(sdk.Section([sdk.CardText(text)]));
        }
        if (component.button) {
            children.push(sdk.Actions([
                await makeButton(component.button.label ?? componentTextToString(component.button.text) ?? 'Action', component.button.value, component.button.style),
            ]));
        }
    }
    appendImage({ component, sdk, children }) {
        children.push(sdk.Image({
            url: component.url,
            alt: component.altText ?? 'image',
        }));
    }
    appendContext({ component, sdk, children }) {
        if (component.elements && Array.isArray(component.elements)) {
            for (const el of component.elements) {
                const text = componentTextToString(el.text);
                if (el.type === 'text' && text) {
                    children.push(sdk.CardText(text));
                }
                else if (el.type === 'image' && el.url) {
                    children.push(sdk.Image({ url: el.url, alt: el.altText ?? '' }));
                }
            }
        }
        else {
            const text = componentTextToString(component.text);
            if (!text)
                return;
            children.push(sdk.CardText(text));
        }
    }
    appendSelect({ component, sdk, runId, toolCallId, children, }) {
        children.push(sdk.Actions([
            sdk.Select({
                id: selectComponentId(component, 'select', runId, toolCallId),
                label: component.label ?? 'Select',
                placeholder: component.placeholder,
                options: this.toSelectOptions(component),
            }),
        ]));
    }
    appendRadioSelect({ component, sdk, runId, toolCallId, children, }) {
        children.push(sdk.Actions([
            sdk.RadioSelect({
                id: selectComponentId(component, 'radio', runId, toolCallId),
                label: component.label ?? 'Select',
                options: this.toSelectOptions(component),
            }),
        ]));
    }
    appendFields({ component, sdk, children }) {
        const fields = component.fields ?? component.items ?? [];
        if (fields.length === 0)
            return;
        const fieldElements = fields.map((f) => sdk.Field({ label: f.label, value: f.value }));
        children.push(sdk.Fields(fieldElements));
    }
    toSelectOptions(component) {
        return (component.options ?? []).map((o) => ({
            label: o.label,
            value: o.value,
            description: o.description,
        }));
    }
    wrapValueForSchema(rawValue, resumeSchema) {
        if (!resumeSchema || typeof resumeSchema !== 'object') {
            try {
                const parsed = JSON.parse(rawValue);
                if (typeof parsed === 'object' && parsed !== null)
                    return parsed;
            }
            catch {
            }
            return { value: rawValue };
        }
        const schema = resumeSchema;
        const props = schema.properties ?? {};
        if ('approved' in props) {
            if (rawValue === 'session')
                return { approved: true, scope: 'session' };
            return { approved: rawValue === 'true' };
        }
        if ('type' in props && 'value' in props) {
            return { type: 'button', value: rawValue };
        }
        if ('values' in props) {
            return { values: { action: rawValue } };
        }
        try {
            const parsed = JSON.parse(rawValue);
            if (typeof parsed === 'object' && parsed !== null)
                return parsed;
        }
        catch {
        }
        return { value: rawValue };
    }
    async toCardOrMarkdown(message) {
        if (typeof message === 'string')
            return message;
        if (message && typeof message === 'object' && 'components' in message) {
            const sdk = await (0, esm_loader_1.loadChatSdk)();
            const { components } = message;
            const children = [];
            for (const c of components) {
                this.appendMarkdownChild(c, sdk, children);
            }
            return sdk.Card({ children: children });
        }
        return String(message);
    }
    appendMarkdownChild(c, sdk, children) {
        switch (c.type) {
            case 'section':
                {
                    const text = componentTextToString(c.text);
                    if (text)
                        children.push(sdk.Section([sdk.CardText(text)]));
                }
                return;
            case 'divider':
                children.push(sdk.Divider());
                return;
            case 'image':
                if (c.url)
                    children.push(sdk.Image({ url: c.url, alt: c.altText ?? '' }));
                return;
            case 'context':
                this.appendMarkdownContext(c, sdk, children);
                return;
            default:
                {
                    const text = componentTextToString(c.text);
                    if (text)
                        children.push(sdk.CardText(text));
                }
                return;
        }
    }
    appendMarkdownContext(c, sdk, children) {
        if (c.elements) {
            for (const el of c.elements) {
                const text = componentTextToString(el.text);
                if (el.type === 'text' && text) {
                    children.push(sdk.CardText(text));
                }
                else if (el.type === 'image' && el.url) {
                    children.push(sdk.Image({ url: el.url, alt: el.altText ?? '' }));
                }
            }
        }
        else {
            const text = componentTextToString(c.text);
            if (text)
                children.push(sdk.CardText(text));
        }
    }
}
exports.ComponentMapper = ComponentMapper;
function componentTextToString(text) {
    if (typeof text === 'string')
        return text;
    if (text && typeof text === 'object' && 'text' in text) {
        const value = text.text;
        if (typeof value === 'string')
            return value;
    }
    return undefined;
}
function isButtonStyle(style) {
    return style === 'primary' || style === 'danger' || style === 'default';
}
function selectComponentId(component, kind, runId, toolCallId) {
    const generatedResumePrefix = `resume:${runId}:${toolCallId}:`;
    if (component.id?.startsWith(generatedResumePrefix) &&
        /^\d+$/.test(component.id.slice(generatedResumePrefix.length))) {
        return component.id;
    }
    return `ri-sel:${component.id ?? kind}:${runId}:${toolCallId}`;
}
//# sourceMappingURL=component-mapper.js.map