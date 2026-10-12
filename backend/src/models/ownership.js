// Records created through the public API belong to the browser that created them. The browser sends a random
// client key; only its SHA-256 hash is stored, it is never selected by default, and it is stripped from output.
export function ownedRecord(schema) {
  schema.add({ ownerKeyHash: { type: String, index: true, select: false } });
  const hide = (_doc, ret) => { delete ret.ownerKeyHash; return ret; };
  schema.set('toJSON', { transform: hide });
  schema.set('toObject', { transform: hide });
}
