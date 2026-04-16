import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { FloatingWhatsApp } from '@/features/contact/ui/floating-whatsapp';
import { renderWithIntl } from '../helpers/render-with-intl';

const STORAGE_KEY = 'floating-wa-dismissed';

describe('FloatingWhatsApp', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('shows the WhatsApp link on initial render (no sessionStorage key)', async () => {
    renderWithIntl(<FloatingWhatsApp />);
    // useEffect flips visible to true — use findByRole (async)
    const link = await screen.findByRole('link', {
      name: 'Abrir conversación por WhatsApp',
    });
    expect(link).toBeInTheDocument();
  });

  it('hides the WhatsApp link and sets sessionStorage after dismiss click', async () => {
    const user = userEvent.setup();
    renderWithIntl(<FloatingWhatsApp />);

    // Wait for the component to become visible first
    await screen.findByRole('link', { name: 'Abrir conversación por WhatsApp' });

    const dismissBtn = screen.getByRole('button', {
      name: 'Ocultar botón de WhatsApp',
    });
    await user.click(dismissBtn);

    expect(
      screen.queryByRole('link', { name: 'Abrir conversación por WhatsApp' }),
    ).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe('1');
  });

  it('renders nothing when sessionStorage key is pre-set to "1"', () => {
    window.sessionStorage.setItem(STORAGE_KEY, '1');
    const { container } = renderWithIntl(<FloatingWhatsApp />);
    expect(container.firstChild).toBeNull();
  });
});
