import { useId, useRef, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import {
  checkUpload,
  UPLOAD_COPY,
  UPLOAD_LIMITS,
  type CategoryIcon as CategoryIconName,
} from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';
import { readImageSize } from '@/lib/image-size';
import { notify, notifyError } from '@/lib/toast';
import { useUpload } from '@/lib/use-upload';

export interface PhotoUploaderProps {
  photoUrl: string | null;
  categoryIcon: CategoryIconName | null;
  upload: (file: File, signal: AbortSignal) => Promise<{ photoUrl: string }>;
  onUploaded: (photoUrl: string) => void;
  remove: () => Promise<void>;
}

export function PhotoUploader({ photoUrl, categoryIcon, upload, onUploaded, remove }: PhotoUploaderProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const { state, start, fail, reset } = useUpload('photo', upload);
  const [confirm, setConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const uploading = state.status === 'uploading';

  async function pick(file: File) {
    reset();
    const problem = checkUpload('photo', { mimeType: file.type, sizeBytes: file.size });
    if (problem) {
      fail(UPLOAD_COPY.photo[problem]);
      return;
    }
    const size = await readImageSize(file);
    if (!size) {
      fail(UPLOAD_COPY.photo.type);
      return;
    }
    if (size.width < UPLOAD_LIMITS.photo.minPx || size.height < UPLOAD_LIMITS.photo.minPx) {
      fail(UPLOAD_COPY.photo.dimensions);
      return;
    }
    const result = await start(file);
    if (result) onUploaded(result.photoUrl);
  }

  async function confirmRemove() {
    setRemoving(true);
    try {
      await remove();
      setConfirm(false);
      notify('Photo removed.');
    } catch {
      notifyError("Couldn't remove. Try again.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
      <div className="flex flex-col gap-2">
        <div className="size-[160px] shrink-0 overflow-hidden rounded-2xl">
          {photoUrl ? (
            <img src={photoUrl} alt="Your profile photo" className="size-full object-cover" />
          ) : (
            <div className="bg-primary-soft text-primary grid size-full place-items-center">
              {categoryIcon ? (
                <CategoryIcon icon={categoryIcon} className="size-14" />
              ) : (
                <ImageIcon aria-hidden="true" className="size-14" />
              )}
            </div>
          )}
        </div>
        {state.status === 'uploading' && (
          <div
            role="progressbar"
            aria-label={`Uploading ${state.fileName}`}
            className="bg-primary-soft h-2.5 w-[160px] overflow-hidden rounded-full"
          >
            <div className="bg-primary h-full w-1/3 animate-pulse rounded-full motion-reduce:animate-none" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <p id={`${id}-help`} className="text-meta text-text-muted">
          {UPLOAD_COPY.photo.help}
        </p>
        {state.status === 'error' && (
          <p role="alert" className="text-meta text-danger-text">
            {state.message}
          </p>
        )}
        <input
          ref={input}
          type="file"
          accept={UPLOAD_LIMITS.photo.mimeTypes.join(',')}
          aria-describedby={`${id}-help`}
          className="sr-only"
          aria-label={photoUrl ? 'Replace photo' : 'Upload photo'}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void pick(f);
          }}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            className="w-full sm:w-auto"
            onClick={() => input.current?.click()}
          >
            {photoUrl ? 'Replace' : 'Upload photo'}
          </Button>
          {photoUrl && (
            <Button
              type="button"
              variant="secondary"
              disabled={uploading}
              className="w-full sm:w-auto"
              onClick={() => {
                setConfirm(true);
              }}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
      <ResponsiveDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Remove your photo?"
        dismissible={!removing}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={removing}
              onClick={() => {
                setConfirm(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={removing}
              aria-busy={removing}
              onClick={() => void confirmRemove()}
            >
              Remove
            </Button>
          </>
        }
      />
    </div>
  );
}
