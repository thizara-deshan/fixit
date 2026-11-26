export interface MultipartPart {
  name: string;
  fileName: string | null;
  mimeType: string | null;
  bytes: Uint8Array<ArrayBuffer>;
  text: string;
}

/** D-8: small multipart/form-data reader (undici's formData() is unreliable under jsdom). Empty map if not multipart. */
export async function readMultipart(request: Request): Promise<Map<string, MultipartPart>> {
  const out = new Map<string, MultipartPart>();
  const contentType = request.headers.get('content-type') ?? '';
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  const boundary = match?.[1] ?? match?.[2];
  if (!contentType.toLowerCase().startsWith('multipart/form-data') || !boundary) return out;
  // TextDecoder('latin1') is windows-1252 (0x80–0x9F remapped), so map bytes to chars one to one.
  const raw = Array.from(new Uint8Array(await request.arrayBuffer()), (b) => String.fromCharCode(b)).join('');
  for (const chunk of raw.split(`--${boundary}`)) {
    const sep = chunk.indexOf('\r\n\r\n');
    if (sep < 0) continue;
    const head = chunk.slice(0, sep);
    const body = chunk.slice(sep + 4).replace(/\r\n$/, '');
    const name = /name="([^"]*)"/i.exec(head)?.[1];
    if (!name) continue;
    out.set(name, {
      name,
      fileName: /filename="([^"]*)"/i.exec(head)?.[1] ?? null,
      mimeType: /content-type:\s*([^\r\n]+)/i.exec(head)?.[1]?.trim() ?? null,
      bytes: Uint8Array.from(body, (c) => c.charCodeAt(0)),
      text: body,
    });
  }
  return out;
}
