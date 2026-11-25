import { beforeEach, describe, expect, it } from 'vitest';
import { MOCK_DB_KEY } from './schema';
import { commit, db, forgetDbCache, resetDemoData } from './store';

const NOW = new Date('2026-11-22T04:30:00.000Z');

describe('mock db store', () => {
  beforeEach(() => {
    localStorage.clear();
    forgetDbCache();
  });
  it('seeds when storage is empty and persists under fixit.mockdb.v2', () => {
    expect(db().users['u-olivia']?.email).toBe('olivia@fixit.test');
    expect(localStorage.getItem(MOCK_DB_KEY)).not.toBeNull();
    expect(MOCK_DB_KEY).toBe('fixit.mockdb.v2');
  });
  it('commit() persists changes that survive a reload', () => {
    resetDemoData(NOW);
    const olivia = db().users['u-olivia'];
    if (olivia) olivia.fullName = 'Changed Name';
    commit();
    forgetDbCache();
    expect(db().users['u-olivia']?.fullName).toBe('Changed Name');
  });
  it('resetDemoData restores the seed', () => {
    resetDemoData(NOW);
    const olivia = db().users['u-olivia'];
    if (olivia) olivia.fullName = 'Changed Name';
    commit();
    resetDemoData(NOW);
    expect(db().users['u-olivia']?.fullName).toBe('Olivia Martinez');
    expect(db().seededAt).toBe(NOW.toISOString());
  });
  it('reseeds when the stored version differs', () => {
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify({ version: 0 }));
    expect(db().version).toBe(2);
  });
});
