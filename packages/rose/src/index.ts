export { Chat } from "./components/Chat";
export type { RoseChatProps, RoseMessage, RoseOptionPayload } from "./components/Chat";
export { ChatInterface } from "./components/ChatInterface";
export { UsageBar } from "./components/UsageBar";
export { Providers } from "./components/Providers";
export { MarkdownRenderer } from "./components/MarkdownRenderer";
export type { MarkdownRendererProps } from "./components/MarkdownRenderer";
export { ChatbotInputArea } from "./components/ChatbotInputArea";
export type { ChatbotInputAreaHandle, InputSegment } from "./components/ChatbotInputArea";
export { ChatbotInputBadge } from "./components/ChatbotInputBadge";
export type { SelectedBadge } from "./components/ChatbotInputBadge";
export { ChatbotSlashMenu } from "./components/ChatbotSlashMenu";
export type { ChatbotSlashMenuHandle } from "./components/ChatbotSlashMenu";
export { ChatbotTraces } from "./components/ChatbotTraces";
export { ChatbotOptionsPicker } from "./components/ChatbotOptionsPicker";
export type { OptionsPayload } from "./components/ChatbotOptionsPicker";
export { ChatbotWelcome, DEFAULT_STARTERS, DEFAULT_BADGES, DEFAULT_QUICK_COMMANDS } from "./components/ChatbotWelcome";
export type { StarterItem, ReferenceBadge, QuickCommand } from "./components/ChatbotWelcome";

export {
  runAgentChat,
  createAgentRunner,
  DEFAULT_AGENT_SYSTEM_INSTRUCTION,
  DEFAULT_TOOL_LABEL_MAP,
} from "./lib/agentRunner";
export type { ChatMessage, RunAgentResult, AgentChatOptions } from "./lib/agentRunner";
export { callGemini } from "./lib/geminiClient";
export { ROSE_EMOTIONS, extractEmotion } from "./lib/roseEmotions";
export {
  getAgentCommandCategories,
  createCommandCategory,
  createCommandItem,
  DEFAULT_COMMAND_CATEGORIES,
} from "./lib/commandRegistry";
export type { CommandCategory, CommandItem } from "./lib/commandRegistry";
export {
  formatMarkdown,
  isMediaVideo,
  slugify,
  shouldShowSlashMenu,
  extractSlashQuery,
  insertBadgeToken,
} from "./lib/markdownFormatter";
export { formatErrorMessage, formatUsageLimitMessage, parseErrorDetails } from "./lib/errorFormatter";
export type { FormattedError } from "./lib/errorFormatter";

export {
  SPECIALISTS,
  registerSpecialist,
  createSpecialist,
  invokeSpecialist,
} from "./lib/specialists";
export type { Specialist } from "./lib/specialists";

export { getSupabase } from "./lib/supabase";
export { getBrowserSupabase } from "./lib/supabase-browser";
export {
  TOOLS,
  DEFAULT_TOOLS,
  createTool,
  registerTool,
  getToolByName,
  webSearchTool,
  calculatorTool,
  codeAnalyzerTool,
  askQuestionTool,
  delegateToSpecialistTool,
} from "./lib/tools";
export type { Tool } from "./lib/tools";

export {
  currentWeek,
  currentDay,
  roseDailyLimitGuest,
  roseWeeklyLimitGuest,
  roseDailyLimitUser,
  roseWeeklyLimitUser,
  getRoleLimits,
  getRoseUsage,
  checkAndIncrementRoseUsage,
} from "./lib/usage";
export type { RoseUsage } from "./lib/usage";
export {
  listSessions,
  createSession,
  getSession,
  renameSession,
  deleteSession,
  touchSession,
  listMessages,
  appendMessages,
} from "./lib/sessionStore";
export type {
  RoseSession,
  RoseSessionMessage,
  NewSessionMessage,
} from "./lib/sessionStore";