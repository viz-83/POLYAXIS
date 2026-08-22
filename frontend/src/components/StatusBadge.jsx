const MAP = {
  pass: { cls: 'badge-green', icon: '✅', label: 'Compatible' },
  compliant: { cls: 'badge-green', icon: '✅', label: 'Compliant' },
  conditional: { cls: 'badge-amber', icon: '⚠️', label: 'Conditional' },
  fail: { cls: 'badge-red', icon: '❌', label: 'Incompatible' },
  'non-compliant': { cls: 'badge-red', icon: '❌', label: 'Non-Compliant' },
};

export default function StatusBadge({ status, label }) {
  const meta = MAP[status] || MAP.conditional;
  return (
    <span className={meta.cls}>
      <span aria-hidden="true">{meta.icon}</span>
      {label || meta.label}
    </span>
  );
}
