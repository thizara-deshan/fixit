import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { GOOGLE_ENABLED } from '@/lib/env';
import { isMocked } from '@/mocks/enable';
import { googleMockSignIn, googleStartUrl } from '../api';

function GoogleMark() {
  // D-7: monochrome so no raw brand colours are needed.
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor">
      <path d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.7 14.54 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c5.34 0 8.88-3.75 8.88-9.04 0-.6-.07-1.06-.15-1.51z" />
    </svg>
  );
}

/** S5.E3 / S6.E2. Hidden unless VITE_GOOGLE_ENABLED. Mock: MSW route then /auth/google/done; real: full-page API redirect. */
export function GoogleButton({ next, intent }: { next: string | null; intent: 'provider' | null }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  if (!GOOGLE_ENABLED) return null;
  const query = { next: next ?? undefined, intent: intent ?? undefined };
  async function start() {
    setPending(true);
    if (!isMocked('auth')) {
      window.location.assign(googleStartUrl(query));
      return;
    }
    try {
      await googleMockSignIn();
      const qs = new URLSearchParams(
        Object.entries(query).filter((e): e is [string, string] => e[1] !== undefined),
      );
      await navigate(`/auth/google/done${qs.size > 0 ? `?${qs.toString()}` : ''}`);
    } catch {
      setPending(false);
      await navigate('/login?error=google_cancelled');
    }
  }
  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full"
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={() => void start()}
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
      ) : (
        <GoogleMark />
      )}
      Continue with Google
    </Button>
  );
}
