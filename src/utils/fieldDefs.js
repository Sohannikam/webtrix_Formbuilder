// src/utils/fieldDefs.js

// Plain JS helper to merge local + dynamic fields, apply labels, and skip keys.
export function makeFieldDefs({
  baseSchema = [],    // e.g. directSchemaTemplate
  dynamicSchema = [], // your custom fields array
  labels = {},        // e.g. columnLabels
  skip = [],          // e.g. skipFields
} = {}) {
  const toDef = (f) => {
    if (!f) return null;
    const key = f.Field || f.key;               // support both shapes
    if (!key || skip.includes(key)) return null;

    const label =
      labels[key] ||
      key.replace(/_/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase());

    return { key, label };
  };

  const dedup = new Map();
  // No TS iterators, no downlevelIteration needed
  [].concat(baseSchema, dynamicSchema).forEach((f) => {
    const d = toDef(f);
    if (d && !dedup.has(d.key)) dedup.set(d.key, d);
  });

  const out = [];
  dedup.forEach((v) => out.push(v));
  return out;
}

// Also provide default export for convenience
export default makeFieldDefs;
