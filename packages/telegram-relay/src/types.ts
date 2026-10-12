/** Telegram relay types — вкл/выкл, whitelist команд */
export interface TelegramConfig { enabled: boolean; chatId: string | null; botTokenRef: string | null; allowedCommands: string[] }
export interface TelegramMessage { chatId: string; text: string; at: string }
