import { describe, expect, it } from 'vitest';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step3Form, type ServicesFormValues } from '@fixit/contracts';
import { EMPTY_SERVICE, ServicesRepeater } from './services-editor';

function Host({ initial }: { initial: ServicesFormValues['services'] }) {
  const form = useForm<ServicesFormValues, unknown, z.output<typeof Step3Form>>({
    resolver: zodResolver(Step3Form),
    defaultValues: { services: initial },
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={(e) => void form.handleSubmit(() => undefined)(e)}>
        <ServicesRepeater />
        <button type="submit">Continue</button>
      </form>
    </FormProvider>
  );
}

describe('ServicesRepeater', () => {
  it('live Shows as preview', async () => {
    render(<Host initial={[{ ...EMPTY_SERVICE }]} />);
    await userEvent.type(screen.getByLabelText(/^Price/), '2500');
    expect(screen.getByText('from LKR 2,500 / hour')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'fixed' }));
    expect(screen.getByText('LKR 2,500 fixed')).toBeInTheDocument();
  });
  it('empty list → Add at least one service.; row errors', async () => {
    render(<Host initial={[{ ...EMPTY_SERVICE }]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Enter a service name.')).toBeInTheDocument();
    expect(
      screen.getByText('Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Remove/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Add at least one service.')).toBeInTheDocument();
  });
  it('Add disabled at 20 with help', () => {
    render(
      <Host
        initial={Array.from({ length: 20 }, (_, i) => ({
          name: `S${String(i)}xx`,
          price: '500',
          unit: 'per_visit' as const,
        }))}
      />,
    );
    expect(screen.getByRole('button', { name: 'Add service' })).toBeDisabled();
    expect(screen.getByText('You can list up to 20 services.')).toBeInTheDocument();
  });
});
