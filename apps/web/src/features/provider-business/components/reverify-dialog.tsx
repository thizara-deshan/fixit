import { LoaderCircle } from 'lucide-react';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';

export function ReverifyDialog({
  open,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title="Save and re-verify?"
      description="Your Verified badge will be removed and your listing goes back to review. We'll email you when it's checked."
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" className="w-full sm:w-auto" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={pending}
            aria-busy={pending || undefined}
            onClick={onConfirm}
          >
            {pending && (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            )}
            {pending ? 'Saving…' : 'Save and re-verify'}
          </Button>
        </>
      }
    />
  );
}
