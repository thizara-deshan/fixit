import { ResponsiveDialog } from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';

/** §6.3 conflict: the request changed while the customer was acting on it. */
export function ConflictDialog({
  open,
  onOpenChange,
  body,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  body: string;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      align="center"
      title="This request has changed"
      description={body}
      footer={
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            onOpenChange(false);
          }}
        >
          OK
        </Button>
      }
    />
  );
}
