'use client';

export function MetricCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-white/60 text-sm">{label}</p>
      <p className="text-3xl font-semibold mt-2">{value}</p>
      {hint ? <p className="text-xs text-cyan-300 mt-2">{hint}</p> : null}
    </div>
  );
}
