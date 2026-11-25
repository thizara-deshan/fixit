import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoute } from '@/test/render';
import { setViewportWidth } from '@/test/media';
import { armForcedError } from '@/mocks/lib/controls';
import { db } from '@/mocks/db/store';

/** Adds `count` listed clones of p01 for paging tests. */
function addClones(count: number) {
  const d = db();
  const src = d.providers.p01;
  if (!src) throw new Error('fixture p01 missing');
  for (let i = 0; i < count; i++) {
    const id = `px${String(i)}`;
    d.providers[id] = { ...src, id, businessName: `Clone ${String(i).padStart(2, '0')}` };
    d.areas.push({ providerId: id, townId: src.baseTownId ?? 'colombo', isBase: true });
  }
}

describe('DiscoverPage', () => {
  beforeEach(() => {
    // jsdom has no scrollIntoView; the page calls it when `page` changes (S2.E12)
    Element.prototype.scrollIntoView = vi.fn();
  });
  it('AC1: q=plumb&loc prefilled, Plumbing ticked, heading and context', async () => {
    renderRoute('/discover?q=plumb&loc=dehiwala-mount-lavinia');
    expect(await screen.findByRole('heading', { level: 1, name: /providers? found$/ })).toBeInTheDocument();
    expect(screen.getByText('Showing Plumbing in Dehiwala-Mount Lavinia')).toBeInTheDocument();
    expect(screen.getByDisplayValue('plumb')).toBeInTheDocument();
    const panel = screen.getByRole('complementary', { name: 'Filters' });
    expect(within(panel).getByRole('checkbox', { name: /Plumbing/ })).toBeChecked();
  });
  it('AC2: ticking a category updates the URL and clears a matched q', async () => {
    const { location } = renderRoute('/discover?q=plumb');
    const panel = await screen.findByRole('complementary', { name: 'Filters' });
    await userEvent.click(await within(panel).findByRole('checkbox', { name: /Electrical/ }));
    await waitFor(() => {
      expect(location()).toBe('/discover?cat=plumbing%2Celectrical');
    });
  });
  it('AC2: verified row toggles; AC3 sort resets page', async () => {
    addClones(15);
    const { location } = renderRoute('/discover?page=2');
    const panel = await screen.findByRole('complementary', { name: 'Filters' });
    await userEvent.click(within(panel).getByRole('switch', { name: 'Verified providers only' }));
    await waitFor(() => {
      expect(location()).toBe('/discover?verified=1');
    });
    const sort = screen.getAllByRole('combobox', { name: 'Sort by' })[0];
    if (!sort) throw new Error('sort select missing');
    await userEvent.selectOptions(sort, 'reviews'); // first = desktop
    await waitFor(() => {
      expect(location()).toBe('/discover?verified=1&sort=reviews');
    });
  });
  it('AC4: new search keeps sort, drops rating/price; Clear all resets', async () => {
    const { location } = renderRoute('/discover?q=tap&rating=4&price=2000&sort=reviews');
    const box = await screen.findByDisplayValue('tap');
    await userEvent.clear(box);
    await userEvent.type(box, 'cleaning{Enter}');
    await waitFor(() => {
      expect(location()).toBe('/discover?q=cleaning&cat=cleaning&sort=reviews');
    });
    await userEvent.click(
      within(screen.getByRole('complementary', { name: 'Filters' })).getByRole('button', {
        name: 'Clear all',
      }),
    );
    await waitFor(() => {
      expect(location()).toBe('/discover');
    });
  });
  it('AC4: junk URL renders defaults', async () => {
    renderRoute('/discover?rating=9&page=-1&cat=,,x');
    expect(await screen.findByText('Showing all services in all locations')).toBeInTheDocument();
  });
  it('AC5: pagination appears above 10 results', async () => {
    addClones(15);
    renderRoute('/discover');
    expect(await screen.findByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });
  it('AC7: empty state and Clear filters', async () => {
    const { location } = renderRoute('/discover?q=zzzz-nothing');
    expect(await screen.findByText('No providers match your filters')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => {
      expect(location()).toBe('/discover');
    });
  });
  it('AC7: forced 500 shows a section error with Try again; filters still usable', async () => {
    armForcedError('providers_search', '500');
    renderRoute('/discover');
    expect(await screen.findByText("We couldn't load this.")).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Filters' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: /providers? found$/ })).toBeInTheDocument();
  });
  it('AC6: phone toolbar badge and live count in the sheet', async () => {
    setViewportWidth(390);
    renderRoute('/discover?cat=plumbing&verified=1');
    const btn = await screen.findByRole('button', { name: /Filters/ });
    expect(within(btn).getByText('2')).toBeInTheDocument();
    await userEvent.click(btn);
    expect(await screen.findByRole('button', { name: /^Show \d+ providers?$/ })).toBeInTheDocument();
  });
});
