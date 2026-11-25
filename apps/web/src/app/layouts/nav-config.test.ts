import { describe, expect, it } from 'vitest';
import { db } from '@/mocks/db/store';
import { buildMe } from '@/mocks/lib/me';
import { features } from '@/lib/features';
import {
  accountMenuItems,
  adminSidebarItems,
  isPublicLinkActive,
  providerSidebarItems,
  publicNavLinks,
  viewerRole,
} from './nav-config';

const me = (id: string) => buildMe(db(), id);
const allOn = Object.fromEntries(Object.keys(features).map((k) => [k, true])) as typeof features;

describe('nav config', () => {
  it('top links per role (SPEC L1)', () => {
    expect(publicNavLinks('guest').map((l) => l.label)).toEqual(['Home', 'Find Providers', 'For Providers']);
    expect(publicNavLinks(viewerRole(me('u-olivia'))).map((l) => l.label)).toEqual([
      'Home',
      'Find Providers',
      'My requests',
    ]);
    expect(publicNavLinks(viewerRole(me('u-marcus'))).map((l) => l.label)).toEqual([
      'Home',
      'Find Providers',
      'My requests',
    ]);
    expect(publicNavLinks(viewerRole(me('u-admin'))).map((l) => l.label)).toEqual(['Home', 'Find Providers']);
  });
  it('active link rules', () => {
    expect(isPublicLinkActive('home', '/')).toBe(true);
    expect(isPublicLinkActive('home', '/discover')).toBe(false);
    expect(isPublicLinkActive('discover', '/providers/p01')).toBe(true);
    expect(isPublicLinkActive('myRequests', '/requests/FX-2061')).toBe(true);
    expect(isPublicLinkActive('myRequests', '/account')).toBe(true);
    expect(isPublicLinkActive('forProviders', '/for-providers')).toBe(true);
  });
  it('avatar menu (AC2): no Saved while F-10 is off; Become a provider vs Provider dashboard', () => {
    expect(accountMenuItems(me('u-olivia')).map((i) => i.label)).toEqual([
      'My requests',
      'Account settings',
      'Become a provider',
    ]);
    expect(accountMenuItems(me('u-olivia')).at(-1)?.to).toBe('/become-a-provider/1');
    expect(accountMenuItems(me('u-kasun')).at(-1)?.to).toBe('/become-a-provider/3');
    expect(accountMenuItems(me('u-marcus')).map((i) => i.label)).toEqual([
      'My requests',
      'Account settings',
      'Provider dashboard',
    ]);
    expect(accountMenuItems(me('u-olivia'), allOn).map((i) => i.label)).toContain('Saved providers');
  });
  it('provider sidebar (AC3): flagged items hidden; count and dot', () => {
    const marcus = me('u-marcus');
    const items = providerSidebarItems(marcus);
    expect(items.map((i) => i.label)).toEqual([
      'Dashboard',
      'Requests',
      'My Services',
      'Profile',
      'Service areas',
      'Verification',
    ]);
    expect(items[1]?.count).toBe(marcus.provider?.pendingRequestCount || undefined);
    expect(items.find((i) => i.label === 'Verification')?.dot).toBeUndefined();
    expect(providerSidebarItems(me('u-hank')).find((i) => i.label === 'Verification')?.dot).toBe(true);
    expect(providerSidebarItems(marcus, allOn)).toHaveLength(8);
  });
  it('admin sidebar (AC3): no Requests / Categories while flags are off', () => {
    expect(adminSidebarItems().map((i) => i.label)).toEqual(['Overview', 'Verification', 'Users', 'Reviews']);
    expect(adminSidebarItems(allOn)).toHaveLength(6);
  });
});
