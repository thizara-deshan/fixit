import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { authStore } from '@/lib/auth-store';
import { refreshOnce } from '@/lib/http';
import { postLoginTarget } from '@/lib/next';

/** Technical route: exchange the refresh cookie for a session, then go to intent / next / role home. */
export function GoogleDonePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return; // StrictMode
    started.current = true;
    void (async () => {
      if (!(await refreshOnce())) {
        await navigate('/login?error=google_cancelled', { replace: true });
        return;
      }
      const me = authStore.getState().me;
      const to =
        params.get('intent') === 'provider'
          ? '/become-a-provider/1'
          : postLoginTarget(me, `?${params.toString()}`);
      await navigate(to, { replace: true });
    })();
  }, [navigate, params]);
  return (
    <div aria-busy="true">
      <h1 className="text-title-md text-text">Signing you in…</h1>
    </div>
  );
}
