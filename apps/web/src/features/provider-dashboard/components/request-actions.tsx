import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ProviderRequestView } from '@fixit/contracts';
import { ConflictDialog } from '@/components/conflict-dialog';
import { REQUEST_LABEL } from '@/components/status-pill';
import { qk } from '@/lib/query-keys';
import { fetchInboxRequest } from '../api';
import { AcceptDialog } from './accept-dialog';
import { CompleteDialog } from './complete-dialog';
import { DeclineDialog } from './decline-dialog';

type Kind = 'accept' | 'decline' | 'complete';

export interface RequestActions {
  openAccept: (view: ProviderRequestView) => void;
  openDecline: (view: ProviderRequestView) => void;
  openComplete: (view: ProviderRequestView) => void;
  /** D-6: refresh, then explain. Also used by the inline price editor. */
  onConflict: (ref: string) => void;
  /** Render once per page. */
  dialogs: ReactNode;
}

export function useRequestActions(): RequestActions {
  const qc = useQueryClient();
  const [active, setActive] = useState<{ kind: Kind; view: ProviderRequestView } | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  const onConflict = (ref: string) => {
    void qc.invalidateQueries({ queryKey: [...qk.inbox.all, 'list'] });
    void qc.invalidateQueries({ queryKey: qk.dashboard });
    void qc
      .query({ queryKey: qk.inbox.detail(ref), queryFn: () => fetchInboxRequest(ref), staleTime: 0 })
      .then(
        (v) => {
          setConflict(`It's now ${REQUEST_LABEL[v.status]}, so this action isn't available.`);
        },
        () => undefined, // the page's own query shows the error state
      );
  };
  const open = (kind: Kind) => (view: ProviderRequestView) => {
    setActive({ kind, view });
  };
  const onOpenChange = (o: boolean) => {
    if (!o) setActive(null);
  };
  const props = active ? { view: active.view, open: true, onOpenChange, onConflict } : null;

  return {
    openAccept: open('accept'),
    openDecline: open('decline'),
    openComplete: open('complete'),
    onConflict,
    dialogs: (
      <>
        {props && active?.kind === 'accept' && <AcceptDialog key={props.view.ref} {...props} />}
        {props && active?.kind === 'decline' && <DeclineDialog key={props.view.ref} {...props} />}
        {props && active?.kind === 'complete' && <CompleteDialog key={props.view.ref} {...props} />}
        <ConflictDialog
          open={conflict !== null}
          onOpenChange={(o) => {
            if (!o) setConflict(null);
          }}
          body={conflict ?? ''}
        />
      </>
    ),
  };
}
