'use client';

import type { ScreeningResult } from '@/store';
import { Panel } from '../ui/Panel';

export function ReviewQueueCard({ result }: { result: ScreeningResult | null }) {
  const queue = result?.shortlist.filter((c) => c.needsHumanReview) ?? [];

  return (
    <Panel title="Review Queue">
      {queue.length === 0 ? (
        <p className="text-white/60 text-sm">No flagged candidates yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {queue.slice(0, 5).map((candidate) => (
            <li key={candidate.applicantId} className="rounded border border-amber-400/30 bg-amber-500/10 p-3">
              <p className="font-medium">Candidate #{candidate.rank}</p>
              <p className="text-white/70">Confidence: {candidate.confidenceScore}</p>
              <p className="text-white/70">Reason: {candidate.uncertaintyReasons.join(', ')}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
