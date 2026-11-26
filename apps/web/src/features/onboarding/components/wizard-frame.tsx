import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { STEPS, type WizardStep } from '../steps';

/** S19 column, stepper and step card. The step renders its own <form>, fields and <WizardFooter>. */
export function WizardFrame({ step, children }: { step: WizardStep; children: ReactNode }) {
  const s = STEPS[step - 1] ?? STEPS[0];
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5 px-4 pb-6 pt-5 sm:gap-6 sm:px-8 sm:pb-[88px] sm:pt-10">
      <div className="flex flex-col gap-2">
        <p className="text-label text-text-muted font-semibold">
          Step {step} of 5 · {s.title}
        </p>
        <div aria-hidden="true" className="flex gap-1">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn('h-1.5 flex-1 rounded-full', i < step ? 'bg-primary' : 'bg-primary-soft')}
            />
          ))}
        </div>
      </div>
      <section className="sm:border-border sm:bg-surface flex flex-col gap-6 sm:rounded-2xl sm:border sm:p-7">
        <header className="flex flex-col gap-1">
          <h1 className="text-title-lg text-text">{s.title}</h1>
          <p className="text-body-sm text-text-muted">{s.sub}</p>
        </header>
        {children}
      </section>
    </div>
  );
}

/** Desktop: Back left, primary right. Phone (< 641): sticky bottom bar, Back 1/3 · primary 2/3. */
export function WizardFooter({
  back,
  primary,
  extra,
}: {
  back: ReactNode;
  primary: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="bg-surface border-border sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
      {extra && <div className="flex justify-end">{extra}</div>}
      <div className="flex gap-3 sm:justify-between">
        <div className="basis-1/3 sm:basis-auto [&>*]:w-full sm:[&>*]:w-auto">{back}</div>
        <div className="basis-2/3 sm:basis-auto [&>*]:w-full sm:[&>*]:w-auto">{primary}</div>
      </div>
    </div>
  );
}
