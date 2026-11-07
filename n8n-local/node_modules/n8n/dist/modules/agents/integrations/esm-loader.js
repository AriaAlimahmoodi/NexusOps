"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadChatSdk = loadChatSdk;
exports.loadSlackAdapter = loadSlackAdapter;
exports.loadTelegramAdapter = loadTelegramAdapter;
exports.loadLinearAdapter = loadLinearAdapter;
exports.loadDiscordAdapter = loadDiscordAdapter;
exports.loadTeamsAdapter = loadTeamsAdapter;
exports.loadMemoryState = loadMemoryState;
exports.loadWhatsAppAdapter = loadWhatsAppAdapter;
const esmImport = new Function('specifier', 'return import(specifier)');
async function loadChatSdk() {
    return await esmImport('chat');
}
async function loadSlackAdapter() {
    return await esmImport('@chat-adapter/slack');
}
async function loadTelegramAdapter() {
    return await esmImport('@chat-adapter/telegram');
}
async function loadLinearAdapter() {
    return await esmImport('@chat-adapter/linear');
}
async function loadDiscordAdapter() {
    return await esmImport('@chat-adapter/discord');
}
async function loadTeamsAdapter() {
    return await esmImport('@chat-adapter/teams');
}
async function loadMemoryState() {
    return await esmImport('@chat-adapter/state-memory');
}
async function loadWhatsAppAdapter() {
    return await esmImport('@chat-adapter/whatsapp');
}
//# sourceMappingURL=esm-loader.js.map