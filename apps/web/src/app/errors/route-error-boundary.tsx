import { useEffect } from 'react';
import { isRouteErrorResponse, useLocation, useRouteError } from 'react-router';
import { ApiError } from '@/lib/http';
import { ErrorPage } from './error-page';
import { ForbiddenPage } from './forbidden-page';
import { areaOf, NotFoundPage, type NotFoundVariant } from './not-found-page';

function notFoundVariant(pathname: string): NotFoundVariant {
  if (/^\/providers\/[^/]+$/.test(pathname)) return 'provider';
  if (/^\/(dashboard\/)?requests\/[^/]+/.test(pathname)) return 'request';
  return 'generic';
}

/** ARCH §5.6: errorElement inside each layout (so the layout stays). */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const { pathname } = useLocation();
  useEffect(() => {
    console.error(error);
  }, [error]);
  const status = error instanceof ApiError ? error.status : isRouteErrorResponse(error) ? error.status : null;
  if (status === 404) return <NotFoundPage area={areaOf(pathname)} variant={notFoundVariant(pathname)} />;
  if (status === 403) return <ForbiddenPage />;
  return <ErrorPage errorId={error instanceof ApiError ? error.envelope?.requestId : undefined} />;
}
