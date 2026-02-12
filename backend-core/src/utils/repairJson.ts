/**
 * Repair common JSON formatting issues from AI responses
 * Converts unquoted keys to quoted keys
 */
export function repairJson(text: string): string {
  // Convert {key: value} → {"key": value}
  return text.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
}
