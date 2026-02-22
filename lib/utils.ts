import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isThisYear } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format message timestamp:
 * - Today → "2:34 PM"
 * - This year → "Feb 15, 2:34 PM"
 * - Older → "Feb 15 2023, 2:34 PM"
 */
export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, "h:mm a");
  }
  if (isThisYear(date)) {
    return format(date, "MMM d, h:mm a");
  }
  return format(date, "MMM d yyyy, h:mm a");
}

export function formatConversationTime(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, "h:mm a");
  }
  if (isThisYear(date)) {
    return format(date, "MMM d");
  }
  return format(date, "MM/dd/yy");
}
