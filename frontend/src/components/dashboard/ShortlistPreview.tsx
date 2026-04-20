'use client';

import type { ScreeningResult } from '@/store';
import { Panel } from '../ui/Panel';

export function ShortlistPreview({ result }: { result: ScreeningResult | null }) {
  const shortlist = result?.shortlist ?? [];

  return (
    <Panel title="Auditable Shortlist Preview">
      {shortlist.length === 0 ? (
        <p className="text-white/60 text-sm">No shortlist yet. Start a screening to inspect evidence and score breakdowns.</p>
      ) : (
        <div className="space-y-3">
          {shortlist.slice(0, 3).map((candidate) => (
            <article key={candidate.applicantId} className="rounded border border-white/10 bg-black/20 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">Rank #{candidate.rank}</p>
                <p className="text-cyan-300 text-sm">Score {candidate.overallScore}</p>
              </div>
              <p className="text-sm text-white/70">Recommendation: {candidate.recommendation}</p>
              <p className="text-sm text-white/70">Evidence: {(candidate.evidence || []).slice(0, 2).join(' | ') || 'N/A'}</p>
              <p className="text-xs text-white/50">
                Weighted: S {candidate.scoreBreakdown?.weightedSkills ?? 0}, E {candidate.scoreBreakdown?.weightedExperience ?? 0}, Ed {candidate.scoreBreakdown?.weightedEducation ?? 0}, R {candidate.scoreBreakdown?.weightedRelevance ?? 0}
              </p>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
