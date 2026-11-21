// Local rules enforcing CLAUDE.md. Plain RegExp (not esquery selectors) so the patterns are exact.
const COLOR_PATTERNS = [
  /#[0-9a-fA-F]{3,8}\b/,
  /rgba?\(/,
  /\b(bg|text|border|ring|fill|stroke|from|to|via|shadow|outline|decoration)-\[/,
];
const REFERENCE = /(^|\/)reference(\/|$)/;

const noRawColors = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      raw: 'Use design tokens from globals.css @theme (e.g. bg-primary, bg-cta). No raw hex/rgb or arbitrary colour/size classes.',
    },
  },
  create(context) {
    const check = (node, text) => {
      if (COLOR_PATTERNS.some((p) => p.test(text))) context.report({ node, messageId: 'raw' });
    };
    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.raw);
      },
    };
  },
};

const noReferenceImport = {
  meta: {
    type: 'problem',
    schema: [],
    messages: { ref: 'Never import from reference/ at runtime. Copy what you need into fixtures or code.' },
  },
  create(context) {
    const check = (node) => {
      const src = node.source;
      if (src && src.type === 'Literal' && typeof src.value === 'string' && REFERENCE.test(src.value)) {
        context.report({ node: src, messageId: 'ref' });
      }
    };
    return {
      ImportDeclaration: check,
      ImportExpression: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    };
  },
};

export default {
  meta: { name: 'fixit' },
  rules: { 'no-raw-colors': noRawColors, 'no-reference-import': noReferenceImport },
};
