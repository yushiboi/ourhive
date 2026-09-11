import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PLAYER_COLORS = ["#2F6F4E", "#C45C26", "#2B6C8A", "#8B5E3C", "#6B4C9A"] as const;

export function playerColor(id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 3)) % PLAYER_COLORS.length;
  return PLAYER_COLORS[n]!;
}

export function formatWord(word: string): string {
  return word.toUpperCase();
}
