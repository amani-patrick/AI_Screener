'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
  History, 
  Brain, 
  ArrowLeft, 
  Calendar, 
  Users, 
  Briefcase,
  Clock,
  ChevronRight,
  Award,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye
} from 'lucide-react';
import { AILoader } from '@/components/Loading';
import type { AppDispatch, RootState } from '@/store';
import { fetchScreeningHistory } from '@/store';

export default function ScreeningHistoryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const screening = useSelector((state: RootState) => state.screenings);

  useEffect(() => {
    dispatch(fetchScreeningHistory());
  }, [dispatch]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number | undefined) => {
    if (!ms || ms === 0) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  return (
    <div className="min-h-screen bg-[#0b1020]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link
            href="/screening"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <History className="h-8 w-8 text-purple-400" />
              Screening History
            </h1>
            <p className="text-gray-400 mt-1">View all past AI screening sessions</p>
          </div>
        </motion.div>

        {/* History List */}
        {screening.historyLoading ? (
          <div className="flex items-center justify-center py-20">
            <AILoader text="Loading history..." />
          </div>
        ) : screening.history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 mb-4">
              <History className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No screenings yet</h3>
            <p className="text-gray-400 mb-6">Start your first AI screening to see results here</p>
            <Link
              href="/screening"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Brain className="h-5 w-5" />
              Start Screening
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {screening.history.map((item: any, index: number) => {
              const shortlist = item.shortlist || item.result?.shortlist || [];
              const jobTitle = item.jobTitle || item.job?.title || 'Unknown Job';
              const jobCompany = item.job?.company || 'Unknown Company';
              const totalCandidates = item.result?.totalApplicantsEvaluated || item.totalApplicantsEvaluated || item.applicantsCount || item.applicantIds?.length || 0;
              const processingTime = item.result?.processingTimeMs || item.processingTimeMs;
              const modelUsed = item.result?.modelUsed || item.modelUsed || 'AI Model';
              const fallbackUsed = item.result?.fallbackUsed || item.fallbackUsed;
              
              return (
                <motion.div
                  key={item._id || item.screeningRequestId || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-white/20 transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {jobTitle}
                          </h3>
                          <StatusBadge status={item.status || item.result?.status || 'completed'} />
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-4">
                          {jobCompany}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="h-4 w-4" />
                            {formatDate(item.createdAt || item.completedAt)}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Users className="h-4 w-4" />
                            {totalCandidates} candidates
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="h-4 w-4" />
                            {formatDuration(processingTime)}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Award className="h-4 w-4" />
                            {modelUsed}
                            {fallbackUsed && ' (Fallback)'}
                          </div>
                        </div>

                        {/* Shortlist Preview */}
                        {shortlist.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-sm text-gray-400 mb-3">
                              Top {Math.min(shortlist.length, 3)} of {shortlist.length} shortlisted
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {shortlist.slice(0, 3).map((candidate: any, i: number) => (
                                <div
                                  key={i}
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    candidate.recommendation === 'strong_yes' ? 'bg-emerald-500/20 text-emerald-300' :
                                    candidate.recommendation === 'yes' ? 'bg-blue-500/20 text-blue-300' :
                                    candidate.recommendation === 'maybe' ? 'bg-amber-500/20 text-amber-300' :
                                    'bg-gray-500/20 text-gray-300'
                                  }`}
                                >
                                  #{candidate.rank} - {(candidate.overallScore ?? 0).toFixed(1)} pts
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        <Link
                          href={`/screening?jobId=${item.jobId || item.job?._id || ''}`}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          title="New Screening"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </Link>
                        {item.result && (
                          <button
                            onClick={() => alert(JSON.stringify(item.result, null, 2))}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            title="View Results"
                          >
                            <Eye className="h-5 w-5 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: any; className: string; label: string }> = {
    completed: {
      icon: CheckCircle2,
      className: 'bg-emerald-500/20 text-emerald-300',
      label: 'Completed',
    },
    failed: {
      icon: XCircle,
      className: 'bg-red-500/20 text-red-300',
      label: 'Failed',
    },
    processing: {
      icon: Loader2,
      className: 'bg-amber-500/20 text-amber-300',
      label: 'Processing',
    },
    pending: {
      icon: Clock,
      className: 'bg-blue-500/20 text-blue-300',
      label: 'Pending',
    },
  };

  const { icon: Icon, className, label } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
