import { ResponsiveDialog } from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';

/** §6.3 conflict: the request changed while the user was acting on it. */
export function ConflictDialog({
  open,
  onOpenChange,
  body,
  title = 'This request has changed',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  body: string;
  title?: string;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      align="center"
      title={title}
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
