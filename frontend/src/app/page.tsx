'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Briefcase, 
  Users, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { PageLoader } from '@/components/Loading';
import type { AppDispatch, RootState } from '@/store';
import { fetchDashboardStats, fetchJobs, fetchApplicants } from '@/store';

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const dashboard = useSelector((state: RootState) => state.dashboard);
  const jobs = useSelector((state: RootState) => state.jobs);
  const applicants = useSelector((state: RootState) => state.applicants);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchJobs({ pageSize: 5 }));
    dispatch(fetchApplicants({ pageSize: 5 }));
  }, [dispatch]);

  const loading = dashboard.loading || jobs.loading || applicants.loading;
  
  if (loading) {
    return <PageLoader />;
  }
  
  const stats = dashboard.stats;
  const recentJobs = jobs.items.slice(0, 5);
  const recentApplicants = applicants.items.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0b1020]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15)_0%,transparent_50%)]" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-6">
              <Zap className="h-4 w-4" />
              <span>Powered by Gemini AI</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent mb-4">
              AI-Powered Talent Screening
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Evaluate candidates with transparent AI scoring, auditable rankings, and human-centered review workflows.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                href="/screening"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Sparkles className="h-5 w-5" />
                Start AI Screening
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/jobs"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
              >
                <Briefcase className="h-5 w-5" />
                Manage Jobs
              </Link>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
          >
            <StatCard
              icon={Briefcase}
              label="Open Jobs"
              value={stats?.totalJobs ?? jobs.total ?? 0}
              trend="Active hiring pipeline"
              color="indigo"
            />
            <StatCard
              icon={Users}
              label="Total Applicants"
              value={stats?.totalApplicants ?? applicants.total ?? 0}
              trend="Available for screening"
              color="cyan"
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed Screenings"
              value={stats?.completedScreenings ?? 0}
              trend="AI-evaluated candidates"
              color="emerald"
            />
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-400" />
                  Recent Jobs
                </h2>
                <Link href="/jobs" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="divide-y divide-white/5">
                {recentJobs.length > 0 ? (
                  recentJobs.map((job) => (
                    <div key={job._id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-white">{job.title}</h3>
                          <p className="text-sm text-gray-400">{job.company} • {job.location}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300">
                          {job.experienceLevel}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-400">
                    No jobs yet. <Link href="/jobs" className="text-indigo-400 hover:underline">Create one</Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-400" />
                  Recent Activity
                </h2>
              </div>
              <div className="divide-y divide-white/5">
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.screeningId} className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`h-2 w-2 rounded-full mt-2 ${
                          activity.status === 'completed' ? 'bg-emerald-400' :
                          activity.status === 'processing' ? 'bg-amber-400' :
                          'bg-gray-400'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{activity.jobTitle}</p>
                          <p className="text-xs text-gray-400">
                            {activity.applicantsCount} candidates • {activity.status}
                          </p>
                          {activity.completedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.completedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-400">
                    No screening activity yet
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              href="/jobs/new"
              icon={Briefcase}
              title="Post a Job"
              description="Create a new job posting"
              color="indigo"
            />
            <QuickActionCard
              href="/applicants/new"
              icon={Users}
              title="Add Applicant"
              description="Register a new candidate"
              color="cyan"
            />
            <QuickActionCard
              href="/screening"
              icon={Sparkles}
              title="Run Screening"
              description="Start AI candidate evaluation"
              color="purple"
            />
            <QuickActionCard
              href="/applicants"
              icon={TrendingUp}
              title="View Analytics"
              description="Check screening metrics"
              color="emerald"
            />
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, color }: {
  icon: React.ElementType;
  label: string;
  value: number;
  trend: string;
  color: 'indigo' | 'cyan' | 'emerald';
}) {
  const colorClasses = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400',
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br bg-white/5 border border-white/10 p-6">
      <div className={`absolute top-0 right-0 h-24 w-24 rounded-full blur-2xl bg-gradient-to-br ${colorClasses[color]}`} />
      <div className="relative">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${colorClasses[color]} mb-4`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-1">{trend}</p>
      </div>
    </div>
  );
}

function QuickActionCard({ href, icon: Icon, title, description, color }: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: 'indigo' | 'cyan' | 'purple' | 'emerald';
}) {
  const colorClasses = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 group-hover:from-indigo-500/30 group-hover:to-indigo-500/10',
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 group-hover:from-cyan-500/30 group-hover:to-cyan-500/10',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400 group-hover:from-purple-500/30 group-hover:to-purple-500/10',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 group-hover:from-emerald-500/30 group-hover:to-emerald-500/10',
  };

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-5 hover:border-white/20 transition-all"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${colorClasses[color]} mb-3`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </div>
    </Link>
  );
}

