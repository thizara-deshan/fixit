import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setViewportWidth } from '@/test/media';
import { ResponsiveDialog } from './responsive-dialog';

function renderDialog(props: Partial<Parameters<typeof ResponsiveDialog>[0]> = {}) {
  const onOpenChange = vi.fn();
  render(
    <ResponsiveDialog
      open
      onOpenChange={onOpenChange}
      title="Decline Olivia's request?"
      footer={<button>Decline</button>}
      {...props}
    >
      <p>Body</p>
    </ResponsiveDialog>,
  );
  return { onOpenChange };
}

describe('ResponsiveDialog (SPEC §6.10, AC7)', () => {
  it('is a centred dialog at 1440px', () => {
    renderDialog();
    const dialogs = screen.getAllByRole('dialog');
    expect(dialogs).toHaveLength(1);
    expect(dialogs[0]?.dataset.variant).toBe('dialog');
  });
  it('is a bottom sheet at 390px', () => {
    setViewportWidth(390);
    renderDialog();
    const dialogs = screen.getAllByRole('dialog');
    expect(dialogs).toHaveLength(1);
    expect(dialogs[0]?.dataset.variant).toBe('sheet');
  });
  it('closes on Esc unless it is not dismissible', async () => {
    const user = userEvent.setup();
    const a = renderDialog();
    await user.keyboard('{Escape}');
    expect(a.onOpenChange).toHaveBeenCalledWith(false);
  });
  it('ignores Esc while submitting', async () => {
    const user = userEvent.setup();
    const a = renderDialog({ dismissible: false });
    await user.keyboard('{Escape}');
    expect(a.onOpenChange).not.toHaveBeenCalled();
  });
});
