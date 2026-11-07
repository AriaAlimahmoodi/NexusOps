// src/webhook/types.ts
var SlackWebhookError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "SlackWebhookError";
  }
};
var SlackWebhookVerificationError = class extends SlackWebhookError {
  constructor(message) {
    super(message);
    this.name = "SlackWebhookVerificationError";
  }
};
var SlackWebhookParseError = class extends SlackWebhookError {
  constructor(message) {
    super(message);
    this.name = "SlackWebhookParseError";
  }
};

// src/webhook/utils.ts
function getHeader(headers, name) {
  if (!headers) {
    return void 0;
  }
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    return headers.get(name) ?? void 0;
  }
  const lower = name.toLowerCase();
  if (isIterableHeaders(headers)) {
    for (const [key, value] of headers) {
      if (key.toLowerCase() === lower) {
        return value;
      }
    }
    return void 0;
  }
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) {
      return headerValue(value);
    }
  }
  return void 0;
}
function getRetry(headers) {
  const retryNum = getHeader(headers, "x-slack-retry-num");
  if (!retryNum) {
    return void 0;
  }
  const num = Number(retryNum);
  if (!Number.isFinite(num)) {
    return void 0;
  }
  return {
    num,
    reason: getHeader(headers, "x-slack-retry-reason")
  };
}
function isFormBody(body, contentType) {
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return true;
  }
  if (contentType.includes("application/json")) {
    return false;
  }
  const trimmed = body.trimStart();
  return !trimmed.startsWith("{") && body.includes("=");
}
function parseJsonBody(body) {
  try {
    return JSON.parse(body);
  } catch {
    throw new SlackWebhookParseError("Slack webhook body is invalid JSON");
  }
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function recordValue(value) {
  return isRecord(value) ? value : void 0;
}
function stringValue(value) {
  return typeof value === "string" ? value : "";
}
function optionalString(value) {
  const text = stringValue(value);
  return text || void 0;
}
function isIterableHeaders(headers) {
  return typeof headers[Symbol.iterator] === "function";
}
function headerValue(value) {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return void 0;
}

// src/webhook/parse.ts
function parseSlackWebhookBody(body, options = {}) {
  const headers = options.headers;
  const contentType = options.contentType ?? getHeader(headers, "content-type") ?? "";
  const retry = getRetry(headers);
  if (isFormBody(body, contentType)) {
    return parseFormBody(body, retry);
  }
  const raw = parseJsonBody(body);
  return classifyJsonPayload(raw, retry);
}
function parseFormBody(body, retry) {
  const params = new URLSearchParams(body);
  const payload = params.get("payload");
  if (payload !== null) {
    const raw = parseJsonBody(payload);
    return classifyInteractionPayload(raw, retry);
  }
  if (params.has("command")) {
    return parseSlashCommand(params, retry);
  }
  return {
    kind: "unsupported",
    raw: Object.fromEntries(params),
    retry,
    type: "form"
  };
}
function classifyJsonPayload(raw, retry) {
  if (!isRecord(raw)) {
    return { kind: "unsupported", raw, retry, type: "unknown" };
  }
  if (raw.type === "url_verification" && typeof raw.challenge === "string") {
    return { challenge: raw.challenge, kind: "url_verification", raw, retry };
  }
  if (raw.type !== "event_callback" || !isRecord(raw.event)) {
    return {
      kind: "unsupported",
      raw,
      retry,
      type: typeof raw.type === "string" ? raw.type : "unknown"
    };
  }
  const event = raw.event;
  if (event.type === "app_mention") {
    return parseMessageEvent("app_mention", raw, event, retry);
  }
  if (event.type === "message" && event.channel_type === "im") {
    return parseMessageEvent("direct_message", raw, event, retry);
  }
  return {
    kind: "unsupported",
    raw,
    retry,
    type: typeof event.type === "string" ? event.type : "event_callback"
  };
}
function classifyInteractionPayload(raw, retry) {
  if (!isRecord(raw)) {
    return { kind: "unsupported", raw, retry, type: "interaction" };
  }
  switch (raw.type) {
    case "block_actions":
      return parseBlockActions(raw, retry);
    case "block_suggestion":
      return parseBlockSuggestion(raw, retry);
    case "view_submission":
      return parseViewSubmission(raw, retry);
    case "view_closed":
      return parseViewClosed(raw, retry);
    default:
      return {
        kind: "unsupported",
        raw,
        retry,
        type: typeof raw.type === "string" ? raw.type : "interaction"
      };
  }
}
function parseMessageEvent(kind, envelope, event, retry) {
  const channelId = stringValue(event.channel);
  const ts = stringValue(event.ts);
  const threadTs = stringValue(event.thread_ts) || ts;
  const teamId = optionalString(event.team_id) || optionalString(envelope.team_id);
  const enterpriseId = optionalString(envelope.enterprise_id) || optionalString(envelope.context_enterprise_id);
  const continuation = channelId ? { channelId, enterpriseId, teamId, threadTs } : { channelId: "", enterpriseId, teamId, threadTs };
  const base = {
    apiAppId: optionalString(envelope.api_app_id),
    channelId,
    continuation,
    enterpriseId,
    eventId: optionalString(envelope.event_id),
    eventTime: typeof envelope.event_time === "number" ? envelope.event_time : void 0,
    files: parseFiles(event.files),
    eventType: event.type,
    isExtSharedChannel: typeof envelope.is_ext_shared_channel === "boolean" ? envelope.is_ext_shared_channel : void 0,
    raw: event,
    retry,
    teamId,
    text: stringValue(event.text),
    threadTs,
    ts,
    userId: optionalString(event.user)
  };
  if (kind === "app_mention") {
    return { ...base, eventType: "app_mention", kind };
  }
  return {
    ...base,
    botId: optionalString(event.bot_id),
    eventType: "message",
    kind,
    subtype: optionalString(event.subtype)
  };
}
function parseSlashCommand(params, retry) {
  const enterpriseId = params.get("enterprise_id") || void 0;
  const teamId = params.get("team_id") || void 0;
  return {
    channelId: params.get("channel_id") ?? "",
    channelName: params.get("channel_name") || void 0,
    command: params.get("command") ?? "",
    enterpriseId,
    isEnterpriseInstall: params.get("is_enterprise_install") === "true",
    kind: "slash_command",
    raw: Object.fromEntries(params),
    responseUrl: params.get("response_url") || void 0,
    retry,
    teamId,
    text: params.get("text") ?? "",
    triggerId: params.get("trigger_id") || void 0,
    userId: params.get("user_id") ?? "",
    userName: params.get("user_name") || void 0
  };
}
function parseBlockActions(raw, retry) {
  const channel = recordValue(raw.channel);
  const container = recordValue(raw.container);
  const message = recordValue(raw.message);
  const user = parseUser(raw.user);
  const team = recordValue(raw.team);
  const enterprise = recordValue(raw.enterprise);
  const channelId = optionalString(channel?.id) || optionalString(container?.channel_id);
  const messageTs = optionalString(message?.ts) || optionalString(container?.message_ts);
  const threadTs = optionalString(message?.thread_ts) || optionalString(container?.thread_ts) || messageTs;
  const teamId = optionalString(team?.id) || user.teamId;
  const enterpriseId = optionalString(enterprise?.id) || optionalString(team?.enterprise_id);
  const continuation = channelId && threadTs ? { channelId, enterpriseId, teamId, threadTs } : void 0;
  const messageBlocks = Array.isArray(message?.blocks) ? message.blocks : void 0;
  const messagePromptBlock = findPromptBlock(messageBlocks);
  return {
    actions: Array.isArray(raw.actions) ? raw.actions.map((action) => parseAction(action, user)) : [],
    channelId,
    continuation,
    enterpriseId,
    isEnterpriseInstall: typeof raw.is_enterprise_install === "boolean" ? raw.is_enterprise_install : void 0,
    kind: "block_actions",
    messageBlocks,
    messagePromptBlock,
    messagePromptText: readPromptText(messagePromptBlock),
    messageTs,
    raw,
    responseUrl: optionalString(raw.response_url),
    retry,
    teamId,
    threadTs,
    triggerId: optionalString(raw.trigger_id),
    user,
    userId: user.id,
    userName: user.username || user.name
  };
}
function parseAction(action, user) {
  const raw = isRecord(action) ? action : {};
  const selectedOption = recordValue(raw.selected_option);
  const text = recordValue(raw.text);
  const selectedText = recordValue(selectedOption?.text);
  return {
    actionId: stringValue(raw.action_id),
    blockId: optionalString(raw.block_id),
    label: optionalString(selectedText?.text) || optionalString(text?.text),
    raw,
    selectedOptionLabel: optionalString(selectedText?.text),
    selectedOptionValue: optionalString(selectedOption?.value),
    type: stringValue(raw.type),
    user,
    value: optionalString(raw.value)
  };
}
function parseBlockSuggestion(raw, retry) {
  const channel = recordValue(raw.channel);
  const team = recordValue(raw.team);
  const enterprise = recordValue(raw.enterprise);
  const user = recordValue(raw.user);
  return {
    actionId: stringValue(raw.action_id),
    blockId: stringValue(raw.block_id),
    channelId: optionalString(channel?.id),
    enterpriseId: optionalString(enterprise?.id) || optionalString(team?.enterprise_id),
    kind: "block_suggestion",
    raw,
    retry,
    teamId: optionalString(team?.id),
    userId: stringValue(user?.id),
    value: stringValue(raw.value)
  };
}
function parseViewSubmission(raw, retry) {
  const team = recordValue(raw.team);
  const enterprise = recordValue(raw.enterprise);
  const user = parseUser(raw.user);
  const view = recordValue(raw.view) ?? {};
  return {
    callbackId: optionalString(view.callback_id),
    enterpriseId: optionalString(enterprise?.id) || optionalString(team?.enterprise_id),
    kind: "view_submission",
    privateMetadata: optionalString(view.private_metadata),
    raw,
    responseUrls: Array.isArray(view.response_urls) ? view.response_urls : void 0,
    retry,
    teamId: optionalString(team?.id),
    user,
    userId: user.id,
    values: parseViewValues(view),
    view
  };
}
function parseViewClosed(raw, retry) {
  const team = recordValue(raw.team);
  const enterprise = recordValue(raw.enterprise);
  const user = parseUser(raw.user);
  return {
    enterpriseId: optionalString(enterprise?.id) || optionalString(team?.enterprise_id),
    kind: "view_closed",
    raw,
    retry,
    teamId: optionalString(team?.id),
    user,
    userId: user.id,
    view: recordValue(raw.view) ?? {}
  };
}
function parseFiles(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((file) => isRecord(file) ? file : void 0).filter((file) => file !== void 0).map((file) => {
    const mimeType = optionalString(file.mimetype);
    return {
      downloadUrl: optionalString(file.url_private_download),
      filetype: optionalString(file.filetype),
      id: stringValue(file.id),
      mimeType,
      name: optionalString(file.name),
      raw: file,
      size: typeof file.size === "number" ? file.size : void 0,
      title: optionalString(file.title),
      type: inferFileType(mimeType),
      url: optionalString(file.url_private)
    };
  });
}
function inferFileType(mimeType) {
  if (mimeType?.startsWith("image/")) {
    return "image";
  }
  if (mimeType?.startsWith("video/")) {
    return "video";
  }
  if (mimeType?.startsWith("audio/")) {
    return "audio";
  }
  return "file";
}
function parseUser(value) {
  const user = recordValue(value) ?? {};
  return {
    id: stringValue(user.id),
    name: optionalString(user.name),
    teamId: optionalString(user.team_id),
    username: optionalString(user.username)
  };
}
function findPromptBlock(blocks) {
  return blocks?.find((block) => {
    const item = recordValue(block);
    return item?.type === "section" && recordValue(item.text);
  });
}
function readPromptText(block) {
  const item = recordValue(block);
  const text = recordValue(item?.text);
  return optionalString(text?.text);
}
function parseViewValues(view) {
  const state = recordValue(view.state);
  const values = recordValue(state?.values);
  if (!values) {
    return [];
  }
  const output = [];
  for (const [blockId, block] of Object.entries(values)) {
    const actions = recordValue(block);
    if (!actions) {
      continue;
    }
    for (const [actionId, action] of Object.entries(actions)) {
      const raw = recordValue(action);
      if (!raw) {
        continue;
      }
      const selectedOption = recordValue(raw.selected_option);
      const selectedText = recordValue(selectedOption?.text);
      output.push({
        actionId,
        blockId,
        raw,
        selectedOptionLabel: optionalString(selectedText?.text),
        selectedOptionValue: optionalString(selectedOption?.value),
        type: optionalString(raw.type),
        value: optionalString(raw.value)
      });
    }
  }
  return output;
}

// src/webhook/verify.ts
var HEX_PATTERN = /^[\da-f]+$/i;
async function readSlackWebhook(request, options) {
  const body = await verifySlackRequest(request, options);
  return parseSlackWebhookBody(body, {
    contentType: options.contentType,
    headers: request.headers
  });
}
async function verifySlackRequest(request, options) {
  const body = await request.text();
  if (options.webhookVerifier) {
    const result = await options.webhookVerifier(request, body);
    if (!result) {
      throw new SlackWebhookVerificationError(
        "Slack webhook verifier rejected the request"
      );
    }
    return typeof result === "string" ? result : body;
  }
  await verifySlackSignature(body, request.headers, options);
  return body;
}
async function verifySlackSignature(body, headers, options) {
  const signingSecret = options.signingSecret;
  if (!signingSecret) {
    throw new SlackWebhookVerificationError("Slack signing secret is required");
  }
  const timestamp = getHeader(headers, "x-slack-request-timestamp");
  const signature = getHeader(headers, "x-slack-signature");
  if (!(timestamp && signature)) {
    throw new SlackWebhookVerificationError(
      "Slack signature headers are required"
    );
  }
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    throw new SlackWebhookVerificationError("Slack timestamp is invalid");
  }
  const now = Math.floor((options.now?.() ?? Date.now()) / 1e3);
  const maxSkewSeconds = options.maxSkewSeconds ?? 300;
  if (Math.abs(now - timestampSeconds) > maxSkewSeconds) {
    throw new SlackWebhookVerificationError("Slack timestamp is too old");
  }
  const verified = await verifySlackSignatureValue(
    body,
    signingSecret,
    timestamp,
    signature
  );
  if (!verified) {
    throw new SlackWebhookVerificationError("Slack signature is invalid");
  }
}
async function verifySlackSignatureValue(body, signingSecret, timestamp, signature) {
  const crypto = globalThis.crypto;
  if (!crypto?.subtle) {
    throw new SlackWebhookVerificationError("Web Crypto is not available");
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["verify"]
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    parseSlackSignature(signature),
    encoder.encode(`v0:${timestamp}:${body}`)
  );
}
function parseSlackSignature(signature) {
  if (!signature.startsWith("v0=")) {
    throw new SlackWebhookVerificationError("Slack signature is invalid");
  }
  const hex = signature.slice(3);
  if (hex.length % 2 !== 0 || !HEX_PATTERN.test(hex)) {
    throw new SlackWebhookVerificationError("Slack signature is invalid");
  }
  const buffer = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return buffer;
}

export {
  SlackWebhookError,
  SlackWebhookVerificationError,
  SlackWebhookParseError,
  parseSlackWebhookBody,
  readSlackWebhook,
  verifySlackRequest,
  verifySlackSignature
};
