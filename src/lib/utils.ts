import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Clean AI-generated description from any JSON wrappers or code blocks
export function cleanDescription(description: string | null | undefined): string {
  if (!description) return "";
  
  let cleaned = description;
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  
  // If it's a JSON object, try to parse and extract description
  if (cleaned.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.description) {
        return parsed.description;
      }
    } catch (e) {
      // If parsing fails, try regex extraction
      const match = cleaned.match(/"description"\s*:\s*"([^"]+)"/i);
      if (match) {
        return match[1];
      }
    }
  }
  
  // Remove any remaining JSON-like syntax
  cleaned = cleaned.replace(/^\{.*?"description"\s*:\s*"/i, '');
  cleaned = cleaned.replace(/"[,\}].*$/g, '');
  
  return cleaned.trim();
}

// Extract score from potentially JSON-wrapped data
export function cleanScore(score: number | null | undefined, description: string | null | undefined): number | null {
  if (score !== null && score !== undefined) return score;
  
  // Try to extract from description if it contains JSON
  if (description && description.includes('"score"')) {
    try {
      const parsed = JSON.parse(description);
      if (parsed.score !== undefined) {
        return parsed.score;
      }
    } catch (e) {
      const match = description.match(/"score"\s*:\s*(\d+(?:\.\d+)?)/i);
      if (match) {
        return parseFloat(match[1]);
      }
    }
  }
  
  return null;
}
