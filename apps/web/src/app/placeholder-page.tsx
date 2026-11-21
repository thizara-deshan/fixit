import { RequestRef } from '@fixit/contracts';

const sampleRef = RequestRef.parse('FX-2061');

export function PlaceholderPage() {
  return (
    <main className="max-w-content mx-auto flex min-h-dvh w-full flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-title-xl text-text">Fixit</h1>
      <p className="text-body text-text-muted">
        Foundation placeholder. The app shell replaces this page in M03.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="bg-primary text-label text-primary-foreground hover:bg-primary-hover h-12 rounded-md px-5 font-semibold transition-colors"
        >
          Find a provider
        </button>
        <button
          type="button"
          className="bg-cta text-label text-on-cta hover:bg-cta-hover h-12 rounded-md px-5 font-semibold transition-colors"
        >
          Join as a provider
        </button>
      </div>
      <span className="text-mono text-text-subtle font-mono">{sampleRef}</span>
    </main>
  );
}
