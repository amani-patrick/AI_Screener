'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Users, 
  Plus, 
  Search, 
  MapPin, 
  Mail,
  MoreHorizontal,
  Trash2,
  Edit,
  Loader2,
  FileText,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { deleteApplicant } from '@/lib/api';
import { addToast } from '@/components/Toast';
import { AILoader } from '@/components/Loading';
import type { AppDispatch, RootState } from '@/store';
import { fetchApplicants } from '@/store';

export default function ApplicantsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const applicants = useSelector((state: RootState) => state.applicants);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchApplicants({ search: search || undefined }));
  }, [search, dispatch]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this applicant?')) return;
    
    try {
      setDeleting(id);
      await deleteApplicant(id);
      dispatch(fetchApplicants({ search: search || undefined })); // Refresh list
      addToast({ type: 'success', title: 'Applicant deleted successfully' });
    } catch (error) {
      console.error('Failed to delete applicant:', error);
      addToast({ type: 'error', title: 'Failed to delete applicant', message: 'Please try again' });
    } finally {
      setDeleting(null);
    }
  };

  const getSkillLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-gray-500/20 text-gray-300',
      intermediate: 'bg-blue-500/20 text-blue-300',
      advanced: 'bg-indigo-500/20 text-indigo-300',
      expert: 'bg-purple-500/20 text-purple-300',
    };
    return colors[level] || colors.intermediate;
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
              <Users className="h-8 w-8 text-cyan-400" />
              Applicants
            </h1>
            <p className="text-gray-400 mt-1">Manage candidate profiles and their qualifications</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/applicants/upload"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
            >
              <FileText className="h-5 w-5" />
              Bulk Upload
            </Link>
            <Link
              href="/applicants/new"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              Add Applicant
            </Link>
          </div>
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
              placeholder="Search by name or headline..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Applicants Grid */}
        {applicants.loading ? (
          <div className="flex items-center justify-center py-20">
            <AILoader text="Loading applicants..." />
          </div>
        ) : applicants.items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No applicants found</h3>
            <p className="text-gray-400 mb-6">Get started by adding your first candidate</p>
            <Link
              href="/applicants/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              Add Applicant
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {applicants.items.map((applicant, index) => (
              <motion.div
                key={applicant._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-white/20 transition-all"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center text-lg font-semibold text-white">
                        {applicant.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{applicant.fullName}</h3>
                        <p className="text-sm text-gray-400">{applicant.headline}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Mail className="h-3 w-3" />
                          <span>{applicant.email}</span>
                        </div>
                        {applicant.location && (applicant.location.city || applicant.location.country) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {[applicant.location.city, applicant.location.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative group/menu">
                      <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <MoreHorizontal className="h-5 w-5 text-gray-400" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-[#0f1525] border border-white/10 shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                        <Link
                          href={`/applicants/${applicant._id}`}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors first:rounded-t-xl"
                        >
                          <Edit className="h-4 w-4" />
                          View/Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(applicant._id)}
                          disabled={deleting === applicant._id}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors last:rounded-b-xl"
                        >
                          {deleting === applicant._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {applicant.skills?.slice(0, 5).map((skill) => (
                        <span
                          key={skill.name}
                          className={`px-2 py-1 rounded-lg text-xs ${getSkillLevelColor(skill.level)}`}
                        >
                          {skill.name}
                        </span>
                      ))}
                      {applicant.skills && applicant.skills.length > 5 && (
                        <span className="px-2 py-1 rounded-lg text-xs text-gray-500">
                          +{applicant.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Experience & Education Preview */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {applicant.workExperience && applicant.workExperience.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Briefcase className="h-4 w-4 text-cyan-400" />
                        <span className="truncate">
                          {applicant.workExperience[0].role} @ {applicant.workExperience[0].company}
                        </span>
                      </div>
                    )}
                    {applicant.education && applicant.education.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <GraduationCap className="h-4 w-4 text-cyan-400" />
                        <span className="truncate">
                          {applicant.education[0].degree}
                        </span>
                      </div>
                    )}
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
