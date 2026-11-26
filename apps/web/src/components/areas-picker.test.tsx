import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AreasFormInput } from '@fixit/contracts';
import { buildWorld } from '@fixit/fixtures';
import { FIXED_NOW } from '@/test/fixed-now';
import { AreasPicker } from './areas-picker';

const world = buildWorld(FIXED_NOW);
const catalog = { districts: world.districts, towns: world.towns };

function Host({ initial, error }: { initial: AreasFormInput; error?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <AreasPicker
      catalog={catalog}
      value={value}
      onChange={setValue}
      errors={error === undefined ? {} : { baseTownId: error }}
    />
  );
}

describe('AreasPicker', () => {
  it('choosing the base town removes it from the checkbox list and unticks it', async () => {
    render(<Host initial={{ baseTownId: '', otherTownIds: ['colombo'] }} />);
    expect(screen.getByRole('checkbox', { name: 'Colombo' })).toBeChecked();
    await userEvent.selectOptions(screen.getByLabelText(/Base town/), 'colombo');
    expect(screen.queryByRole('checkbox', { name: 'Colombo' })).not.toBeInTheDocument();
    expect(screen.getByText('0 of 9 selected')).toBeInTheDocument();
  });
  it('9 selected disables the rest and shows the limit; unticking re-enables', async () => {
    const nine = world.towns.slice(0, 9).map((t) => t.id);
    render(<Host initial={{ baseTownId: '', otherTownIds: nine }} />);
    expect(screen.getByText('9 of 9 selected')).toBeInTheDocument();
    expect(screen.getByText('You can add up to 9 other towns.')).toBeInTheDocument();
    const boxes = screen.getAllByRole('checkbox');
    expect(
      boxes.filter((b) => !(b as HTMLInputElement).checked).every((b) => (b as HTMLInputElement).disabled),
    ).toBe(true);
    const first = boxes.find((b) => (b as HTMLInputElement).checked);
    if (!first) throw new Error('none checked');
    await userEvent.click(first);
    expect(screen.getByText('8 of 9 selected')).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('checkbox')
        .some((b) => !(b as HTMLInputElement).checked && (b as HTMLInputElement).disabled),
    ).toBe(false);
  });
  it('shows the base town error', () => {
    render(<Host initial={{ baseTownId: '', otherTownIds: [] }} error="Choose your base town." />);
    expect(screen.getByText('Choose your base town.')).toBeInTheDocument();
  });
});
