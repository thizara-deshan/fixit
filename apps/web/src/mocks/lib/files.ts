/** ARCH §4.3: uploaded bytes live only for this page session. Keys: `photo:{key}`, `doc:{id}`. */
const mem = new Map<string, Blob>();
const PLACEHOLDER_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const putFile = (key: string, blob: Blob): void => {
  mem.set(key, blob);
};
export const getFile = (key: string): Blob | undefined => mem.get(key);
export const deleteFile = (key: string): void => {
  mem.delete(key);
};
/** 1×1 transparent PNG served after a reload (metadata survived, bytes didn't). */
export const placeholderFile = (): Blob =>
  new Blob([Uint8Array.from(atob(PLACEHOLDER_PNG), (c) => c.charCodeAt(0))], { type: 'image/png' });
