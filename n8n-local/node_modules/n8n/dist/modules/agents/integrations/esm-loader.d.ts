export declare function loadChatSdk(): Promise<typeof import("chat", { with: { "resolution-mode": "import" } })>;
export declare function loadSlackAdapter(): Promise<typeof import("@chat-adapter/slack", { with: { "resolution-mode": "import" } })>;
export declare function loadTelegramAdapter(): Promise<typeof import("@chat-adapter/telegram", { with: { "resolution-mode": "import" } })>;
export declare function loadLinearAdapter(): Promise<typeof import("@chat-adapter/linear", { with: { "resolution-mode": "import" } })>;
export declare function loadDiscordAdapter(): Promise<typeof import("@chat-adapter/discord", { with: { "resolution-mode": "import" } })>;
export declare function loadTeamsAdapter(): Promise<typeof import("@chat-adapter/teams", { with: { "resolution-mode": "import" } })>;
export declare function loadMemoryState(): Promise<typeof import("@chat-adapter/state-memory", { with: { "resolution-mode": "import" } })>;
export declare function loadWhatsAppAdapter(): Promise<typeof import("@chat-adapter/whatsapp", { with: { "resolution-mode": "import" } })>;
