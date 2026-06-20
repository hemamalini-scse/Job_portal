import React, { useState } from "react";
import { Job, Application, User } from "../types";
import {
  Search,
  Briefcase,
  MapPin,
  DollarSign,
  Send,
  CheckCircle,
  FileText,
  UserCheck,
  Building,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  ChevronRight,
  ListFilter,
  Check,
  AlertCircle
} from "lucide-react";

interface SeekerDashboardProps {
  user: User;
  jobs: Job[];
  applications: Application[];
  onRefresh: () => void;
}

export default function SeekerDashboard({ user, jobs, applications, onRefresh }: SeekerDashboardProps) {
  // Tabs: 'explore' | 'my-applications'
  const [activeTab, setActiveTab] = useState<'explore' | 'my-applications'>('explore');

  // Job Search Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedSkills, setSelectedSkills] = useState<string>("all");
  
  // Selected Job Details Pane
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Application submission modal/pane
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [customCoverLetter, setCustomCoverLetter] = useState("");
  const [customResumeText, setCustomResumeText] = useState(user.resumeText || "");
  const [submittingApp, setSubmittingApp] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Get user's own applications
  const myApps = applications.filter(app => app.seekerId === user.id);

  // Get active jobs (not closed)
  const activeJobs = jobs.filter(job => job.status === "active");

  // Filter possible skill tags across active jobs for selector dropdown helper
  const allJobSkills = Array.from(
    new Set(activeJobs.flatMap(job => job.skills))
  );

  // Filter job list based on filters
  const filteredJobs = activeJobs.filter(job => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = job.title.toLowerCase().includes(query) ||
                          job.company.toLowerCase().includes(query) ||
                          job.description.toLowerCase().includes(query) ||
                          job.location.toLowerCase().includes(query) ||
                          job.skills.some(s => s.toLowerCase().includes(query));

    const matchesType = selectedType === "all" ? true : job.type === selectedType;
    const matchesSkill = selectedSkills === "all" ? true : job.skills.includes(selectedSkills);

    return matchesSearch && matchesType && matchesSkill;
  });

  // Pick first job from filtered list if nothing is selected or current selected is not in list
  const activeJob = activeJobs.find(j => j.id === selectedJobId) || filteredJobs[0];

  // Check if user has already applied for active job
  const hasAppliedToActiveJob = activeJob
    ? myApps.find(app => app.jobId === activeJob.id)
    : undefined;

  // Track status stats
  const totalApplied = myApps.length;
  const underReviewCount = myApps.filter(app => app.status === "Under Review" || app.status === "Interview Scheduled").length;
  const highestAiScore = myApps.length > 0 
    ? Math.max(...myApps.map(app => app.aiScore || 0)) 
    : 0;

  // Submit job application
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob) return;
    setSubmitError(null);
    setSubmittingApp(true);

    if (!customResumeText.trim()) {
      setSubmitError("Resume text credentials cannot be blank.");
      setSubmittingApp(false);
      return;
    }

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: activeJob.id,
          seekerId: user.id,
          seekerName: user.name,
          seekerEmail: user.email,
          coverLetter: customCoverLetter.trim() || undefined,
          resumeText: customResumeText.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setShowApplyModal(false);
        setCustomCoverLetter("");
        setSubmitSuccess(false);
        onRefresh();
        // Go to applications tab to track matching results
        setActiveTab('my-applications');
      }, 1000);

    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred while applying.");
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="space-y-6" id="seeker-dashboard">
      
      {/* Seeker Dashboard Highlight Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="seeker-summary">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Total Applications</p>
            <h3 className="text-2xl font-black text-slate-950 mt-0.5">{totalApplied}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">In-Review States</p>
            <h3 className="text-2xl font-black text-slate-950 mt-0.5">{underReviewCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Best AI Sinergy Score</p>
            <h3 className="text-2xl font-black text-emerald-950 mt-0.5">
              {highestAiScore > 0 ? `${highestAiScore}%` : "N/A"}{" "}
              {highestAiScore > 0 && (
                <span className="text-[9px] text-emerald-600 font-bold px-1.5 py-0.5 bg-emerald-50 rounded-md">Smart Index</span>
              )}
            </h3>
          </div>
        </div>
      </div>

      {/* Primary Tab Headers */}
      <div className="flex border-b border-slate-200 pb-3" id="seeker-tabs">
        <button
          onClick={() => setActiveTab('explore')}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === 'explore' ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900 bg-slate-50 border border-transparent"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Explore Job Openings
        </button>
        <button
          onClick={() => setActiveTab('my-applications')}
          className={`ml-2 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === 'my-applications' ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900 bg-slate-50 border border-transparent"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          My Applications Tracker ({myApps.length})
        </button>
      </div>

      {/* TAB COMPONENTS */}
      {activeTab === 'explore' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="explore-canvas">
          
          {/* SEARCH FILTERS AND RESULTS - 5 Columns */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            
            {/* Filter Input Blocks */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Job Match Parameters</h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Titles, companies, skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-hidden focus:border-indigo-600"
                >
                  <option value="all">Any Schedule</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                  <option value="Internship">Internship</option>
                </select>

                <select
                  value={selectedSkills}
                  onChange={(e) => setSelectedSkills(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-hidden focus:border-indigo-600"
                >
                  <option value="all">Any Skill</option>
                  {allJobSkills.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* OPPORTUNITIES LIST */}
            <div className="space-y-2 border-t border-slate-100 pt-3 max-h-[500px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-450 font-mono mb-1">
                <span>Matched Openings ({filteredJobs.length})</span>
                <span>Active</span>
              </div>

              {filteredJobs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-250 rounded-xl space-y-1">
                  <Briefcase className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-650 font-semibold">No vacancies correspond filters</p>
                  <p className="text-[11px] text-slate-400">Try broadening your queries or searching with basic tags</p>
                </div>
              ) : (
                filteredJobs.map((job) => {
                  const isCur = activeJob?.id === job.id;
                  const hasApplied = myApps.some(app => app.jobId === job.id);
                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`p-3.5 border rounded-xl text-left transition-all cursor-pointer hover:border-slate-350 ${
                        isCur
                          ? "border-indigo-650 bg-indigo-50/15 shadow-xs"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 leading-tight">{job.title}</h4>
                          <p className="text-xs text-indigo-650 font-bold mt-0.5">{job.company}</p>
                        </div>
                        {hasApplied && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Applied
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center gap-2">
                        <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-400" /> {job.location}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                        <span className="text-slate-700 font-semibold">{job.type}</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {job.skills.slice(0, 3).map(skill => (
                          <span key={skill} className="bg-slate-50 text-slate-600 text-[9px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 3 && (
                          <span className="text-[9px] text-slate-400 font-bold">+{job.skills.length - 3}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* OPPORTUNITY DETAILS CENTER VIEW - 7 Columns */}
          <div className="lg:col-span-7">
            {activeJob ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6" id="job-display-details">
                
                {/* Header context */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-650 uppercase px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-md">
                      {activeJob.type}
                    </span>
                    <h3 className="text-xl font-bold font-sans tracking-tight text-slate-950 mt-2">{activeJob.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold mt-1">
                      <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {activeJob.company}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {activeJob.location}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {activeJob.salary}</span>
                    </div>
                  </div>

                  {/* Immediate Action Buttons */}
                  <div>
                    {hasAppliedToActiveJob ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-left space-y-2">
                        <p className="text-xs text-emerald-850 font-black flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                          Application Submitted
                        </p>
                        <p className="text-[11px] text-emerald-700 leading-normal font-medium">
                          Status: <span className="font-bold underline">{hasAppliedToActiveJob.status}</span>
                        </p>
                        {hasAppliedToActiveJob.aiScore && (
                          <div className="pt-1 select-none flex items-center gap-1 border-t border-emerald-200/50 mt-1">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-650" />
                            <span className="text-[10px] font-bold text-indigo-950">AI Score: {hasAppliedToActiveJob.aiScore}%</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setCustomResumeText(user.resumeText || "");
                          setCustomCoverLetter("");
                          setShowApplyModal(true);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-550 border border-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-150 transition-all cursor-pointer whitespace-nowrap block"
                        id="open-apply-form-btn"
                      >
                        Apply for Job Position
                      </button>
                    )}
                  </div>
                </div>

                {/* Job specification block */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Detailed Role Description</h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                      {activeJob.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Qualifications & Skill Requirements</h4>
                    <ul className="space-y-2">
                      {activeJob.requirements.map((req, i) => (
                        <li key={i} className="text-xs text-slate-700 font-sans flex items-start gap-2 font-medium">
                          <span className="text-indigo-600 shrink-0 font-bold mt-0.5">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Desirable Technical Stack</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeJob.skills.map((skill) => {
                        // Check if seeker profile has this skill
                        const hasMatchingSkill = user.skills?.some(
                          userSkill => userSkill.toLowerCase() === skill.toLowerCase()
                        );
                        return (
                          <span
                            key={skill}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                              hasMatchingSkill
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-slate-50 border-slate-200 text-slate-600"
                            }`}
                          >
                            {skill}
                            {hasMatchingSkill && <Check className="w-3 h-3 text-emerald-600" />}
                          </span>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                      Green tags denote direct match alignment with your registered seeker profile.
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-16 rounded-xl text-center text-slate-500">
                <Briefcase className="w-10 h-10 text-slate-405 mx-auto mb-2" />
                <h3 className="font-bold text-sm">No vacancy matches</h3>
                <p className="text-xs">Select any job vacancy to track compatibility and file applications</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MY APPLICATIONS TRACKING TAB */
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4" id="applications-tracker">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Your Application Pipeline Status</h3>
            <span className="text-xs text-slate-500 font-medium">Track your candidate files</span>
          </div>

          {myApps.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-250 rounded-2xl">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="font-black text-sm text-slate-800 mb-1">Your pipeline tracker is empty</h4>
              <p className="text-xs text-slate-500 mb-4">You have not submitted applications to any position listings yet.</p>
              <button
                onClick={() => setActiveTab('explore')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Find opening vacancies now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myApps.map((app) => {
                // Color mapping for app status
                let badgeStyle = "bg-sky-50 border-sky-100 text-sky-800";
                if (app.status === "Interview Scheduled") badgeStyle = "bg-emerald-50 border-emerald-250 text-emerald-800";
                if (app.status === "Offer Extended") badgeStyle = "bg-purple-50 border-purple-250 text-purple-800";
                if (app.status === "Rejected") badgeStyle = "bg-rose-50 border-rose-250 text-rose-800";
                if (app.status === "Under Review") badgeStyle = "bg-amber-50 border-amber-250 text-amber-800";

                // Score Color Mapping
                let aiBadgeStyle = "bg-slate-100 text-slate-700";
                if ((app.aiScore || 0) >= 80) aiBadgeStyle = "bg-emerald-50 border-emerald-200 text-emerald-800";
                else if ((app.aiScore || 0) >= 65) aiBadgeStyle = "bg-indigo-50 border-indigo-200 text-indigo-800";

                return (
                  <div key={app.id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all text-left space-y-4">
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">{app.jobTitle}</h4>
                        <p className="text-xs font-bold text-indigo-600">{app.company}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Applied: {new Date(app.appliedAt).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"})}
                        </span>
                        
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeStyle}`}>
                          • {app.status}
                        </span>
                      </div>
                    </div>

                    {/* Screening results */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* AI Index Gauge Badge */}
                      <div className="md:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-tight flex items-center gap-0.5 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-650" /> Gemini Match
                        </span>
                        <h5 className="text-3xl font-black text-slate-900 leading-tight">
                          {app.aiScore !== undefined ? `${app.aiScore}%` : "Evaluating..."}
                        </h5>
                        <p className="text-[9px] text-slate-450 mt-1">Screening Index</p>
                      </div>

                      {/* AI review narrative info block */}
                      <div className="md:col-span-9 bg-indigo-50/20 border border-indigo-100 p-4 rounded-xl space-y-2">
                        <h5 className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-150" />
                          Screening Analysis Highlights:
                        </h5>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                          {app.aiAnalysis || "Evaluation results are pending. The system will refresh dashboard records when analysis is compiled."}
                        </p>
                      </div>
                    </div>

                    {/* Custom Cover letter and notes panel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1 bg-emerald-50/10 border border-emerald-100 p-3 rounded-lg">
                        <span className="font-bold text-emerald-850">Your Cover Message:</span>
                        <p className="text-slate-650 italic leading-snug">"{app.coverLetter}"</p>
                      </div>

                      <div className="space-y-1 bg-amber-50/10 border border-amber-100 p-3 rounded-lg">
                        <span className="font-bold text-slate-805">Recruiter Comments / Actions:</span>
                        <p className="text-slate-650 font-medium">
                          {app.notes ? app.notes : "No actions logged yet. Review process takes approximately 3-5 business days."}
                        </p>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* APPLICATION SUBMISSION FORM MODAL POPUP */}
      {showApplyModal && activeJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-950 font-sans tracking-tight">Submit Candidate Profile</h3>
                <p className="text-xs text-slate-500">Applying for: <span className="font-bold text-indigo-600">{activeJob.title}</span> ({activeJob.company})</p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-left">
              
              <div className="p-3 bg-amber-50/50 border border-amber-250 rounded-xl space-y-1.5 text-xs text-slate-700 leading-relaxed font-sans font-medium">
                <p className="font-bold text-amber-850 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Gemini Compatibility Check Active
                </p>
                <p>
                  Upon submission, our integrated Gemini models will conduct a matching assessment scan on your customized resume and cover message against the job's key requirements.
                </p>
              </div>

              {/* Cover Letter */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Custom Cover Message</label>
                <textarea
                  rows={3}
                  value={customCoverLetter}
                  onChange={(e) => setCustomCoverLetter(e.target.value)}
                  placeholder="Explain why you are an outstanding fit for this job position..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              {/* Editable Seeker Resume details */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 block">Customize Resume Text credentials for this Job</label>
                  <span className="text-[10px] text-slate-400">Prefilled from Seeker Profile</span>
                </div>
                <textarea
                  rows={5}
                  required
                  value={customResumeText}
                  onChange={(e) => setCustomResumeText(e.target.value)}
                  placeholder="Paste details of resume here..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600 font-mono leading-relaxed"
                />
              </div>

              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  ⚠️ {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                  Application profile sent successfully! Loading Gemini screening assessment...
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp || submitSuccess}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  id="finalise-apply-btn"
                >
                  {submittingApp ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Checking & Submitting...
                    </>
                  ) : (
                    "Submit Application profile"
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
