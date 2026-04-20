'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Sparkles, 
  Briefcase, 
  Users, 
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Brain,
  Clock,
  Award,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  History,
  ChevronDown,
  Mail,
  MapPin,
  BriefcaseIcon
} from 'lucide-react';
import { getScreeningMetrics } from '@/lib/api';
import { addToast } from '@/components/Toast';
import { AILoader, PageLoader } from '@/components/Loading';
import type { AppDispatch, RootState } from '@/store';
import { fetchJobs, fetchApplicants, resetScreening, startScreening, fetchScreeningResult, fetchScreeningHistory } from '@/store';

export default function ScreeningPage() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get('jobId');
  const dispatch = useDispatch<AppDispatch>();
  
  const jobs = useSelector((state: RootState) => state.jobs);
  const applicants = useSelector((state: RootState) => state.applicants);
  const screening = useSelector((state: RootState) => state.screenings);

  const [selectedJobId, setSelectedJobId] = useState<string>(preselectedJobId || '');
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [shortlistSize, setShortlistSize] = useState<number>(10);
  const [startingScreening, setStartingScreening] = useState(false);
  const [polling, setPolling] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchJobs({}));
    dispatch(fetchApplicants({}));
  }, [dispatch]);

  useEffect(() => {
    if (!screening.currentRequestId || screening.status === 'completed' || screening.status === 'failed') {
      return;
    }

    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const result = await dispatch(fetchScreeningResult(screening.currentRequestId!)).unwrap();

        if (result.status === 'completed') {
          clearInterval(interval);
          setPolling(false);
          try {
            const metricsRes = await getScreeningMetrics(screening.currentRequestId!, 10);
            setMetrics(metricsRes.data.data);
          } catch (e) {
            console.error('Failed to fetch metrics:', e);
          }
        } else if (result.status === 'failed') {
          clearInterval(interval);
          setPolling(false);
        }
        // else still processing, continue polling
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [screening.currentRequestId, screening.status]);

  const handleStartScreening = async () => {
    if (!selectedJobId) {
      addToast({ type: 'warning', title: 'Please select a job' });
      return;
    }

    setStartingScreening(true);
    try {
      await dispatch(startScreening({
        jobId: selectedJobId,
        applicantIds: selectedApplicants.length > 0 ? selectedApplicants : undefined,
        shortlistSize: shortlistSize as 10 | 20,
      })).unwrap();
      
      addToast({ type: 'success', title: 'Screening started', message: `Analyzing candidates for ${jobs.items.find((j: any) => j._id === selectedJobId)?.title}` });
    } catch (error: any) {
      console.error('Failed to start screening:', error);
      addToast({ type: 'error', title: 'Failed to start screening', message: error || 'Please try again' });
    } finally {
      setStartingScreening(false);
    }
  };

  const handleReset = () => {
    dispatch(resetScreening());
    setMetrics(null);
    setSelectedJobId(preselectedJobId || '');
    setSelectedApplicants([]);
  };

  const toggleApplicant = (id: string) => {
    setSelectedApplicants(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const selectAllApplicants = () => {
    setSelectedApplicants((applicants.items || []).map((a: any) => a._id));
  };

  const deselectAllApplicants = () => {
    setSelectedApplicants([]);
  };

  if (jobs.loading || applicants.loading) {
    return <PageLoader />;
  }

  // Results View
  if (screening.status !== 'idle') {
    return (
      <div className="min-h-screen bg-[#0b1020]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <button
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Brain className="h-8 w-8 text-purple-400" />
                AI Screening Results
              </h1>
              <p className="text-gray-400 mt-1">
                {jobs.items.find(j => j._id === screening.result?.jobId)?.title}
              </p>
            </div>
          </motion.div>

          {/* Status Banner */}
          {screening.status === 'processing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-8 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30"
            >
              <div className="flex flex-col items-center text-center">
                <AILoader text="Gemini is analyzing candidates..." />
                <div className="mt-4 h-2 w-full max-w-md bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"
                    initial={{ width: '0%' }}
                    animate={{ width: ['0%', '70%', '40%', '90%'] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                <p className="text-gray-400 mt-4 text-sm">Evaluating skills, experience, and fit against job requirements</p>
              </div>
            </motion.div>
          )}

          {screening.status === 'completed' && screening.result && (
            <>
              {/* Summary Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
              >
                <ResultStat
                  icon={Users}
                  label="Candidates Evaluated"
                  value={screening.result.totalApplicantsEvaluated}
                  color="indigo"
                />
                <ResultStat
                  icon={CheckCircle2}
                  label="Shortlisted"
                  value={screening.result.shortlist.length}
                  color="emerald"
                />
                <ResultStat
                  icon={Clock}
                  label="Processing Time"
                  value={`${Math.round(screening.result.processingTimeMs / 1000)}s`}
                  color="cyan"
                />
                <ResultStat
                  icon={Brain}
                  label="AI Model"
                  value={screening.result.fallbackUsed ? 'Fallback' : 'Gemini'}
                  color="purple"
                />
              </motion.div>

              {/* Metrics */}
              {metrics && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                    Quality Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Precision @ Top 10</span>
                        <span className="text-lg font-semibold text-white">
                          {(metrics.precisionAtKProxy * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${metrics.precisionAtKProxy * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Average Confidence</span>
                        <span className="text-lg font-semibold text-white">
                          {(metrics.averageConfidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${metrics.averageConfidence * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Human Review Rate</span>
                        <span className="text-lg font-semibold text-white">
                          {(metrics.humanReviewRate * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${metrics.humanReviewRate * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Ranked Candidates */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-400" />
                  Ranked Shortlist
                </h3>
                <div className="space-y-4">
                  {(screening.result.shortlist || []).map((candidate: any, index: number) => {
                    const applicant = candidate.applicant || {};
                    const isExpanded = expandedCandidate === candidate.applicantId;
                    return (
                      <motion.div
                        key={candidate.applicantId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-white/20 transition-all"
                      >
                        {/* Header - Always Visible */}
                        <button
                          onClick={() => setExpandedCandidate(isExpanded ? null : candidate.applicantId)}
                          className="w-full p-6 text-left hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            {/* Rank & Score */}
                            <div className="flex flex-col items-center shrink-0">
                              <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                                index === 0 ? 'bg-amber-500/20 text-amber-400' :
                                index === 1 ? 'bg-gray-400/20 text-gray-300' :
                                index === 2 ? 'bg-orange-600/20 text-orange-400' :
                                'bg-white/10 text-gray-400'
                              }`}>
                                #{candidate.rank}
                              </div>
                              <div className="mt-2 text-2xl font-bold text-white">
                                {(candidate.overallScore ?? 0).toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500">score</div>
                            </div>

                            {/* Candidate Identity */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <h4 className="text-xl font-bold text-white truncate">
                                    {applicant.fullName || 'Unknown Candidate'}
                                  </h4>
                                  <p className="text-purple-300 text-sm mt-1">
                                    {applicant.headline || 'No headline'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
                                    {applicant.email && (
                                      <span className="flex items-center gap-1">
                                        <Mail className="h-3.5 w-3.5" />
                                        {applicant.email}
                                      </span>
                                    )}
                                    {applicant.location?.city && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {applicant.location.city}{applicant.location.country ? `, ${applicant.location.country}` : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    candidate.recommendation === 'strong_yes' ? 'bg-emerald-500/20 text-emerald-300' :
                                    candidate.recommendation === 'yes' ? 'bg-blue-500/20 text-blue-300' :
                                    candidate.recommendation === 'maybe' ? 'bg-amber-500/20 text-amber-300' :
                                    candidate.recommendation === 'no' ? 'bg-red-500/20 text-red-300' :
                                    'bg-gray-500/20 text-gray-300'
                                  }`}>
                                    {(candidate.recommendation ?? 'unknown').replace('_', ' ').toUpperCase()}
                                  </span>
                                  {candidate.needsHumanReview && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300">
                                      Review
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Skills Preview */}
                              {applicant.skills && applicant.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {applicant.skills.slice(0, 4).map((skill: any, i: number) => (
                                    <span key={i} className="px-2 py-1 rounded-md bg-white/10 text-xs text-gray-300">
                                      {skill.name}
                                    </span>
                                  ))}
                                  {applicant.skills.length > 4 && (
                                    <span className="px-2 py-1 rounded-md bg-white/10 text-xs text-gray-400">
                                      +{applicant.skills.length - 4} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Expand Icon */}
                            <div className="shrink-0 pt-2">
                              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </button>

                        {/* Expanded AI Analysis */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-white/10 bg-white/[0.02]"
                          >
                            <div className="p-6 pt-4">
                              {/* AI Reasoning */}
                              <div className="mb-4">
                                <p className="text-xs text-purple-400 uppercase tracking-wider mb-2">AI Assessment</p>
                                <p className="text-gray-300 text-sm leading-relaxed">{candidate.reasoning || 'No reasoning provided'}</p>
                              </div>

                              {/* Score Breakdown */}
                              <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                                <div className="text-center p-3 rounded-xl bg-white/5">
                                  <div className="text-indigo-400 font-semibold">{(candidate.scoreBreakdown?.weightedSkills ?? 0).toFixed(1)}</div>
                                  <div className="text-gray-500 text-xs">Skills</div>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-white/5">
                                  <div className="text-cyan-400 font-semibold">{(candidate.scoreBreakdown?.weightedExperience ?? 0).toFixed(1)}</div>
                                  <div className="text-gray-500 text-xs">Experience</div>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-white/5">
                                  <div className="text-purple-400 font-semibold">{(candidate.scoreBreakdown?.weightedEducation ?? 0).toFixed(1)}</div>
                                  <div className="text-gray-500 text-xs">Education</div>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-white/5">
                                  <div className="text-pink-400 font-semibold">{(candidate.scoreBreakdown?.weightedRelevance ?? 0).toFixed(1)}</div>
                                  <div className="text-gray-500 text-xs">Relevance</div>
                                </div>
                              </div>

                              {/* Key Highlights & Risk Factors */}
                              {(candidate.keyHighlights?.length > 0 || candidate.riskFactors?.length > 0) && (
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  {candidate.keyHighlights?.length > 0 && (
                                    <div>
                                      <p className="text-xs text-blue-400 uppercase tracking-wider mb-2">Key Highlights</p>
                                      <ul className="space-y-1">
                                        {candidate.keyHighlights.slice(0, 3).map((h: string, i: number) => (
                                          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                            <BriefcaseIcon className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                                            {h}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {candidate.riskFactors?.length > 0 && (
                                    <div>
                                      <p className="text-xs text-red-400 uppercase tracking-wider mb-2">Risk Factors</p>
                                      <ul className="space-y-1">
                                        {candidate.riskFactors.slice(0, 3).map((r: string, i: number) => (
                                          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                                            {r}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Strengths & Gaps */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Strengths</p>
                                  <ul className="space-y-1">
                                    {(candidate.strengths || []).slice(0, 4).map((s: string, i: number) => (
                                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                                        {s}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="text-xs text-amber-400 uppercase tracking-wider mb-2">Gaps</p>
                                  <ul className="space-y-1">
                                    {(candidate.gaps || []).slice(0, 4).map((g: string, i: number) => (
                                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                        {g}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {/* Final Note */}
                              {candidate.finalDecisionNote && (
                                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                  <p className="text-xs text-amber-300">{candidate.finalDecisionNote}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Start New Screening Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 flex justify-center"
              >
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
                >
                  <RefreshCw className="h-5 w-5" />
                  Start New Screening
                </button>
              </motion.div>
            </>
          )}

          {screening.status === 'failed' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center"
            >
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Screening Failed</h3>
              <p className="text-gray-400">Something went wrong during the AI screening process.</p>
              <button
                onClick={handleReset}
                className="mt-4 px-6 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Form View
  return (
    <div className="min-h-screen bg-[#0b1020]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Powered by Gemini 3 Flash</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-4">
            AI-Powered Screening
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Select a job and candidates to evaluate. Our AI will analyze skills, experience, and fit to create a ranked shortlist.
          </p>
          <Link
            href="/screening/history"
            className="inline-flex items-center gap-2 mt-6 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <History className="h-4 w-4" />
            View Screening History →
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-400" />
                Select Job
              </h2>
              {jobs.items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No jobs available</p>
                  <Link
                    href="/jobs/new"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    Create a job first →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(jobs.items || []).map((job: any) => (
                    <button
                      key={job._id}
                      onClick={() => setSelectedJobId(job._id)}
                      className={`w-full text-left p-4 rounded-xl transition-all ${
                        selectedJobId === job._id
                          ? 'bg-indigo-500/20 border border-indigo-500/30'
                          : 'bg-white/5 border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <h3 className="font-medium text-white">{job.title}</h3>
                      <p className="text-sm text-gray-400">{job.company}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.requiredSkills?.slice(0, 3).map((s: any) => (
                          <span key={s.name} className="text-xs text-gray-500">{s.name}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Shortlist Size */}
            <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Shortlist Size</h2>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(size => (
                  <button
                    key={size}
                    onClick={() => setShortlistSize(size)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      shortlistSize === size
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Candidate Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-cyan-400" />
                  Select Candidates
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllApplicants}
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    Select All
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    onClick={deselectAllApplicants}
                    className="text-sm text-gray-400 hover:text-gray-300"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {applicants.items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">No applicants available</p>
                  <Link
                    href="/applicants/new"
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    Add applicants first →
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-4">
                    {selectedApplicants.length} of {(applicants.items || []).length} selected
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                    {(applicants.items || []).map((applicant: any) => (
                      <button
                        key={applicant._id}
                        onClick={() => toggleApplicant(applicant._id)}
                        className={`flex items-start gap-3 p-4 rounded-xl text-left transition-all ${
                          selectedApplicants.includes(applicant._id)
                            ? 'bg-cyan-500/10 border border-cyan-500/30'
                            : 'bg-white/5 border border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                          selectedApplicants.includes(applicant._id)
                            ? 'bg-cyan-500 border-cyan-500'
                            : 'border-white/30'
                        }`}>
                          {selectedApplicants.includes(applicant._id) && (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{applicant.fullName}</h3>
                          <p className="text-sm text-gray-400 truncate">{applicant.headline}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {applicant.skills?.slice(0, 3).map((s: any) => (
                              <span key={s.name} className="text-xs text-gray-500">{s.name}</span>
                            ))}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex justify-center"
        >
          <button
            onClick={handleStartScreening}
            disabled={!selectedJobId || startingScreening}
            className="flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white text-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {startingScreening ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                Starting Screening...
              </>
            ) : (
              <>
                <Sparkles className="h-6 w-6" />
                Start AI Screening
                <ArrowRight className="h-6 w-6" />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function ResultStat({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'indigo' | 'emerald' | 'cyan' | 'purple';
}) {
  const colorClasses = {
    indigo: 'text-indigo-400',
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
      <Icon className={`h-6 w-6 mx-auto mb-2 ${colorClasses[color]}`} />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
