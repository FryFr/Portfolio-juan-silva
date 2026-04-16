import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContactButton } from '@/features/contact/ui/contact-button';

describe('ContactButton', () => {
  it('renders label text and has role=link', () => {
    render(
      <ContactButton
        variant="whatsapp"
        href="https://wa.me/1234567890"
        label="Escribime por WhatsApp"
      />,
    );
    const link = screen.getByRole('link', { name: /escribime por whatsapp/i });
    expect(link).toBeInTheDocument();
  });

  it('renders the correct href attribute', () => {
    render(
      <ContactButton
        variant="linkedin"
        href="https://linkedin.com/in/juansilva"
        label="Conectá en LinkedIn"
      />,
    );
    const link = screen.getByRole('link', { name: /conectá en linkedin/i });
    expect(link).toHaveAttribute('href', 'https://linkedin.com/in/juansilva');
  });

  it('sets target="_blank" and rel contains noopener', () => {
    render(<ContactButton variant="whatsapp" href="https://wa.me/1234567890" label="WhatsApp" />);
    const link = screen.getByRole('link', { name: /whatsapp/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders optional icon inside an aria-hidden span', () => {
    const icon = <svg data-testid="icon" />;
    render(
      <ContactButton
        variant="linkedin"
        href="https://linkedin.com/in/juansilva"
        label="LinkedIn"
        icon={icon}
      />,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /linkedin/i });
    expect(link).toBeInTheDocument();
  });
});
