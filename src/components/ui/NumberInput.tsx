interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function NumberInput({ label, value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-on-surface-variant pr-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        className="w-full bg-surface-container-high border-none rounded-xl p-3 text-center font-bold focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
