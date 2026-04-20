'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, 
  ArrowLeft, 
  Plus, 
  X,
  Loader2,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  Globe
} from 'lucide-react';
import { createApplicant } from '@/lib/api';
import { addToast } from '@/components/Toast';

interface SkillInput {
  name: string;
  yearsOfExperience: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface ExperienceInput {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
}

interface EducationInput {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
}

const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function NewApplicantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    headline: '',
    summary: '',
    location: { city: '', country: '', remote: false },
    availability: { immediateStart: false, noticePeriod: 30 },
    expectedSalary: { min: 0, max: 0, currency: 'USD' },
    portfolioUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    languages: [{ name: '', proficiency: 'professional' }],
  });
  
  const [skills, setSkills] = useState<SkillInput[]>([{ name: '', yearsOfExperience: 0, level: 'intermediate' }]);
  const [experience, setExperience] = useState<ExperienceInput[]>([{ company: '', role: '', startDate: '', isCurrent: true, description: '' }]);
  const [education, setEducation] = useState<EducationInput[]>([{ institution: '', degree: '', field: '', startYear: new Date().getFullYear() }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        skills: skills.filter(s => s.name.trim()),
        workExperience: experience.filter(e => e.company.trim() && e.role.trim()),
        education: education.filter(e => e.institution.trim()),
        languages: formData.languages.filter(l => l.name.trim()),
        source: 'manual',
      };

      await createApplicant(payload);
      addToast({ type: 'success', title: 'Applicant created successfully' });
      router.push('/applicants');
    } catch (error) {
      console.error('Failed to create applicant:', error);
      addToast({ type: 'error', title: 'Failed to create applicant', message: 'Please try again' });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => setSkills([...skills, { name: '', yearsOfExperience: 0, level: 'intermediate' }]);
  const removeSkill = (index: number) => setSkills(skills.filter((_, i) => i !== index));
  const updateSkill = (index: number, field: keyof SkillInput, value: any) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    setSkills(updated);
  };

  const addExperience = () => setExperience([...experience, { company: '', role: '', startDate: '', isCurrent: true, description: '' }]);
  const removeExperience = (index: number) => setExperience(experience.filter((_, i) => i !== index));
  const updateExperience = (index: number, field: keyof ExperienceInput, value: any) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  const addEducation = () => setEducation([...education, { institution: '', degree: '', field: '', startYear: new Date().getFullYear() }]);
  const removeEducation = (index: number) => setEducation(education.filter((_, i) => i !== index));
  const updateEducation = (index: number, field: keyof EducationInput, value: any) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
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
            href="/applicants"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Applicants
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-cyan-400" />
            Add New Applicant
          </h1>
          <p className="text-gray-400 mt-1">Create a candidate profile for AI screening</p>
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
              <Mail className="h-5 w-5 text-cyan-400" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="e.g., Alice Johnson"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="e.g., alice@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="e.g., +1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Headline</label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="e.g., Senior Full-Stack Developer"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Professional Summary</label>
                <textarea
                  rows={3}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="Brief overview of experience and expertise..."
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-400" />
              Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="e.g., Kigali"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                <input
                  type="text"
                  value={formData.location.country}
                  onChange={(e) => setFormData({ ...formData, location: { ...formData.location, country: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="e.g., Rwanda"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.location.remote}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, remote: e.target.checked } })}
                    className="h-5 w-5 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500/50"
                  />
                  <span className="text-gray-300">Open to remote work</span>
                </label>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-400" />
              Skills
            </h2>
            <div className="space-y-3">
              {skills.map((skill, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={skill.name}
                    onChange={(e) => updateSkill(index, 'name', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    placeholder="Skill name"
                  />
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={skill.yearsOfExperience}
                    onChange={(e) => updateSkill(index, 'yearsOfExperience', parseInt(e.target.value) || 0)}
                    className="w-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    placeholder="Years"
                  />
                  <select
                    value={skill.level}
                    onChange={(e) => updateSkill(index, 'level', e.target.value)}
                    className="w-32 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    {skillLevels.map(l => (
                      <option key={l} value={l} className="bg-[#0b1020]">{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                    ))}
                  </select>
                  {skills.length > 1 && (
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
              className="mt-3 flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Skill
            </button>
          </div>

          {/* Work Experience */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-400" />
              Work Experience
            </h2>
            <div className="space-y-4">
              {experience.map((exp, index) => (
                <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        placeholder="e.g., Tech Corp"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => updateExperience(index, 'role', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        placeholder="e.g., Senior Developer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                      <input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      {!exp.isCurrent && (
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                          <input
                            type="month"
                            value={exp.endDate || ''}
                            onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          />
                        </div>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer mt-6">
                        <input
                          type="checkbox"
                          checked={exp.isCurrent}
                          onChange={(e) => updateExperience(index, 'isCurrent', e.target.checked)}
                          className="h-4 w-4 rounded border-white/10 bg-white/5 text-emerald-500"
                        />
                        <span className="text-sm text-gray-400">Current</span>
                      </label>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        placeholder="Key responsibilities and achievements..."
                      />
                    </div>
                  </div>
                  {experience.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="mt-3 text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addExperience}
              className="mt-4 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Experience
            </button>
          </div>

          {/* Education */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-amber-400" />
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      placeholder="e.g., University of Rwanda"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      placeholder="e.g., Bachelor of Science"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Field of Study</label>
                    <input
                      type="text"
                      value={edu.field}
                      onChange={(e) => updateEducation(index, 'field', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Start Year</label>
                      <input
                        type="number"
                        value={edu.startYear}
                        onChange={(e) => updateEducation(index, 'startYear', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-400 mb-1">End Year</label>
                      <input
                        type="number"
                        value={edu.endYear || ''}
                        onChange={(e) => updateEducation(index, 'endYear', parseInt(e.target.value) || undefined)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        placeholder="Present"
                      />
                    </div>
                    {education.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="self-end p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addEducation}
              className="mt-4 flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Education
            </button>
          </div>

          {/* Links */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-400" />
              Links & Availability
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Portfolio URL</label>
                <input
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">GitHub URL</label>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.availability.immediateStart}
                    onChange={(e) => setFormData({ ...formData, availability: { ...formData.availability, immediateStart: e.target.checked } })}
                    className="h-5 w-5 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                  />
                  <span className="text-gray-300">Available immediately</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/applicants"
              className="px-6 py-3 rounded-xl text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="h-5 w-5" />
                  Add Applicant
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
