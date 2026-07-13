'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api, CandidateProfile, AnalyzeResponse } from '@/lib/api';

const STATUS_OPTIONS = ['new', 'shortlisted', 'interviewed', 'hired', 'rejected'];

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [jobDesc, setJobDesc] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getCandidate(id).then((p) => {
      setProfile(p);
      setNotes(p.notes || '');
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleAnalyze = async () => {
    if (!jobDesc.trim()) return;
    setAnalyzing(true);
    try {
      const result = await api.analyzeCandidate(id, jobDesc);
      setAnalysis(result);
      setProfile((prev) => prev ? { ...prev, overall_score: result.overall_score, category: result.category } : prev);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const updated = await api.updateCandidate(id, { status } as any);
      setProfile(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const updated = await api.updateCandidate(id, { notes } as any);
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!profile) return <div className="p-8 text-red-500">Candidate not found</div>;

  const categoryColors: Record<string, string> = {
    strong_match: 'bg-green-100 text-green-800',
    good_match: 'bg-blue-100 text-blue-800',
    average_match: 'bg-yellow-100 text-yellow-800',
    weak_match: 'bg-orange-100 text-orange-800',
    reject: 'bg-red-100 text-red-800',
  };

  const statusColors: Record<string, string> = {
    new: 'bg-gray-100 text-gray-600',
    shortlisted: 'bg-indigo-100 text-indigo-700',
    interviewed: 'bg-blue-100 text-blue-700',
    hired: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{profile.name || 'Unnamed Candidate'}</h1>
            <select
              value={profile.status || 'new'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${
                statusColors[profile.status || 'new'] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4 mt-1 text-sm text-gray-500">
            {profile.email && <span>{profile.email}</span>}
            {profile.phone && <span>{profile.phone}</span>}
            {profile.location && <span>{profile.location}</span>}
          </div>
          <div className="flex gap-2 mt-2">
            {profile.linkedin && <a href={profile.linkedin} className="text-blue-600 text-sm hover:underline" target="_blank">LinkedIn</a>}
            {profile.github && <a href={profile.github} className="text-blue-600 text-sm hover:underline" target="_blank">GitHub</a>}
          </div>
        </div>
        <div className="flex flex-col items-end">
          {profile.category && (
            <span className={`text-sm font-medium px-3 py-1 rounded-full capitalize ${
              categoryColors[profile.category] || ''
            }`}>
              {profile.category.replace('_', ' ')}
            </span>
          )}
          {profile.overall_score !== null && (
            <span className="text-3xl font-bold text-gray-800 mt-2">{profile.overall_score.toFixed(0)}%</span>
          )}
        </div>
      </div>

      {/* Summary */}
      {profile.summary && (
        <div className="bg-white rounded-lg shadow p-5 mb-4">
          <h2 className="font-semibold text-gray-800 mb-2">Summary</h2>
          <p className="text-gray-600">{profile.summary}</p>
        </div>
      )}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="bg-white rounded-lg shadow p-5 mb-4">
          <h2 className="font-semibold text-gray-800 mb-3">Skills ({profile.skills.length})</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s, i) => (
              <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {profile.experience && profile.experience.length > 0 && (
        <div className="bg-white rounded-lg shadow p-5 mb-4">
          <h2 className="font-semibold text-gray-800 mb-3">Experience</h2>
          {profile.experience.map((exp, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <h3 className="font-medium text-gray-900">{exp.title}</h3>
              <p className="text-sm text-gray-500">{exp.company} · {exp.duration}</p>
              {exp.description && <p className="text-sm text-gray-600 mt-1">{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {profile.education && profile.education.length > 0 && (
        <div className="bg-white rounded-lg shadow p-5 mb-4">
          <h2 className="font-semibold text-gray-800 mb-3">Education</h2>
          {profile.education.map((edu, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <h3 className="font-medium text-gray-900">{edu.degree}</h3>
              <p className="text-sm text-gray-500">{edu.institution} · {edu.year}</p>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-lg shadow p-5 mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
          placeholder="Add private notes about this candidate..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none"
        />
        <button
          onClick={handleSaveNotes}
          disabled={saving}
          className={`mt-2 font-semibold py-1.5 px-4 rounded-lg text-sm transition-colors ${
            saved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Notes'}
        </button>
      </div>

      {/* Analyze Section */}
      <div className="bg-white rounded-lg shadow p-5 mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Analyze Against Job Description</h2>
        <textarea
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
          placeholder="Paste job description here..."
          className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none"
        />
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !jobDesc.trim()}
          className="mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          {analyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Analysis Results</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <ScoreBox label="Overall" value={analysis.overall_score} />
            <ScoreBox label="Skills" value={analysis.scores.skills_score} />
            <ScoreBox label="Experience" value={analysis.scores.experience_score} />
            <ScoreBox label="Education" value={analysis.scores.education_score} />
            <ScoreBox label="Certifications" value={analysis.scores.certification_score} />
            <ScoreBox label="Projects" value={analysis.scores.project_score} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-medium text-green-700 mb-2">Strengths</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-red-700 mb-2">Weaknesses</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>

          {analysis.missing_requirements.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-orange-700 mb-2">Missing Requirements</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.missing_requirements.map((r, i) => (
                  <span key={i} className="px-2 py.5 text-xs bg-orange-50 text-orange-700 rounded-full">{r}</span>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg text-sm font-medium" style={{
            backgroundColor: analysis.recommendation === 'Strongly Recommend' ? '#dcfce7' :
              analysis.recommendation === 'Recommend' ? '#dbeafe' :
              analysis.recommendation === 'Consider' ? '#fef9c3' : '#fee2e2',
            color: analysis.recommendation === 'Strongly Recommend' ? '#166534' :
              analysis.recommendation === 'Recommend' ? '#1e40af' :
              analysis.recommendation === 'Consider' ? '#854d0e' : '#991b1b',
          }}>
            {analysis.recommendation}
          </div>

          <p className="text-sm text-gray-600 mt-3">{analysis.summary}</p>
        </div>
      )}
    </div>
  );
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value.toFixed(0)}%</p>
    </div>
  );
}
