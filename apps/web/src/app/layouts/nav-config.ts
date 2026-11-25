import type { Me } from '@fixit/contracts';
import {
  BriefcaseBusiness,
  ChartColumn,
  ClipboardList,
  Heart,
  Inbox,
  LayoutDashboard,
  Map,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  Tags,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { features as defaultFeatures, type FeatureFlag } from '@/lib/features';

type Flags = Readonly<Record<FeatureFlag, boolean>>;
export type ViewerRole = 'guest' | 'customer' | 'provider' | 'admin';

export function viewerRole(me: Me | null): ViewerRole {
  if (!me) return 'guest';
  if (me.roles.includes('admin')) return 'admin';
  return me.roles.includes('provider') ? 'provider' : 'customer';
}

/* ---------- L1 top links ---------- */
export type PublicLinkId = 'home' | 'discover' | 'forProviders' | 'myRequests';
export interface PublicLink {
  id: PublicLinkId;
  label: string;
  to: string;
}
const LINK: Record<PublicLinkId, PublicLink> = {
  home: { id: 'home', label: 'Home', to: '/' },
  discover: { id: 'discover', label: 'Find Providers', to: '/discover' },
  forProviders: { id: 'forProviders', label: 'For Providers', to: '/for-providers' },
  myRequests: { id: 'myRequests', label: 'My requests', to: '/requests' },
};

export function publicNavLinks(role: ViewerRole): PublicLink[] {
  if (role === 'guest') return [LINK.home, LINK.discover, LINK.forProviders];
  if (role === 'admin') return [LINK.home, LINK.discover];
  return [LINK.home, LINK.discover, LINK.myRequests];
}

/** SPEC L1 active link rules. */
export function isPublicLinkActive(id: PublicLinkId, pathname: string): boolean {
  switch (id) {
    case 'home':
      return pathname === '/';
    case 'discover':
      return pathname === '/discover' || pathname.startsWith('/providers/');
    case 'myRequests':
      return pathname.startsWith('/requests') || pathname === '/saved' || pathname === '/account';
    case 'forProviders':
      return pathname === '/for-providers';
  }
}

/* ---------- Avatar menu (also the signed-in part of the phone sheet) ---------- */
export interface MenuItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export function accountMenuItems(me: Me, f: Flags = defaultFeatures): MenuItem[] {
  const items: MenuItem[] = [{ label: 'My requests', to: '/requests', icon: Inbox }];
  if (f.savedProviders) items.push({ label: 'Saved providers', to: '/saved', icon: Heart });
  items.push({ label: 'Account settings', to: '/account', icon: User });
  items.push(
    me.roles.includes('provider')
      ? { label: 'Provider dashboard', to: '/dashboard', icon: LayoutDashboard }
      : {
          label: 'Become a provider',
          to: `/become-a-provider/${String(me.provider?.onboarding.step ?? 1)}`,
          icon: BriefcaseBusiness,
        },
  );
  return items;
}

/* ---------- L2 section tabs ---------- */
export function customerTabs(f: Flags = defaultFeatures): { value: string; label: string; to: string }[] {
  return [
    { value: 'requests', label: 'My requests', to: '/requests' },
    ...(f.savedProviders ? [{ value: 'saved', label: 'Saved', to: '/saved' }] : []),
    { value: 'account', label: 'Account', to: '/account' },
  ];
}

/* ---------- L3 / L4 sidebar ---------- */
export interface SidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** NavLink `end` (index routes). */
  end?: boolean;
  count?: number;
  /** Screen-reader text for the count, e.g. "3 new requests". */
  countLabel?: string;
  /** 8×8 warning dot. */
  dot?: boolean;
}

export function providerSidebarItems(me: Me, f: Flags = defaultFeatures): SidebarItem[] {
  const p = me.provider;
  const pending = p?.pendingRequestCount ?? 0;
  const needsVerification = p?.verificationStatus === 'not_submitted' || p?.verificationStatus === 'rejected';
  const items: SidebarItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    {
      to: '/dashboard/requests',
      label: 'Requests',
      icon: Inbox,
      ...(pending > 0 ? { count: pending, countLabel: `${String(pending)} new requests` } : {}),
    },
    { to: '/dashboard/services', label: 'My Services', icon: BriefcaseBusiness },
    { to: '/dashboard/profile', label: 'Profile', icon: User },
    { to: '/dashboard/areas', label: 'Service areas', icon: Map },
    {
      to: '/dashboard/verification',
      label: 'Verification',
      icon: ShieldCheck,
      ...(needsVerification ? { dot: true } : {}),
    },
  ];
  if (f.providerReviews || f.replies) items.push({ to: '/dashboard/reviews', label: 'Reviews', icon: Star });
  if (f.pause) items.push({ to: '/dashboard/settings', label: 'Settings', icon: Settings }); // D-b
  return items;
}

export function adminSidebarItems(f: Flags = defaultFeatures): SidebarItem[] {
  return [
    { to: '/admin', label: 'Overview', icon: ChartColumn, end: true },
    { to: '/admin/verifications', label: 'Verification', icon: ShieldCheck }, // count wired in M13 (D-d)
    { to: '/admin/users', label: 'Users', icon: Users },
    ...(f.adminRequests ? [{ to: '/admin/requests', label: 'Requests', icon: ClipboardList }] : []),
    { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
    ...(f.adminCatalog ? [{ to: '/admin/catalog', label: 'Categories & towns', icon: Tags }] : []),
  ];
}

/* ---------- Footer ---------- */
export interface FooterColumn {
  title: string;
  links: { label: string; to: string }[];
}

export function footerColumns(role: ViewerRole): FooterColumn[] {
  const guest = role === 'guest';
  return [
    {
      title: 'Customers',
      links: [
        { label: 'Find Providers', to: '/discover' },
        { label: 'How it works', to: '/#how-it-works' },
        { label: 'My requests', to: '/requests' },
      ],
    },
    {
      title: 'Providers',
      links: [
        { label: 'For Providers', to: '/for-providers' },
        { label: 'Get verified', to: guest ? '/for-providers' : '/dashboard/verification' },
        { label: 'Dashboard', to: guest ? '/login?next=%2Fdashboard' : '/dashboard' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', to: '/about' },
        { label: 'Contact', to: '/contact' },
        { label: 'Privacy', to: '/privacy' },
      ],
    },
  ];
}
