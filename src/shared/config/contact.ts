export const CONTACT = {
  whatsappE164: '573161309551',
  linkedin: 'https://www.linkedin.com/in/jsilva-medina/',
} as const;

export function buildWhatsAppUrl(message: string): string {
  const base = `https://wa.me/${CONTACT.whatsappE164}`;
  if (message.length === 0) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function buildLinkedInUrl(): string {
  return CONTACT.linkedin;
}
