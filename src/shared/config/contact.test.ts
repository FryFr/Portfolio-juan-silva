import { describe, expect, it } from 'vitest';
import { buildLinkedInUrl, buildWhatsAppUrl, CONTACT } from './contact';

describe('contact config', () => {
  it('exposes the WhatsApp number in E.164 without leading +', () => {
    expect(CONTACT.whatsappE164).toBe('573161309551');
    expect(CONTACT.whatsappE164.startsWith('+')).toBe(false);
  });

  it('exposes the LinkedIn profile URL', () => {
    expect(CONTACT.linkedin).toBe('https://www.linkedin.com/in/jsilva-medina/');
  });
});

describe('buildWhatsAppUrl', () => {
  it('builds a wa.me URL with a url-encoded prefilled message', () => {
    const url = buildWhatsAppUrl('Hola Juan, probando el portfolio');
    expect(url).toBe('https://wa.me/573161309551?text=Hola%20Juan%2C%20probando%20el%20portfolio');
  });

  it('omits the text param when message is empty', () => {
    expect(buildWhatsAppUrl('')).toBe('https://wa.me/573161309551');
  });

  it('handles emoji and accented characters', () => {
    const url = buildWhatsAppUrl('Hola 👋 árbol');
    expect(url).toContain('https://wa.me/573161309551?text=');
    expect(url).toContain(encodeURIComponent('Hola 👋 árbol'));
  });
});

describe('buildLinkedInUrl', () => {
  it('returns the profile URL as-is', () => {
    expect(buildLinkedInUrl()).toBe('https://www.linkedin.com/in/jsilva-medina/');
  });
});
