'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  ArrowLeft, 
  Plus, 
  X,
  Loader2,
  Building2,
  MapPin,
  GraduationCap,
  Clock
} from 'lucide-react';
import { createJob } from '@/lib/api';
import { addToast } from '@/components/Toast';

interface SkillInput {
  name: string;
  yearsRequired: number;
  mandatory: boolean;
  weight: number;
}

const experienceLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];
const employmentTypes = ['full-time', 'part-time', 'contract', 'freelance'];

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    department: '',
    location: '',
    description: '',
    employmentType: 'full-time',
    experienceLevel: 'mid',
    remote: false,
    requiredExperienceYears: 0,
    requiredEducation: '',
    responsibilities: [''],
    niceToHaveSkills: [''],
  });
  const [requiredSkills, setRequiredSkills] = useState<SkillInput[]>([
    { name: '', yearsRequired: 0, mandatory: true, weight: 3 }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        requiredSkills: requiredSkills.filter(s => s.name.trim()),
        responsibilities: formData.responsibilities.filter(r => r.trim()),
        niceToHaveSkills: formData.niceToHaveSkills.filter(s => s.trim()),
      };

      await createJob(payload);
      addToast({ type: 'success', title: 'Job created successfully' });
      router.push('/jobs');
    } catch (error) {
      console.error('Failed to create job:', error);
      addToast({ type: 'error', title: 'Failed to create job', message: 'Please try again' });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    setRequiredSkills([...requiredSkills, { name: '', yearsRequired: 0, mandatory: true, weight: 3 }]);
  };

  const removeSkill = (index: number) => {
    setRequiredSkills(requiredSkills.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, field: keyof SkillInput, value: any) => {
    const updated = [...requiredSkills];
    updated[index] = { ...updated[index], [field]: value };
    setRequiredSkills(updated);
  };

  const addResponsibility = () => {
    setFormData({ ...formData, responsibilities: [...formData.responsibilities, ''] });
  };

  const updateResponsibility = (index: number, value: string) => {
    const updated = [...formData.responsibilities];
    updated[index] = value;
    setFormData({ ...formData, responsibilities: updated });
  };

  const removeResponsibility = (index: number) => {
    setFormData({ ...formData, responsibilities: formData.responsibilities.filter((_, i) => i !== index) });
  };

  const addNiceToHave = () => {
    setFormData({ ...formData, niceToHaveSkills: [...formData.niceToHaveSkills, ''] });
  };

  const updateNiceToHave = (index: number, value: string) => {
    const updated = [...formData.niceToHaveSkills];
    updated[index] = value;
    setFormData({ ...formData, niceToHaveSkills: updated });
  };

  const removeNiceToHave = (index: number) => {
    setFormData({ ...formData, niceToHaveSkills: formData.niceToHaveSkills.filter((_, i) => i !== index) });
  };

  return (
    <div className="min-h-screen bg-[#0b1020]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-indigo-400" />
            Post New Job
          </h1>
          <p className="text-gray-400 mt-1">Create a job posting to start screening candidates</p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Basic Info */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-400" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Job Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="e.g., Senior Frontend Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company *</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="e.g., Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="e.g., Engineering"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="e.g., Kigali, Rwanda"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.remote}
                    onChange={(e) => setFormData({ ...formData, remote: e.target.checked })}
                    className="h-5 w-5 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500/50"
                  />
                  <span className="text-sm text-gray-300">Remote-friendly</span>
                </label>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-400" />
              Job Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Employment Type</label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {employmentTypes.map(type => (
                    <option key={type} value={type} className="bg-[#0b1020]">
                      {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Experience Level</label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {experienceLevels.map(level => (
                    <option key={level} value={level} className="bg-[#0b1020]">
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Years of Experience Required</label>
                <input
                  type="number"
                  min="0"
                  value={formData.requiredExperienceYears}
                  onChange={(e) => setFormData({ ...formData, requiredExperienceYears: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Job Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Describe the role, responsibilities, and ideal candidate..."
              />
            </div>
          </div>

          {/* Responsibilities */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Responsibilities</h2>
            <div className="space-y-3">
              {formData.responsibilities.map((resp, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={resp}
                    onChange={(e) => updateResponsibility(index, e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="e.g., Design and maintain REST APIs"
                  />
                  {formData.responsibilities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeResponsibility(index)}
                      className="p-3 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addResponsibility}
              className="mt-3 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Responsibility
            </button>
          </div>

          {/* Required Skills */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Required Skills</h2>
            <div className="space-y-3">
              {requiredSkills.map((skill, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={skill.name}
                    onChange={(e) => updateSkill(index, 'name', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Skill name"
                  />
                  <input
                    type="number"
                    min="0"
                    value={skill.yearsRequired}
                    onChange={(e) => updateSkill(index, 'yearsRequired', parseInt(e.target.value) || 0)}
                    className="w-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Years"
                  />
                  <select
                    value={skill.weight}
                    onChange={(e) => updateSkill(index, 'weight', parseInt(e.target.value))}
                    className="w-28 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    {[1, 2, 3, 4, 5].map(w => (
                      <option key={w} value={w} className="bg-[#0b1020]">Priority {w}</option>
                    ))}
                  </select>
                  {requiredSkills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="p-3 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSkill}
              className="mt-3 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Skill
            </button>
          </div>

          {/* Nice-to-Have Skills */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Nice-to-Have Skills</h2>
            <div className="space-y-3">
              {formData.niceToHaveSkills.map((skill, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => updateNiceToHave(index, e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="e.g., GraphQL, Kubernetes"
                  />
                  {formData.niceToHaveSkills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeNiceToHave(index)}
                      className="p-3 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addNiceToHave}
              className="mt-3 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Nice-to-Have Skill
            </button>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/jobs"
              className="px-6 py-3 rounded-xl text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Briefcase className="h-5 w-5" />
                  Post Job
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
