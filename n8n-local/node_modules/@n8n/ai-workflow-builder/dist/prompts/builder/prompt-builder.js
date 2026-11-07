"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptBuilder = void 0;
exports.prompt = prompt;
function hasContentProperty(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'content' in value &&
        typeof value.content === 'string');
}
function defaultExampleFormatter(example) {
    if (typeof example === 'string')
        return example;
    if (hasContentProperty(example))
        return example.content;
    throw new Error('Example must be a string or have a content property. Provide a custom formatter.');
}
function normalizeToTag(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_+/g, '_');
}
function formatSection(name, content, format, customTag) {
    if (format === 'plain') {
        return content;
    }
    if (format === 'markdown') {
        const header = customTag ?? name;
        return `## ${header}\n${content}`;
    }
    const tag = customTag ?? normalizeToTag(name);
    return `<${tag}>\n${content}\n</${tag}>`;
}
function resolveContent(content) {
    if (typeof content === 'function') {
        const result = content();
        if (result === null || result === undefined || result === '') {
            return null;
        }
        return result;
    }
    return content;
}
class PromptBuilder {
    sections = [];
    format;
    separator;
    constructor(options = {}) {
        this.format = options.format ?? 'xml';
        this.separator = options.separator ?? '\n\n';
    }
    section(name, content, options = {}) {
        this.sections.push({
            name,
            content,
            options,
        });
        return this;
    }
    sectionIf(condition, name, content, options = {}) {
        if (condition) {
            this.sections.push({
                name,
                content,
                options,
            });
        }
        return this;
    }
    examples(name, examples, formatter, options = {}) {
        const format = formatter ?? defaultExampleFormatter;
        const content = examples.map(format).join('\n\n');
        return this.section(name, content, options);
    }
    examplesIf(condition, name, examples, formatter, options = {}) {
        if (condition) {
            return this.examples(name, examples, formatter, options);
        }
        return this;
    }
    withExamples(examples, formatter) {
        const lastSection = this.sections.at(-1);
        if (!lastSection) {
            throw new Error('withExamples() must be called after section()');
        }
        if (examples.length === 0) {
            return this;
        }
        const format = formatter ?? defaultExampleFormatter;
        const examplesContent = examples.map(format).join('\n\n');
        const sectionFormat = lastSection.options.format ?? this.format;
        const examplesBlock = sectionFormat === 'plain'
            ? examplesContent
            : sectionFormat === 'markdown'
                ? `## Examples\n${examplesContent}`
                : `<examples>\n${examplesContent}\n</examples>`;
        const originalContent = lastSection.content;
        lastSection.content = () => {
            const resolved = resolveContent(originalContent);
            if (resolved === null)
                return null;
            return `${resolved}\n\n${examplesBlock}`;
        };
        return this;
    }
    merge(other) {
        for (const section of other.sections) {
            this.sections.push({ ...section });
        }
        return this;
    }
    build() {
        const formatted = [];
        for (const section of this.sections) {
            const content = resolveContent(section.content);
            if (content === null) {
                continue;
            }
            const sectionFormat = section.options.format ?? this.format;
            formatted.push(formatSection(section.name, content, sectionFormat, section.options.tag));
        }
        return formatted.join(this.separator);
    }
    buildAsMessageBlocks() {
        const blocks = [];
        for (const section of this.sections) {
            const content = resolveContent(section.content);
            if (content === null) {
                continue;
            }
            const sectionFormat = section.options.format ?? this.format;
            const text = formatSection(section.name, content, sectionFormat, section.options.tag);
            const block = { type: 'text', text };
            if (section.options.cache) {
                block.cache_control = { type: 'ephemeral' };
            }
            blocks.push(block);
        }
        return blocks;
    }
    estimateTokens() {
        const text = this.build();
        if (text === '') {
            return 0;
        }
        return Math.ceil(text.length / 4);
    }
}
exports.PromptBuilder = PromptBuilder;
function prompt(options) {
    return new PromptBuilder(options);
}
//# sourceMappingURL=prompt-builder.js.map