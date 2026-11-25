import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';
import { features } from '@/lib/features';
import { HomePage } from './chunks/home';
import { ErrorPage } from './errors/error-page';
import { ForbiddenPage } from './errors/forbidden-page';
import { NotFoundPage } from './errors/not-found-page';
import { RouteErrorBoundary } from './errors/route-error-boundary';
import {
  RedirectPublishedProvider,
  RequireAdmin,
  RequireAuth,
  RequireGuest,
  RequireProvider,
  RequireRole,
} from './guards/guards';
import { AdminLayout } from './layouts/admin-layout';
import { AuthLayout } from './layouts/auth-layout';
import { CustomerLayout } from './layouts/customer-layout';
import { ProviderLayout } from './layouts/provider-layout';
import { PublicLayout } from './layouts/public-layout';
import { RootLayout } from './layouts/root-layout';

type Lazy = () => Promise<{ Component: ComponentType }>;
const page =
  <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K): Lazy =>
  async () => ({ Component: (await load())[name] });

// One import() per area = one chunk per area (ARCH §5.1).
const pub = () => import('./chunks/public');
const auth = () => import('./chunks/auth');
const customer = () => import('./chunks/customer');
const onboarding = () => import('./chunks/onboarding');
const provider = () => import('./chunks/provider');
const admin = () => import('./chunks/admin');
const dev = () => import('./chunks/dev');

const when = (on: boolean, r: RouteObject): RouteObject[] => (on ? [r] : []);
/** errorElement on a pathless child keeps the layout around S41/S39 (SPEC §5.E). */
const withBoundary = (children: RouteObject[]): RouteObject[] => [
  { errorElement: <RouteErrorBoundary />, children },
];

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />, // a layout itself failed
    children: [
      /* ---------- L1 public (+ L2 customer area) ---------- */
      {
        element: <PublicLayout />,
        children: withBoundary([
          { index: true, element: <HomePage /> },
          { path: 'discover', lazy: page(pub, 'DiscoverPage') },
          { path: 'providers/:id', lazy: page(pub, 'ProviderProfilePage') },
          { path: 'for-providers', lazy: page(pub, 'ForProvidersPage') },
          { path: 'about', lazy: page(pub, 'AboutPage') },
          { path: 'contact', lazy: page(pub, 'ContactPage') },
          { path: 'privacy', lazy: page(pub, 'PrivacyPage') },
          {
            element: (
              <RequireAuth>
                <RequireRole role="user" />
              </RequireAuth>
            ),
            children: [
              { path: 'providers/:id/request', lazy: page(customer, 'RequestFormPage') },
              { path: 'requests/:ref/sent', lazy: page(customer, 'RequestSentPage') },
              {
                element: <CustomerLayout />,
                children: [
                  { path: 'requests', lazy: page(customer, 'MyRequestsPage') },
                  { path: 'requests/:ref', lazy: page(customer, 'CustomerRequestPage') },
                  { path: 'requests/:ref/review', lazy: page(customer, 'LeaveReviewPage') },
                  ...when(features.savedProviders, { path: 'saved', lazy: page(customer, 'SavedPage') }),
                  { path: 'account', lazy: page(customer, 'AccountPage') },
                ],
              },
              {
                path: 'become-a-provider',
                element: <RedirectPublishedProvider />,
                children: [
                  { path: 'done', lazy: page(onboarding, 'OnboardingDonePage') },
                  { path: ':step', lazy: page(onboarding, 'BecomeProviderPage') },
                ],
              },
            ],
          },
          ...(import.meta.env.DEV
            ? [
                { path: 'dev/ui', lazy: page(dev, 'DevUiPage') },
                { path: 'dev/throw', lazy: page(dev, 'DevThrowPage') },
              ]
            : []),
          { path: '*', element: <NotFoundPage area="public" /> },
        ]),
      },
      /* ---------- L1-auth ---------- */
      {
        element: <AuthLayout />,
        children: withBoundary([
          {
            element: <RequireGuest />,
            children: [
              { path: 'login', lazy: page(auth, 'LoginPage') },
              { path: 'signup', lazy: page(auth, 'SignupPage') },
              { path: 'forgot-password', lazy: page(auth, 'ForgotPasswordPage') },
            ],
          },
          { path: 'signup/check-email', lazy: page(auth, 'CheckEmailPage') },
          { path: 'auth/confirm', lazy: page(auth, 'ConfirmEmailPage') },
          { path: 'auth/google/done', lazy: page(auth, 'GoogleDonePage') },
          { path: 'reset-password', lazy: page(auth, 'ResetPasswordPage') },
        ]),
      },
      {
        path: 'admin/login',
        element: <AuthLayout logoOnly />,
        children: withBoundary([
          {
            element: <RequireGuest area="admin" />,
            children: [{ index: true, lazy: page(auth, 'AdminLoginPage') }],
          },
        ]),
      },
      /* ---------- L3 provider ---------- */
      {
        path: 'dashboard',
        element: (
          <RequireAuth>
            <RequireRole
              role="user"
              forbidden={
                <PublicLayout>
                  <ForbiddenPage />
                </PublicLayout>
              }
            >
              <RequireProvider>
                <ProviderLayout />
              </RequireProvider>
            </RequireRole>
          </RequireAuth>
        ),
        children: withBoundary([
          { index: true, lazy: page(provider, 'ProviderOverviewPage') },
          { path: 'requests', lazy: page(provider, 'ProviderRequestsPage') },
          { path: 'requests/:ref', lazy: page(provider, 'ProviderRequestPage') },
          { path: 'services', lazy: page(provider, 'ServicesPage') },
          { path: 'profile', lazy: page(provider, 'BusinessProfilePage') },
          { path: 'areas', lazy: page(provider, 'ServiceAreasPage') },
          { path: 'verification', lazy: page(provider, 'VerificationPage') },
          ...when(features.providerReviews || features.replies, {
            path: 'reviews',
            lazy: page(provider, 'ProviderReviewsPage'),
          }),
          ...when(features.pause, { path: 'settings', lazy: page(provider, 'ProviderSettingsPage') }), // D-b
          { path: '*', element: <NotFoundPage area="provider" /> },
        ]),
      },
      /* ---------- L4 admin ---------- */
      {
        path: 'admin',
        element: (
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        ),
        children: withBoundary([
          { index: true, lazy: page(admin, 'AdminOverviewPage') },
          { path: 'verifications', lazy: page(admin, 'VerificationQueuePage') },
          { path: 'verifications/:id', lazy: page(admin, 'VerificationReviewPage') },
          { path: 'users', lazy: page(admin, 'UsersPage') },
          { path: 'users/:id', lazy: page(admin, 'UserDetailPage') },
          ...when(features.adminRequests, { path: 'requests', lazy: page(admin, 'AdminRequestsPage') }),
          ...when(features.adminRequests, { path: 'requests/:ref', lazy: page(admin, 'AdminRequestPage') }),
          { path: 'reviews', lazy: page(admin, 'ReviewsModerationPage') },
          ...when(features.adminCatalog, { path: 'catalog', lazy: page(admin, 'CatalogPage') }),
          { path: '*', element: <NotFoundPage area="admin" /> },
        ]),
      },
    ],
  },
];
