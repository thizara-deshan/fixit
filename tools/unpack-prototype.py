#!/usr/bin/env python3
"""Unpack the Claude Design offline prototype bundle into readable files.

Usage:
    python3 -I tools/unpack-prototype.py "reference/prototype/Fixit - Prototype (offline).html" reference/prototype/unpacked

Writes:
    source.html   full page template (styles included, fonts stripped)
    markup.html   the page markup with inline styles removed (easy to read structure)
    logic.js      the prototype's component logic (routing, filters, derived values)
    data.json     the sample data (categories, locations, providers, requests)
    colors.txt    every hex color in the source, by frequency (input for design tokens)
Only the Python standard library is used. The bundle is never executed.
"""
import base64, collections, gzip, json, os, re, sys

def main(src_path: str, out_dir: str) -> None:
    src = open(src_path, encoding="utf-8").read()
    os.makedirs(out_dir, exist_ok=True)

    def island(kind: str) -> str:
        m = re.search(r'<script type="__bundler/%s">(.*?)</script>' % re.escape(kind), src, re.S)
        if not m:
            sys.exit(f"bundle island '{kind}' not found - is this a Claude Design offline export?")
        return m.group(1)

    template = json.loads(island("template"))
    # drop @font-face blocks: huge and irrelevant for reading
    no_fonts = re.sub(r"@font-face\s*\{[^}]*\}\s*", "", template)
    no_fonts = re.sub(r"/\*[^*]*\*/\s*", "", no_fonts)
    write(out_dir, "source.html", no_fonts)

    body = re.search(r"<x-dc>(.*?)</x-dc>", template, re.S)
    markup = body.group(1) if body else template
    markup = re.sub(r"<helmet>.*?</helmet>", "", markup, flags=re.S)
    markup = re.sub(r'\s(style|class)="[^"]*"', "", markup)
    markup = "\n".join(l for l in markup.splitlines() if l.strip())
    write(out_dir, "markup.html", markup)

    logic = re.search(r'<script type="text/x-dc"[^>]*>(.*?)</script>', template, re.S)
    if logic:
        code = logic.group(1)
        data = re.search(r"static DATA = (\{.*?\});\n", code)
        if data:
            write(out_dir, "data.json", json.dumps(json.loads(data.group(1)), indent=2))
            code = code.replace(data.group(1), "/* see data.json */ {}")
        write(out_dir, "logic.js", code.strip() + "\n")

    colors = collections.Counter(c.upper() for c in re.findall(r"#[0-9A-Fa-f]{6}\b", template))
    write(out_dir, "colors.txt", "\n".join(f"{n:4d}  {c}" for c, n in colors.most_common()) + "\n")

    # sanity: the manifest exists and decodes (assets are fonts/runtime, not needed for reading)
    manifest = json.loads(island("manifest"))
    for entry in manifest.values():
        raw = base64.b64decode(entry["data"])
        if entry.get("compressed"):
            gzip.decompress(raw)
    print(f"unpacked {len(manifest)} bundled assets; wrote readable files to {out_dir}")

def write(out_dir: str, name: str, text: str) -> None:
    with open(os.path.join(out_dir, name), "w", encoding="utf-8") as f:
        f.write(text)
    print("  ", os.path.join(out_dir, name))

if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
