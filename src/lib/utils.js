import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

export function formatDate(dateString, lang = 'da') {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  const daFormats = {
    da: { year: 'numeric', month: 'long', day: 'numeric' },
    en: { year: 'numeric', month: 'long', day: 'numeric' },
    kl: { year: 'numeric', month: '2-digit', day: '2-digit' }
  };

  return new Intl.DateTimeFormat(
    lang === 'da' ? 'da-DK' : lang === 'en' ? 'en-US' : 'da-DK',
    daFormats[lang] || daFormats.da
  ).format(date);
}