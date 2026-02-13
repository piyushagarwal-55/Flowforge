/**
 * Repair common JSON formatting issues from AI responses
 * Converts unquoted keys to quoted keys and fixes trailing commas
 */
export function repairJson(text: string): string {
  let repaired = text;
  
  // Convert {key: value} → {"key": value}
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
  
  // Remove trailing commas before closing brackets/braces
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix missing commas between array elements (common AI mistake)
  repaired = repaired.replace(/}(\s*){/g, '},\n{');
  
  // Fix missing commas between object properties (but not after colons)
  repaired = repaired.replace(/"(\s+)"([a-zA-Z0-9_]+)":/g, '",\n"$2":');
  
  // Fix unclosed arrays/objects by counting brackets
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  
  // Add missing closing brackets
  if (openBrackets > closeBrackets) {
    repaired += ']'.repeat(openBrackets - closeBrackets);
  }
  
  // Add missing closing braces
  if (openBraces > closeBraces) {
    repaired += '}'.repeat(openBraces - closeBraces);
  }
  
  return repaired;
}
