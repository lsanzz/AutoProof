import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateInspectionCode() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AP-${year}-${rand}`;
}

export function generatePublicCode() {
  // 24-char URL-safe code
  const a = crypto.randomUUID().replace(/-/g, "");
  return a.slice(0, 24);
}

export function formatDateTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

export function buildWhatsAppLink(phone: string, message: string) {
  const num = onlyDigits(phone);
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}
