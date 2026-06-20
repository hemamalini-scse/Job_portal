import React, { useState } from "react";
import { Job, Application, User } from "../types";
import {
  Users,
  Briefcase,
  Layers,
  Sparkles,
  Search,
  Plus,
  TrendingUp,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Send,
  Loader2,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  UserCheck
} from "lucide-react";

interface RecruiterDashboardProps {
  user: User;
  jobs: Job[];
  applications: Application[];
  onRefresh: () => void;
}

export default function RecruiterDashboard({ user, jobs, applications, onRefresh }: RecruiterDashboardProps) {
  // Tabs: 'applicants' | 'jobs'
  const [activeTab, setActiveTab] = useState<'applicants' | 'jobs'>('applicants');
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Selected application inspection
  const [selectedAppId, setSelectedAppId] = useState<string | null>(applications[0]?.id || null);
  
  // Custom Recruit Notes & Status actions
  const [candidateNotes, setCandidateNotes] = useState("");
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [runningAiScreenerId, setRunningAiScreenerId] = useState<string | null>(null);

  // New job form state
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobLocation, setNewJobLocation] = useState("");
  const [newJobType, setNewJobType] = useState<'Full-Time' | 'Part-Time' | 'Contract' | 'Remote' | 'Internship'>('Full-Time');
  const [newJobSalary, setNewJobSalary] = useState("");
  const [newJobDescription, setNewJobDescription] = useState("");
  const [newJobSkills, setNewJobSkills] = useState("");
  const [newJobReqs, setNewJobReqs] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submittingJob, setSubmittingJob] = useState(false);

  // Populate dynamic analytics info
  const recruitersJobs = jobs.filter(j => j.recruiterId === user.id || j.recruiterId === "recruiter-1"); // Seeds support
  const activePostings = recruitersJobs.filter(j => j.status === "active").length;
  
  // Filter apps relevant to this recruiters postings
  const recruitersJobsIds = recruitersJobs.map(j => j.id);
  const relevantApps = applications.filter(app => recruitersJobsIds.includes(app.jobId) || app.jobId === "job-1" || app.jobId === "job-2");
  
  const totalApps = relevantApps.length;
  const interviewsScheduled = relevantApps.filter(app => app.status === "Interview Scheduled").length;
  
  const averageAiScore = totalApps > 0
    ? Math.round(relevantApps.reduce((acc, curr) => acc + (curr.aiScore || 0), 0) / totalApps)
    : 0;

  // Search and filter operations
  const filteredApps = relevantApps.filter(app => {
    const matchesSearch = app.seekerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.seekerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.resumeText.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJob = selectedJobId === "all" ? true : app.jobId === selectedJobId;
    const matchesStatus = statusFilter === "all" ? true : app.status === statusFilter;

    return matchesSearch && matchesJob && matchesStatus;
  }).sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)); // Highlight best matches descending

  // Selected Application
  const activeApp = relevantApps.find(app => app.id === selectedAppId) || filteredApps[0];

  // Set notes when active application details changes
  React.useEffect(() => {
    if (activeApp) {
      setCandidateNotes(activeApp.notes || "");
    }
  }, [activeApp?.id]);

  // Handle Application State Progress
  const updateApplicationStatusState = async (appId: string, newStatus: Application['status']) => {
    setEditingStatusId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEditingStatusId(null);
    }
  };

  // Submit recruiter review comments
  const handleSaveNotes = async (appId: string) => {
    setSavingNotesId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: activeApp?.status, notes: candidateNotes })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNotesId(null);
    }
  };

  // Trigger Gemini screening re-run manually
  const triggerAiReassessment = async (appId: string) => {
    setRunningAiScreenerId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}/ai-evaluate`, {
        method: "POST"
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningAiScreenerId(null);
    }
  };

  // Toggle Jobactive state (active/closed)
  const toggleJobStatusState = async (job: Job) => {
    const freshStatus = job.status === "active" ? "closed" : "active";
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: freshStatus })
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Job Listing
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmittingJob(true);

    if (!newJobTitle.trim() || !newJobLocation.trim() || !newJobDescription.trim()) {
      setFormError("Job title, location, and description details are mandatory.");
      setSubmittingJob(false);
      return;
    }

    const skills = newJobSkills.split(",").map(s => s.trim()).filter(s => s.length > 0);
    const requirements = newJobReqs.split("\n").map(r => r.trim()).filter(r => r.length > 0);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newJobTitle.trim(),
          company: user.companyName || "RiseTalent Recruiter Partner",
          location: newJobLocation.trim(),
          type: newJobType,
          salary: newJobSalary.trim() || "Negotiable",
          description: newJobDescription.trim(),
          requirements,
          skills,
          recruiterId: user.id
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create vacancy posting");
      }

      // Close modal & reset fields
      setShowNewJobModal(false);
      setNewJobTitle("");
      setNewJobLocation("");
      setNewJobSalary("");
      setNewJobSkills("");
      setNewJobReqs("");
      setNewJobDescription("");
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setSubmittingJob(false);
    }
  };

  // Preset button options for fast vacancy templates setup
  const fillJobPreset = (title: string, skills: string, requirements: string, description: string) => {
    setNewJobTitle(title);
    setNewJobSkills(skills);
    setNewJobReqs(requirements);
    setNewJobDescription(description);
    setNewJobLocation("Remote (Anywhere)");
    setNewJobSalary("₹8,00,000 - ₹12,00,000");
  };

  return (
    <div className="space-y-6" id="recruiter-dashboard">
      
      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="metrics-panel">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Active Postings</p>
            <h3 className="text-2xl font-black text-slate-950 mt-0.5">{activePostings}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Total Applicants</p>
            <h3 className="text-2xl font-black text-slate-950 mt-0.5">{totalApps}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Interviews Scheduled</p>
            <h3 className="text-2xl font-black text-slate-950 mt-0.5">{interviewsScheduled}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
              Avg compatibility
            </p>
            <h3 className="text-2xl font-black text-indigo-950 mt-0.5">
              {averageAiScore}% <span className="text-[10px] text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-50 rounded-md">Smart Index</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Main Panel Controls Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 gap-4" id="recruiter-sub-tabs">
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('applicants')}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === 'applicants' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Applicant Screening Tracking ({totalApps})
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === 'jobs' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Manage Job Postings ({recruitersJobs.length})
          </button>
        </div>

        <div>
          {activeTab === 'jobs' && (
            <button
              onClick={() => setShowNewJobModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 border border-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer shadow-xs whitespace-nowrap"
              id="new-job-btn"
            >
              <Plus className="w-4 h-4" />
              Post Vacancy Opening
            </button>
          )}
        </div>
      </div>

      {/* RENDER ACTIVE SCREEN WORKFLOWS */}
      {activeTab === 'applicants' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="applicants-workspace">
          
          {/* LEFT: Filters & Applicants list - Spans 5 columns */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
            
            {/* SEARCH AND FILTERS PANEL */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Query Filter</h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Query Name, Title, Keyword profile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-hidden focus:border-indigo-600"
                >
                  <option value="all">All Jobs</option>
                  {recruitersJobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-hidden focus:border-indigo-600"
                >
                  <option value="all">All Statuses</option>
                  <option value="Applied">Applied</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Interview Scheduled">Interview Scheduled</option>
                  <option value="Offer Extended">Offer Extended</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* LIST OF APPLICANTS */}
            <div className="space-y-2 border-t border-slate-100 pt-3 max-h-[500px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 font-mono">Matched candidates ({filteredApps.length})</span>
                <span className="text-[10px] text-slate-400">Indexed by compatibility</span>
              </div>

              {filteredApps.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-250 rounded-xl space-y-1">
                  <Users className="w-6 h-6 text-slate-450 mx-auto" />
                  <p className="text-xs text-slate-550 font-semibold">No job applicants found</p>
                  <p className="text-[11px] text-slate-400">Try modifying search tags or selected job filter</p>
                </div>
              ) : (
                filteredApps.map((app) => {
                  const isCur = activeApp?.id === app.id;
                  // Color for score badge
                  let scoreColor = "bg-rose-50 text-rose-700 border-rose-200";
                  if ((app.aiScore || 0) >= 80) scoreColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  else if ((app.aiScore || 0) >= 65) scoreColor = "bg-indigo-50 text-indigo-700 border-indigo-200";

                  // Status Indicator color
                  let statusColor = "bg-sky-50 text-sky-700 border-sky-100";
                  if (app.status === "Interview Scheduled") statusColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  if (app.status === "Offer Extended") statusColor = "bg-purple-50 text-purple-700 border-purple-100";
                  if (app.status === "Rejected") statusColor = "bg-rose-50 text-rose-700 border-rose-100";

                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`p-3.5 border rounded-xl text-left transition-all cursor-pointer relative hover:border-slate-350 ${
                        isCur
                          ? "border-indigo-600 bg-indigo-50/15 shadow-xs"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-black text-slate-900 leading-tight">{app.seekerName}</p>
                          <p className="text-xs text-slate-500 font-medium truncate max-w-[140px]">{app.jobTitle}</p>
                        </div>
                        {/* AI Score Badge */}
                        <div className={`px-2 py-0.5 border text-xs font-bold rounded-md flex items-center gap-1 ${scoreColor}`}>
                          <Sparkles className="w-3 h-3" />
                          {app.aiScore}%
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-mono">
                          {new Date(app.appliedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-semibold tracking-wide ${statusColor}`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Candidate details - Spans 7 columns */}
          <div className="lg:col-span-7 space-y-4">
            {activeApp ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6" id="applicant-display-card">
                
                {/* CANDIDATE HEADER AREA */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-4 gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-950 font-sans tracking-tight">{activeApp.seekerName}</h3>
                    <p className="text-xs text-indigo-600 font-bold">{activeApp.seekerEmail}</p>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Applied for: <span className="text-slate-800 font-bold">{activeApp.jobTitle}</span>
                    </p>
                  </div>

                  {/* Application Status Actions */}
                  <div className="space-y-1.5 min-w-[180px]">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      <span>Recruit Pipeline</span>
                      {editingStatusId === activeApp.id && <Loader2 className="w-3 h-3 animate-spin text-slate-500" />}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => updateApplicationStatusState(activeApp.id, "Under Review")}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                          activeApp.status === "Under Review"
                            ? "bg-amber-500 border-amber-500 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Review
                      </button>
                      <button
                        onClick={() => updateApplicationStatusState(activeApp.id, "Interview Scheduled")}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                          activeApp.status === "Interview Scheduled"
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Interview
                      </button>
                      <button
                        onClick={() => updateApplicationStatusState(activeApp.id, "Offer Extended")}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                          activeApp.status === "Offer Extended"
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Offer
                      </button>
                      <button
                        onClick={() => updateApplicationStatusState(activeApp.id, "Rejected")}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                          activeApp.status === "Rejected"
                            ? "bg-rose-600 border-rose-600 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI SCREENING MATRIX HERO PANEL */}
                <div className="bg-indigo-50/40 rounded-xl border border-indigo-100 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 font-sans tracking-tight">
                      <Sparkles className="w-4 h-4 text-indigo-600 fill-indigo-200" />
                      Dynamic AI Compatibility Index Evaluation
                    </span>
                    <button
                      onClick={() => triggerAiReassessment(activeApp.id)}
                      disabled={runningAiScreenerId !== null}
                      title="Request a re-check from Gemini for updated compatibility parameters"
                      className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-slate-50 px-2 py-1 rounded-md border border-indigo-250 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${runningAiScreenerId === activeApp.id ? "animate-spin" : ""}`} />
                      {runningAiScreenerId === activeApp.id ? "Analyzing..." : "Re-evaluate"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-3 text-center border-r border-indigo-100 sm:pr-4 py-1">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Compatibility</p>
                      <h4 className="text-4xl font-extrabold text-indigo-950 mt-1">{activeApp.aiScore}%</h4>
                      <p className="text-[9px] text-slate-500 font-medium font-mono mt-1">Match Index</p>
                    </div>

                    <div className="sm:col-span-9 text-left">
                      <p className="text-xs text-indigo-900 leading-relaxed font-sans font-medium">
                        {activeApp.aiAnalysis || "Screening assessment metrics are not ready. Please launch manual evaluation re-run button."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* VISIBLE RESUME VIEWER */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Submitted Resume Profile Details</h4>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl max-h-[220px] overflow-y-auto text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
                      {activeApp.resumeText}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Candidate Cover Message</h4>
                    <p className="text-xs text-slate-700 leading-relaxed italic bg-emerald-50/20 border border-emerald-100 p-3 rounded-lg">
                      "{activeApp.coverLetter}"
                    </p>
                  </div>
                </div>

                {/* NOTES AND FEEDBACK ACTIONS */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Recruiter Assessment & Feedback Logs</h4>
                  
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      placeholder="Add assessment highlights, mock interview timings, candidate gaps, or task feedback details..."
                      value={candidateNotes}
                      onChange={(e) => setCandidateNotes(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600"
                    />
                    <button
                      onClick={() => handleSaveNotes(activeApp.id)}
                      disabled={savingNotesId !== null}
                      className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors min-w-[90px]"
                    >
                      {savingNotesId === activeApp.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        "Save Notes"
                      )}
                    </button>
                  </div>
                  {activeApp.notes && (
                    <p className="text-[11.5px] text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-md border border-emerald-100 font-medium">
                      🎯 Current Logged Notes: {activeApp.notes}
                    </p>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-16 rounded-xl text-center space-y-2 text-slate-500">
                <Users className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-extrabold text-sm">No Applicant Record Selected</h3>
                <p className="text-xs">Select any job applicant block in the left panel to trigger candidate tracking workflows.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* MANAGE JOB POSTINGS TAB */
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4" id="jobs-workspace">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Jobs Posted by {user.companyName || "Your Team"}</h3>
            <span className="text-xs text-slate-400 font-mono">Total openings: {recruitersJobs.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recruitersJobs.length === 0 ? (
              <div className="md:col-span-2 text-center py-20 bg-slate-50 border border-dashed border-slate-250 rounded-2xl">
                <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="font-black text-sm text-slate-800 mb-1">Vacancy board is clear</h4>
                <p className="text-xs text-slate-500 mb-4">You have not drafted any employment listings yet.</p>
                <button
                  onClick={() => setShowNewJobModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Create vacancy opening now
                </button>
              </div>
            ) : (
              recruitersJobs.map((job) => (
                <div key={job.id} className="border border-slate-250 p-5 rounded-xl hover:border-slate-350 transition-all flex flex-col justify-between whitespace-normal text-left bg-white shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border tracking-wider uppercase ${
                        job.status === "active" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-100 border-slate-300 text-slate-600"
                      }`}>
                        {job.status === "active" ? "Active" : "Closed"}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">ID: {job.id}</span>
                    </div>

                    <h4 className="font-extrabold text-slate-950 text-base font-sans tracking-tight leading-snug">{job.title}</h4>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                      <span className="flex items-center gap-0.5"><DollarSign className="w-3.1 h-3.1" /> {job.salary}</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mt-2">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {job.skills.map(s => (
                        <span key={s} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Posted: {new Date(job.createdAt).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"})}
                    </span>
                    <button
                      onClick={() => toggleJobStatusState(job)}
                      className={`text-xs font-bold px-3 py-1.5 border rounded-xl cursor-pointer transition-all ${
                        job.status === "active"
                          ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-250"
                          : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                      }`}
                    >
                      {job.status === "active" ? "Close Vacancy" : "Re-open opening"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* NEW VACANCY VACATED POPUP MODAL */}
      {showNewJobModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-950 font-sans tracking-tight">Post New Vacancy Opening</h3>
                <p className="text-xs text-slate-500">Add an industry-oriented spec sheet to screen with Gemini Matcher.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewJobModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* PRESET VACANCIES ASSISTANCE */}
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl mb-4 text-left">
              <p className="text-xs font-bold text-indigo-900 mb-1.5">⚡ Draft Assist Presets (Fast Sandbox Filling):</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillJobPreset(
                    "Cloud Infrastructure Dev",
                    "AWS, Docker, Node.js, Express, Git",
                    "Proven experience setting up server infrastructures\nWorking understanding of Docker environments\nFamiliarity with CI/CD workflows and Git branching",
                    "We require a backend-heavy infrastructure engineer to assist with automated deployment setups. You will coordinate with database developers and frontend designers to maintain reliable servers."
                  )}
                  className="text-[10px] bg-white hover:bg-indigo-100/50 border border-indigo-250 text-indigo-850 font-bold px-2 py-1 rounded transition-colors"
                >
                  ⚙️ DevOps Engineer
                </button>
                <button
                  type="button"
                  onClick={() => fillJobPreset(
                    "Senior React Developer",
                    "React, Tailwind CSS, Motion, TypeScript",
                    "Over 4 years web application design experience\nDetailed control of high-performance rendering\nWriting responsive components with clean validation tests",
                    "Help us polish the UI components and custom motion transitions on our core dashboard metrics boards. Must love pixel accuracy and Inter typesetting paradigms."
                  )}
                  className="text-[10px] bg-white hover:bg-indigo-100/50 border border-indigo-250 text-indigo-850 font-bold px-2 py-1 rounded transition-colors"
                >
                  🎨 React Web Dev
                </button>
              </div>
            </div>

            {/* MAIN POST OPENING FORM */}
            <form onSubmit={handleCreateJob} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Job Position Title</label>
                  <input
                    type="text"
                    required
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Location Specification</label>
                  <input
                    type="text"
                    required
                    value={newJobLocation}
                    onChange={(e) => setNewJobLocation(e.target.value)}
                    placeholder="e.g. Remote, or Chennai, India"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Employment Category</label>
                  <select
                    value={newJobType}
                    onChange={(e) => setNewJobType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-indigo-600"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Remote">Remote</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Salary Package Description</label>
                  <input
                    type="text"
                    value={newJobSalary}
                    onChange={(e) => setNewJobSalary(e.target.value)}
                    placeholder="e.g. ₹6,00,000 - ₹9,00,000 per annum"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Skills (Comma-separated Tags for screening evaluation)</label>
                <input
                  type="text"
                  required
                  value={newJobSkills}
                  onChange={(e) => setNewJobSkills(e.target.value)}
                  placeholder="React, Git, Node.js, Express, REST APIs"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block text-slate-750">Job Role Description</label>
                <textarea
                  rows={3}
                  required
                  value={newJobDescription}
                  onChange={(e) => setNewJobDescription(e.target.value)}
                  placeholder="Outline overall daily tasks, team scope details, product roadmap requirements..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                  <span>Candidate Requirements (one per line)</span>
                  <span className="text-[10px] text-slate-400">Strict Checks</span>
                </label>
                <textarea
                  rows={3}
                  value={newJobReqs}
                  onChange={(e) => setNewJobReqs(e.target.value)}
                  placeholder="Requirement 1: 5 years software experience&#10;Requirement 2: Graduate in CS or engineering field"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-600 font-mono"
                />
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  ⚠️ {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewJobModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJob}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                  id="submit-vacancy-btn"
                >
                  {submittingJob ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish Vacancy opening"
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
