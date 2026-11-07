"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KNOWLEDGE_FILES_DIR_UNAVAILABLE_EXIT_CODE = exports.MIRROR_SYNC_TIMEOUT_SECONDS = void 0;
exports.buildSearchKnowledgeCommand = buildSearchKnowledgeCommand;
exports.estimateSearchOutputLimit = estimateSearchOutputLimit;
exports.getSearchContextWindow = getSearchContextWindow;
exports.buildReadKnowledgeCommand = buildReadKnowledgeCommand;
exports.parseRipgrepOutput = parseRipgrepOutput;
exports.parseRipgrepFilesOutput = parseRipgrepFilesOutput;
exports.parseRipgrepCountOutput = parseRipgrepCountOutput;
exports.parseReadKnowledgeOutput = parseReadKnowledgeOutput;
exports.buildScopedKnowledgeShellCommand = buildScopedKnowledgeShellCommand;
exports.buildMirrorFinalizeCommand = buildMirrorFinalizeCommand;
const redact_text_1 = require("@n8n/utils/redaction/redact-text");
const node_buffer_1 = require("node:buffer");
const zod_1 = require("zod");
const agent_knowledge_retrieval_1 = require("./agent-knowledge-retrieval");
const agent_knowledge_storage_1 = require("./agent-knowledge-storage");
const COMMAND_TIMEOUT_SECONDS = 20;
exports.MIRROR_SYNC_TIMEOUT_SECONDS = 120;
const SEARCH_OUTPUT_TRUNCATED_MARKER = '__N8N_SEARCH_OUTPUT_TRUNCATED__';
const READ_OUTPUT_TRUNCATED_MARKER = '__N8N_READ_OUTPUT_TRUNCATED__';
const SEARCH_JSON_EVENT_OVERHEAD_CHARS = 1_500;
const MAX_SEARCH_OPERATION_OUTPUT_CHARS = 500_000;
exports.KNOWLEDGE_FILES_DIR_UNAVAILABLE_EXIT_CODE = 3;
const ripgrepEncodedTextSchema = zod_1.z
    .object({
    text: zod_1.z.string().optional(),
    bytes: zod_1.z.string().optional(),
})
    .passthrough();
const ripgrepContentDataSchema = zod_1.z
    .object({
    path: ripgrepEncodedTextSchema,
    lines: ripgrepEncodedTextSchema,
    line_number: zod_1.z.number().int(),
})
    .passthrough();
const ripgrepJsonEventSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({ type: zod_1.z.literal('match'), data: ripgrepContentDataSchema }).passthrough(),
    zod_1.z.object({ type: zod_1.z.literal('context'), data: ripgrepContentDataSchema }).passthrough(),
    zod_1.z.object({ type: zod_1.z.literal('begin') }).passthrough(),
    zod_1.z.object({ type: zod_1.z.literal('end') }).passthrough(),
    zod_1.z.object({ type: zod_1.z.literal('summary') }).passthrough(),
]);
function buildSearchKnowledgeCommand(request, scopedFiles) {
    const outputMode = request.output_mode ?? 'content';
    const resultLimit = (request.head_limit ?? agent_knowledge_retrieval_1.DEFAULT_SEARCH_TEXT_LIMIT) + 1;
    const targets = scopedFiles.length > 0 ? scopedFiles.map((file) => quoteShellArg(`./${file}`)) : ['.'];
    const baseCommand = [
        'timeout',
        String(COMMAND_TIMEOUT_SECONDS),
        'rg',
        ...(request['-i'] === false ? [] : ['--ignore-case']),
        '--color=never',
        '--hidden',
        '--text',
    ];
    if (outputMode === 'files_with_matches') {
        const rgCommand = [
            ...baseCommand,
            '--files-with-matches',
            '-e',
            quoteShellArg(request.pattern),
            '--',
            ...targets,
        ];
        return buildLineLimitedPipeline(rgCommand.join(' '), resultLimit);
    }
    if (outputMode === 'count') {
        const rgCommand = [
            ...baseCommand,
            '--count-matches',
            '--with-filename',
            '-e',
            quoteShellArg(request.pattern),
            '--',
            ...targets,
        ];
        return buildLineLimitedPipeline(rgCommand.join(' '), resultLimit);
    }
    const outputLimit = estimateSearchOutputLimit(request, resultLimit);
    const contextArgs = buildSearchContextArgs(request);
    const rgCommand = [
        ...baseCommand,
        '--json',
        '--line-number',
        '--with-filename',
        ...contextArgs,
        '-e',
        quoteShellArg(request.pattern),
        '--',
        ...targets,
    ];
    return buildJsonMatchLimitedPipeline(rgCommand.join(' '), resultLimit, outputLimit);
}
function estimateSearchOutputLimit(request, matchLimit) {
    const contextWindow = getSearchContextWindow(request);
    const linesPerMatch = 1 + contextWindow.before + contextWindow.after;
    const estimatedOutput = matchLimit * linesPerMatch * (agent_knowledge_retrieval_1.MAX_SEARCH_LINE_CHARS + SEARCH_JSON_EVENT_OVERHEAD_CHARS);
    return Math.min(MAX_SEARCH_OPERATION_OUTPUT_CHARS, Math.max(agent_knowledge_retrieval_1.MAX_OPERATION_OUTPUT_CHARS, estimatedOutput));
}
function getSearchContextWindow(request) {
    const symmetricContext = request['-C'] ?? 0;
    return {
        before: symmetricContext,
        after: symmetricContext,
    };
}
function buildReadKnowledgeCommand(file, request) {
    const emitLineScript = [
        'function emit(i) {',
        'line = i "\\t" NR "\\t" $0 "\\n";',
        `if (total + length(line) > ${agent_knowledge_retrieval_1.MAX_OPERATION_OUTPUT_CHARS}) { print "${READ_OUTPUT_TRUNCATED_MARKER}"; exit; }`,
        'printf "%s", line;',
        'total += length(line);',
        '}',
    ].join(' ');
    if (!request.ranges) {
        const script = [emitLineScript, '{ emit(0) }'].join(' ');
        return `awk ${quoteShellArg(script)} ${quoteShellArg(`./${file}`)}`;
    }
    const maxEndLine = Math.max(...request.ranges.map((range) => range.endLine));
    const script = [
        emitLineScript,
        ...request.ranges.map((range, index) => `NR >= ${range.startLine} && NR <= ${range.endLine} { emit(${index}) }`),
        `NR > ${maxEndLine} { exit }`,
    ].join(' ');
    return `awk ${quoteShellArg(script)} ${quoteShellArg(`./${file}`)}`;
}
function parseRipgrepOutput(output, filesByPath, contextWindow = { before: 0, after: 0 }) {
    const matches = [];
    const contextByFile = new Map();
    let incomplete = false;
    for (const line of output.split(/\r?\n/)) {
        if (!line)
            continue;
        if (line === SEARCH_OUTPUT_TRUNCATED_MARKER) {
            incomplete = true;
            break;
        }
        const parsedEvent = parseRipgrepJsonEvent(line);
        if (parsedEvent === undefined) {
            incomplete = true;
            continue;
        }
        if (isIgnoredRipgrepEvent(parsedEvent))
            continue;
        const parsedLine = parsedEvent.type === 'match'
            ? parseRipgrepMatchEvent(parsedEvent)
            : parseRipgrepContextEvent(parsedEvent);
        if (parsedLine === undefined) {
            incomplete = true;
            continue;
        }
        if (parsedLine === null)
            continue;
        const file = filesByPath.get(normalizeRipgrepPath(parsedLine.filePath));
        if (!file) {
            continue;
        }
        const truncatedText = sanitizeKnowledgeOutputText(parsedLine.text, agent_knowledge_retrieval_1.MAX_SEARCH_LINE_CHARS);
        const fileContext = getContextLineMap(contextByFile, file.file);
        fileContext.set(parsedLine.lineNumber, { text: truncatedText.text });
        if (parsedLine.matched) {
            matches.push({
                file: file.file,
                fileId: file.fileId,
                displayName: file.displayName,
                lineNumber: parsedLine.lineNumber,
                text: truncatedText.text,
                textTruncated: truncatedText.truncated,
            });
        }
    }
    if (hasSearchContext(contextWindow)) {
        for (const match of matches) {
            const context = buildSearchMatchContext(contextByFile.get(match.file), match.lineNumber, contextWindow);
            if (context.length > 0) {
                match.context = context;
            }
        }
    }
    return { matches, incomplete };
}
function parseRipgrepFilesOutput(output, filesByPath) {
    const files = [];
    const seenFiles = new Set();
    let incomplete = false;
    for (const line of output.split(/\r?\n/)) {
        if (!line)
            continue;
        if (line === SEARCH_OUTPUT_TRUNCATED_MARKER) {
            incomplete = true;
            break;
        }
        const file = filesByPath.get(normalizeRipgrepPath(line));
        if (!file || seenFiles.has(file.file))
            continue;
        seenFiles.add(file.file);
        files.push(file);
    }
    return { files, incomplete };
}
function parseRipgrepCountOutput(output, filesByPath) {
    const counts = [];
    let incomplete = false;
    for (const line of output.split(/\r?\n/)) {
        if (!line)
            continue;
        if (line === SEARCH_OUTPUT_TRUNCATED_MARKER) {
            incomplete = true;
            break;
        }
        const separatorIndex = line.lastIndexOf(':');
        if (separatorIndex === -1) {
            incomplete = true;
            continue;
        }
        const filePath = line.slice(0, separatorIndex);
        const count = Number(line.slice(separatorIndex + 1));
        if (!Number.isInteger(count) || count < 0) {
            incomplete = true;
            continue;
        }
        const file = filesByPath.get(normalizeRipgrepPath(filePath));
        if (!file)
            continue;
        counts.push({
            file: file.file,
            fileId: file.fileId,
            displayName: file.displayName,
            count,
        });
    }
    return { counts, incomplete };
}
function parseReadKnowledgeOutput(output, file, request) {
    const isWholeFileRead = !request.ranges;
    const requestedRanges = request.ranges ?? [{ startLine: 1, endLine: 0 }];
    const ranges = requestedRanges.map((range) => ({
        startLine: range.startLine,
        endLine: range.endLine,
        text: '',
        citation: {
            file: file.file,
            fileId: file.fileId,
            displayName: file.displayName,
            startLine: range.startLine,
            endLine: range.endLine,
        },
    }));
    let truncatedOutput = false;
    for (const line of output.split(/\r?\n/)) {
        if (!line)
            continue;
        if (line === READ_OUTPUT_TRUNCATED_MARKER) {
            truncatedOutput = true;
            break;
        }
        const [rangeIndexText, lineNumberText, ...textParts] = line.split('\t');
        const rangeIndex = Number(rangeIndexText);
        const lineNumber = Number(lineNumberText);
        if (!Number.isInteger(rangeIndex) || !Number.isInteger(lineNumber) || !ranges[rangeIndex]) {
            continue;
        }
        const truncated = sanitizeKnowledgeOutputText(textParts.join('\t'), agent_knowledge_retrieval_1.MAX_READ_LINE_CHARS);
        const range = ranges[rangeIndex];
        if (isWholeFileRead) {
            range.endLine = lineNumber;
            range.citation.endLine = lineNumber;
        }
        const outputLine = `${lineNumber}|${truncated.text}`;
        range.text = range.text ? `${range.text}\n${outputLine}` : outputLine;
    }
    return { ranges, truncated: truncatedOutput };
}
function getContextLineMap(contextByFile, file) {
    let context = contextByFile.get(file);
    if (!context) {
        context = new Map();
        contextByFile.set(file, context);
    }
    return context;
}
function buildSearchMatchContext(linesByNumber, matchLineNumber, contextWindow) {
    if (!linesByNumber)
        return [];
    const context = [];
    const startLine = Math.max(1, matchLineNumber - contextWindow.before);
    const endLine = matchLineNumber + contextWindow.after;
    for (let lineNumber = startLine; lineNumber <= endLine; lineNumber++) {
        const line = linesByNumber.get(lineNumber);
        if (!line)
            continue;
        context.push({
            lineNumber,
            text: line.text,
            matched: lineNumber === matchLineNumber,
        });
    }
    return context;
}
function hasSearchContext(contextWindow) {
    return contextWindow.before > 0 || contextWindow.after > 0;
}
function buildSearchContextArgs(request) {
    const contextLines = request['-C'] ?? 0;
    return contextLines > 0 ? ['--context', String(contextLines)] : [];
}
function parseRipgrepJsonEvent(line) {
    let parsed;
    try {
        parsed = JSON.parse(line);
    }
    catch {
        return undefined;
    }
    const event = ripgrepJsonEventSchema.safeParse(parsed);
    return event.success ? event.data : undefined;
}
function isIgnoredRipgrepEvent(event) {
    return event.type === 'begin' || event.type === 'end' || event.type === 'summary';
}
function parseRipgrepMatchEvent(event) {
    if (event.type !== 'match')
        return null;
    const parsed = parseRipgrepContentEvent(event);
    return parsed ? { ...parsed, matched: true } : parsed;
}
function parseRipgrepContextEvent(event) {
    if (event.type !== 'context')
        return null;
    const parsed = parseRipgrepContentEvent(event);
    return parsed ? { ...parsed, matched: false } : parsed;
}
function parseRipgrepContentEvent(event) {
    const filePath = decodeRipgrepJsonData(event.data.path);
    const text = decodeRipgrepJsonData(event.data.lines);
    const lineNumber = event.data.line_number;
    if (filePath === undefined ||
        text === undefined ||
        typeof lineNumber !== 'number' ||
        !Number.isInteger(lineNumber)) {
        return undefined;
    }
    return { filePath, lineNumber, text };
}
function decodeRipgrepJsonData(value) {
    if (typeof value.text === 'string')
        return value.text;
    if (typeof value.bytes === 'string')
        return node_buffer_1.Buffer.from(value.bytes, 'base64').toString('utf8');
    return undefined;
}
function normalizeRipgrepPath(filePath) {
    return filePath.startsWith('./') ? filePath.slice(2) : filePath;
}
function stripTrailingNewline(text) {
    return text.replace(/\r?\n$/, '');
}
function sanitizeKnowledgeOutputText(text, maxLength) {
    return (0, agent_knowledge_retrieval_1.truncateKnowledgeText)((0, redact_text_1.redactText)(stripTrailingNewline(text)).text, maxLength);
}
function quoteShellArg(value) {
    return `'${value.replaceAll("'", "'\\''")}'`;
}
function buildJsonMatchLimitedPipeline(command, matchLimit, outputLimit) {
    const script = [
        'BEGIN { matches = 0; total = 0 }',
        ...buildOutputLimitedEmitFunction(outputLimit),
        '{ emit($0) }',
        `/^\\{"type":"match"/ { matches += 1; if (matches >= ${matchLimit}) exit 0 }`,
    ].join(' ');
    return buildAwkPipeline(command, script);
}
function buildLineLimitedPipeline(command, lineLimit, outputLimit = agent_knowledge_retrieval_1.MAX_OPERATION_OUTPUT_CHARS) {
    const script = [
        'BEGIN { lines = 0; total = 0 }',
        ...buildOutputLimitedEmitFunction(outputLimit),
        '{ emit($0); lines += 1; if (lines >= ' + lineLimit + ') exit 0 }',
    ].join(' ');
    return buildAwkPipeline(command, script);
}
function buildOutputLimitedEmitFunction(outputLimit) {
    return [
        'function emit(line) {',
        `line_length = length(line) + 1; if (total + line_length > ${outputLimit}) { print "${SEARCH_OUTPUT_TRUNCATED_MARKER}"; exit 0; }`,
        'print line; total += line_length;',
        '}',
    ];
}
function buildAwkPipeline(command, script) {
    return [
        'set +o pipefail',
        `${command} | awk ${quoteShellArg(script)}`,
        'command_status="$' + '{PIPESTATUS[0]}"',
        'if [ "$command_status" = 141 ]; then command_status=0; fi',
        'exit "$command_status"',
    ].join('; ');
}
function buildScopedKnowledgeShellCommand(command, paths) {
    const scopedCommand = [
        `[ -d ${quoteShellArg(paths.filesDir)} ] || exit ${exports.KNOWLEDGE_FILES_DIR_UNAVAILABLE_EXIT_CODE}`,
        `cd ${quoteShellArg(paths.filesDir)} || exit ${exports.KNOWLEDGE_FILES_DIR_UNAVAILABLE_EXIT_CODE}`,
        `{ ${command}; }`,
    ].join('; ');
    return `bash -o pipefail -c ${quoteShellArg(scopedCommand)}`;
}
function buildMirrorFinalizeCommand(toCopy, toDelete, manifestFiles, paths, stagingId) {
    for (const name of [...toCopy, ...toDelete, ...manifestFiles.map((file) => file.file)]) {
        (0, agent_knowledge_storage_1.assertKnowledgePathSegment)(name, 'knowledge mirror file name');
    }
    (0, agent_knowledge_storage_1.assertKnowledgePathSegment)(stagingId, 'knowledge mirror staging ID');
    const commands = [`mkdir -p ${paths.filesDir}`];
    for (const name of toCopy) {
        const tmpPath = quoteShellArg(`${paths.stagingDir}/${stagingId}/${name}`);
        const finalPath = quoteShellArg(`${paths.filesDir}/${name}`);
        commands.push(`mv ${tmpPath} ${finalPath}`);
    }
    if (toDelete.length > 0) {
        const targets = toDelete.map((name) => quoteShellArg(`${paths.filesDir}/${name}`));
        commands.push(`rm -f ${targets.join(' ')}`);
    }
    const manifestBody = manifestFiles.length > 0
        ? `${manifestFiles.map(({ file, fileId }) => `${fileId}\t${file}`).join('\n')}\n`
        : '';
    const stagedManifest = `${paths.manifest}.${stagingId}.tmp`;
    commands.push(`printf '%s' ${quoteShellArg(manifestBody)} > ${stagedManifest}`, `mv ${stagedManifest} ${paths.manifest}`);
    return `timeout ${exports.MIRROR_SYNC_TIMEOUT_SECONDS} bash -o pipefail -c ${quoteShellArg(commands.join(' && '))}`;
}
//# sourceMappingURL=agent-knowledge-commands.js.map