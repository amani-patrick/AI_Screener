'use client';

import { Panel } from '../ui/Panel';

export function GuardrailsCard() {
  return (
    <Panel title="Human-in-Control Guardrails">
      <ul className="text-sm text-white/80 space-y-2 list-disc list-inside">
        <li>Every candidate includes confidence and uncertainty reasons.</li>
        <li>Low-confidence profiles are explicitly flagged for human review.</li>
        <li>API responses include final decision note that AI is non-automated.</li>
        <li>Idempotency key prevents accidental duplicate screening jobs.</li>
      </ul>
    </Panel>
  );
}
