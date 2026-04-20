'use client';

import type { ScreeningQualityMetrics } from '@/store';
import { Panel } from '../ui/Panel';

export function AIContractCard({ quality }: { quality: ScreeningQualityMetrics | null }) {
  return (
    <Panel title="AI Contract">
      {!quality ? (
        <p className="text-white/60 text-sm">Run screening to see model, prompt version, fallback mode, and quality metrics.</p>
      ) : (
        <ul className="text-sm text-white/80 space-y-1">
          <li>Model: {quality.transparentContract.modelUsed}</li>
          <li>Prompt: {quality.transparentContract.promptVersion}</li>
          <li>Processing: {quality.transparentContract.processingTimeMs} ms</li>
          <li>Fallback Used: {String(quality.transparentContract.fallbackUsed)}</li>
          <li>Precision@K Proxy: {quality.precisionAtKProxy}</li>
          <li>Avg Confidence: {quality.averageConfidence}</li>
          <li>Human Review Rate: {quality.humanReviewRate}</li>
        </ul>
      )}
    </Panel>
  );
}
