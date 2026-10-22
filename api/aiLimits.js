// Shared by the app and /api/claude. The server rejects a longer history.
const MAX_CHAT_MESSAGES = 24;

/**
 * Keep the newest turns that fit the server limit.
 * The window always starts with a user message so an assistant reply is not
 * left without the question it answers.
 */
function selectRecentChatMessages(messages, limit = MAX_CHAT_MESSAGES) {
  const max = Number.isInteger(limit) && limit > 0 ? limit : MAX_CHAT_MESSAGES;
  const normalized = (Array.isArray(messages) ? messages : [])
    .filter((message) => (
      message
      && message.role !== 'system'
      && typeof message.content === 'string'
      && message.content.length > 0
    ))
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content,
    }));

  let recent = normalized.slice(-max);
  while (recent.length > 0 && recent[0].role !== 'user') {
    recent = recent.slice(1);
  }
  return recent;
}

function isAiBackendDisabled(error) {
  return error?.code === 'AI_BACKEND_DISABLED' || error?.code === 'NO_API_KEY';
}

function statusOf(error) {
  if (Number.isInteger(error?.status)) return error.status;
  const match = String(error?.message || '').match(/AI_API_ERROR_(\d+)/);
  return match ? Number(match[1]) : null;
}

/** Hebrew text for a real AI failure. Local fallbacks are not used for these. */
function hebrewAiFailureMessage(error) {
  const status = statusOf(error);
  const code = error?.code;

  if (code === 'AUTH_REQUIRED' || status === 401 || status === 403) {
    return 'אין הרשאה למאמן כרגע. נסה להתחבר מחדש.';
  }
  if (status === 429) {
    return 'נשלחו יותר מדי שאלות בזמן קצר. אפשר לנסות שוב בעוד כמה דקות.';
  }
  if (status === 503) {
    return 'המאמן החכם עדיין לא הופעל בשרת. נסה שוב מאוחר יותר.';
  }
  if (status == null || status >= 500) {
    return 'המאמן החכם לא זמין כרגע. נסה שוב בעוד רגע.';
  }
  return 'הבקשה למאמן לא עברה. נסה לשאול שוב.';
}

module.exports = {
  MAX_CHAT_MESSAGES,
  selectRecentChatMessages,
  isAiBackendDisabled,
  hebrewAiFailureMessage,
};
