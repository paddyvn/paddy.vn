import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Vietnamese Dong currency
 * @param amount - The amount to format
 * @returns Formatted currency string with ₫ symbol
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "0₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/**
 * Format a price number (simple number formatting without currency symbol)
 * Useful when you want to add the ₫ symbol manually
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return "0";
  return new Intl.NumberFormat("vi-VN").format(price);
}
