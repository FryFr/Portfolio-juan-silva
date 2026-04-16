import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FloatingWhatsApp } from '@/features/contact/ui/floating-whatsapp';
import { renderWithIntl } from '../helpers/render-with-intl';

describe('FloatingWhatsApp', () => {
  it('renders the WhatsApp link', () => {
    renderWithIntl(<FloatingWhatsApp />);
    const link = screen.getByRole('link', {
      name: 'Abrir conversación por WhatsApp',
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('links to WhatsApp with pre-filled message', () => {
    renderWithIntl(<FloatingWhatsApp />);
    const link = screen.getByRole('link', {
      name: 'Abrir conversación por WhatsApp',
    });
    expect(link.getAttribute('href')).toContain('wa.me/');
  });

  it('is always visible (no dismiss button)', () => {
    renderWithIntl(<FloatingWhatsApp />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
