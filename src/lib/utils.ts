import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Clean AI-generated description from any JSON wrappers or code blocks
export function cleanDescription(description: string | null | undefined): string {
  if (!description) return "";
  
  let cleaned = description.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  
  // If it's a JSON object or starts with {, try to parse and extract description
  if (cleaned.startsWith('{')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.description) {
        return parsed.description;
      }
    } catch (e) {
      // If parsing fails, try regex extraction for description value
      const match = cleaned.match(/"description"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/i);
      if (match) {
        return match[1].replace(/\\"/g, '"');
      }
    }
  }
  
  // If it contains JSON-like structure but parsing failed, extract manually
  if (cleaned.includes('"description"')) {
    const match = cleaned.match(/"description"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/i);
    if (match) {
      return match[1].replace(/\\"/g, '"');
    }
  }
  
  return cleaned;
}

// Extract score from potentially JSON-wrapped data
export function cleanScore(score: number | null | undefined, description: string | null | undefined): number | null {
  // First try to extract from description if it contains JSON (priority over DB score)
  if (description && description.includes('"score"')) {
    let trimmed = description.trim();
    
    // Remove markdown code blocks
    trimmed = trimmed.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.score !== undefined && parsed.score !== null) {
        return Number(parsed.score);
      }
    } catch (e) {
      // Regex to extract score value
      const match = trimmed.match(/"score"\s*:\s*(\d+(?:\.\d+)?)/i);
      if (match) {
        return parseFloat(match[1]);
      }
    }
  }
  
  // Fall back to database score if available and reasonable (not default 5)
  if (score !== null && score !== undefined && score !== 5 && score > 0) {
    return score;
  }
  
  return null;
}

// Generate a display name from description
export function generateNameFromDescription(description: string | null | undefined, fallback: string = "Untitled"): string {
  const cleaned = cleanDescription(description);
  if (!cleaned) return fallback;
  
  // Take first 50 characters of description
  const truncated = cleaned.substring(0, 50);
  
  // Split into words and take first 3-5 words
  const words = truncated.split(/\s+/).slice(0, 4);
  
  // Capitalize first letter of each word and join
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
