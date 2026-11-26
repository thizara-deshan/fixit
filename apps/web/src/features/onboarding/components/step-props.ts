import type { CatalogResponse, Me, OwnProvider } from '@fixit/contracts';
export interface StepProps {
  me: Me;
  own: OwnProvider | null;
  catalog: CatalogResponse;
  onBack: () => void;
  onSaved: () => void; // page navigates to the next step (D-2)
  onDirtyChange: (dirty: boolean) => void;
}
