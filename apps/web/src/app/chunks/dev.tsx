import { PlaceholderScreen } from '../placeholder-screen';

export function DevUiPage() {
  return <PlaceholderScreen title="UI kit" />;
}

/** AC6: a route that throws while rendering. */
export function DevThrowPage(): never {
  throw new Error('Dev route error (M03 AC6)');
}
