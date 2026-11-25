import type { ReactNode } from 'react';

/** S11: main 48/32/88 (phone 24/16/56), white card max 720 r20, padding 40 (phone 24). */
export function ArticleCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-4 pb-14 pt-6 sm:px-6 sm:pt-12 lg:px-8 lg:pb-[88px]">
      <article className="border-border bg-surface mx-auto flex max-w-[720px] flex-col rounded-2xl border p-6 lg:p-10">
        <h1 className="text-title-lg text-text">{title}</h1>
        <div className="text-body text-text-muted [&_a]:text-primary [&_h2]:text-title-md [&_h2]:text-text mt-4 flex flex-col gap-4 leading-[26px] [&_a]:font-semibold [&_h2]:-mb-2 [&_h2]:mt-8">
          {children}
        </div>
      </article>
    </div>
  );
}
