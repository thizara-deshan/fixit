import { authStore } from './auth-store';
import { refreshOnce } from './http';

/** Boot: restore the session from the refresh cookie (mock: `fixit.mock.refresh`), else guest. */
export async function bootstrapAuth(): Promise<void> {
  if (!(await refreshOnce())) authStore.setGuest();
}
