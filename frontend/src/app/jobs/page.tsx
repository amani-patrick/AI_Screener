'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Briefcase, 
  Plus, 
  Search, 
  MapPin, 
  Building2, 
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Loader2
} from 'lucide-react';
import { deleteJob } from '@/lib/api';
import { addToast } from '@/components/Toast';
import { AILoader } from '@/components/Loading';
import type { AppDispatch, RootState } from '@/store';
import { fetchJobs } from '@/store';

export default function JobsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const jobs = useSelector((state: RootState) => state.jobs);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchJobs({ search: search || undefined }));
  }, [search, dispatch]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      setDeleting(id);
      await deleteJob(id);
      dispatch(fetchJobs({ search: search || undefined })); // Refresh list
      addToast({ type: 'success', title: 'Job deleted successfully' });
    } catch (error) {
      console.error('Failed to delete job:', error);
      addToast({ type: 'error', title: 'Failed to delete job', message: 'Please try again' });
    } finally {
      setDeleting(null);
    }
  };

  const experienceColors: Record<string, string> = {
    entry: 'bg-blue-500/20 text-blue-300',
    mid: 'bg-indigo-500/20 text-indigo-300',
    senior: 'bg-purple-500/20 text-purple-300',
    lead: 'bg-pink-500/20 text-pink-300',
    executive: 'bg-amber-500/20 text-amber-300',
  };

  return (
    <div className="min-h-screen bg-[#0b1020]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-indigo-400" />
              Jobs
            </h1>
            <p className="text-gray-400 mt-1">Manage job postings and hiring requirements</p>
          </div>
          <Link
            href="/jobs/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-5 w-5" />
            Post New Job
          </Link>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs by title or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Jobs Grid */}
        {jobs.loading ? (
          <div className="flex items-center justify-center py-20">
            <AILoader text="Loading jobs..." />
          </div>
        ) : jobs.items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 mb-4">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No jobs found</h3>
            <p className="text-gray-400 mb-6">Get started by creating your first job posting</p>
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              Create Job
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {jobs.items.map((job, index) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-white/20 transition-all"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate pr-4">{job.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <Building2 className="h-4 w-4" />
                        <span>{job.company}</span>
                        <span className="text-gray-600">•</span>
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                        {job.remote && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300">
                            Remote
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${experienceColors[job.experienceLevel] || 'bg-gray-500/20 text-gray-300'}`}>
                      {job.experienceLevel}
                    </span>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {job.requiredSkills?.slice(0, 4).map((skill) => (
                        <span
                          key={skill.name}
                          className="px-2 py-1 rounded-lg text-xs bg-white/5 text-gray-300 border border-white/5"
                        >
                          {skill.name} ({skill.yearsRequired}y)
                        </span>
                      ))}
                      {job.requiredSkills && job.requiredSkills.length > 4 && (
                        <span className="px-2 py-1 rounded-lg text-xs text-gray-500">
                          +{job.requiredSkills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{job.employmentType}</span>
                      <span>{job.requiredExperienceYears}+ years exp</span>
                      {job.screeningCount !== undefined && job.screeningCount > 0 && (
                        <span className="text-indigo-400">
                          {job.screeningCount} screening{job.screeningCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/screening?jobId=${job._id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                      >
                        Screen
                      </Link>
                      <div className="relative group/menu">
                        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                          <MoreHorizontal className="h-5 w-5 text-gray-400" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-[#0f1525] border border-white/10 shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                          <Link
                            href={`/jobs/${job._id}`}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors first:rounded-t-xl"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Link>
                          <Link
                            href={`/jobs/${job._id}/edit`}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(job._id)}
                            disabled={deleting === job._id}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors last:rounded-b-xl"
                          >
                            {deleting === job._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
