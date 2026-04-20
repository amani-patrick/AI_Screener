'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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
  Globe,
  Save,
  Trash2,
  Edit3,
  Sparkles
} from 'lucide-react';
import { getApplicant, updateApplicant, deleteApplicant } from '@/lib/api';
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

export default function ApplicantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicantId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    headline: '',
    summary: '',
    location: { city: '', country: '', remote: false },
    availability: { immediateStart: false, noticePeriod: 30 },
    portfolioUrl: '',
    linkedinUrl: '',
    githubUrl: '',
  });
  
  const [skills, setSkills] = useState<SkillInput[]>([{ name: '', yearsOfExperience: 0, level: 'intermediate' }]);
  const [experience, setExperience] = useState<ExperienceInput[]>([{ company: '', role: '', startDate: '', isCurrent: true, description: '' }]);
  const [education, setEducation] = useState<EducationInput[]>([{ institution: '', degree: '', field: '', startYear: new Date().getFullYear() }]);

  useEffect(() => {
    const fetchApplicant = async () => {
      try {
        const response = await getApplicant(applicantId);
        const applicant = response.data.data;
        
        setFormData({
          fullName: applicant.fullName || '',
          email: applicant.email || '',
          phone: applicant.phone || '',
          headline: applicant.headline || '',
          summary: applicant.summary || '',
          location: applicant.location || { city: '', country: '', remote: false },
          availability: applicant.availability || { immediateStart: false, noticePeriod: 30 },
          portfolioUrl: applicant.portfolioUrl || '',
          linkedinUrl: applicant.linkedinUrl || '',
          githubUrl: applicant.githubUrl || '',
        });
        
        setSkills(applicant.skills?.length > 0 ? applicant.skills : [{ name: '', yearsOfExperience: 0, level: 'intermediate' }]);
        setExperience(applicant.workExperience?.length > 0 ? applicant.workExperience : [{ company: '', role: '', startDate: '', isCurrent: true, description: '' }]);
        setEducation(applicant.education?.length > 0 ? applicant.education : [{ institution: '', degree: '', field: '', startYear: new Date().getFullYear() }]);
      } catch (error) {
        console.error('Failed to fetch applicant:', error);
        addToast({ type: 'error', title: 'Failed to load applicant', message: 'Please try again' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplicant();
  }, [applicantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        skills: skills.filter(s => s.name.trim()),
        workExperience: experience.filter(e => e.company.trim() && e.role.trim()),
        education: education.filter(e => e.institution.trim()),
      };

      await updateApplicant(applicantId, payload);
      addToast({ type: 'success', title: 'Applicant updated successfully' });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update applicant:', error);
      addToast({ type: 'error', title: 'Failed to update applicant', message: 'Please try again' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this applicant? This action cannot be undone.')) return;
    
    setDeleting(true);
    try {
      await deleteApplicant(applicantId);
      addToast({ type: 'success', title: 'Applicant deleted successfully' });
      router.push('/applicants');
    } catch (error) {
      console.error('Failed to delete applicant:', error);
      addToast({ type: 'error', title: 'Failed to delete applicant' });
      setDeleting(false);
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

  const getSkillLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-gray-500/20 text-gray-300',
      intermediate: 'bg-blue-500/20 text-blue-300',
      advanced: 'bg-indigo-500/20 text-indigo-300',
      expert: 'bg-purple-500/20 text-purple-300',
    };
    return colors[level] || colors.intermediate;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1020] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <p className="text-gray-400">Loading applicant details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1020]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <Link
              href="/applicants"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center text-lg font-semibold text-white">
                {formData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {isEditing ? 'Edit Applicant' : formData.fullName}
                </h1>
                {!isEditing && <p className="text-gray-400">{formData.headline}</p>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  <Edit3 className="h-5 w-5" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  Save Changes
                </button>
              </>
            )}
          </div>
        </motion.div>

        {isEditing ? (
          // Edit Form
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Headline</label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Professional Summary</label>
                  <textarea
                    rows={3}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
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
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.location.country}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, country: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.location.remote}
                      onChange={(e) => setFormData({ ...formData, location: { ...formData.location, remote: e.target.checked } })}
                      className="h-5 w-5 rounded border-white/10 bg-white/5 text-indigo-500"
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
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="Skill name"
                    />
                    <input
                      type="number"
                      min="0"
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

            {/* Experience */}
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
                          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => updateExperience(index, 'role', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Field of Study</label>
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => updateEducation(index, 'field', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
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
          </motion.form>
        ) : (
          // View Mode
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Contact Info */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-cyan-400" />
                  <span className="text-gray-300">{formData.email}</span>
                </div>
                {formData.phone && (
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400">📞</span>
                    <span className="text-gray-300">{formData.phone}</span>
                  </div>
                )}
                {(formData.location.city || formData.location.country) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-cyan-400" />
                    <span className="text-gray-300">
                      {[formData.location.city, formData.location.country].filter(Boolean).join(', ')}
                      {formData.location.remote && ' (Remote-friendly)'}
                    </span>
                  </div>
                )}
                {formData.portfolioUrl && (
                  <a href={formData.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300">
                    <Globe className="h-5 w-5" />
                    Portfolio
                  </a>
                )}
                {formData.linkedinUrl && (
                  <a href={formData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300">
                    <span className="font-bold">in</span>
                    LinkedIn
                  </a>
                )}
                {formData.githubUrl && (
                  <a href={formData.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300">
                    <span className="font-bold">GH</span>
                    GitHub
                  </a>
                )}
              </div>
            </div>

            {/* Summary */}
            {formData.summary && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Professional Summary</h2>
                <p className="text-gray-300 whitespace-pre-wrap">{formData.summary}</p>
              </div>
            )}

            {/* Skills */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-400" />
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.filter(s => s.name).map((skill, i) => (
                  <span key={i} className={`px-3 py-1.5 rounded-lg text-sm ${getSkillLevelColor(skill.level)}`}>
                    {skill.name} ({skill.yearsOfExperience}y)
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-emerald-400" />
                Work Experience
              </h2>
              <div className="space-y-4">
                {experience.filter(e => e.company || e.role).map((exp, i) => (
                  <div key={i} className="border-l-2 border-white/10 pl-4">
                    <h3 className="font-medium text-white">{exp.role}</h3>
                    <p className="text-gray-400">{exp.company}</p>
                    <p className="text-sm text-gray-500">
                      {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                    </p>
                    {exp.description && <p className="text-gray-400 mt-2 text-sm">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-amber-400" />
                Education
              </h2>
              <div className="space-y-4">
                {education.filter(e => e.institution || e.degree).map((edu, i) => (
                  <div key={i} className="border-l-2 border-white/10 pl-4">
                    <h3 className="font-medium text-white">{edu.degree} in {edu.field}</h3>
                    <p className="text-gray-400">{edu.institution}</p>
                    <p className="text-sm text-gray-500">{edu.startYear} - {edu.endYear || 'Present'}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
