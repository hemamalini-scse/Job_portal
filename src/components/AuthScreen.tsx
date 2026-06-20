import React, { useState } from "react";
import { User, AuthState } from "../types";
import { UserPlus, LogIn, Sparkles, Building, Briefcase, Award, CheckCircle } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (auth: AuthState) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'seeker' | 'recruiter'>('seeker');
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [skillsString, setSkillsString] = useState("");
  const [experience, setExperience] = useState("");
  const [resumeText, setResumeText] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick fill preset templates for testing workflow speed
  const fillPreset = (type: 'seeker-alex' | 'seeker-maya' | 'recruiter-hemam') => {
    setError(null);
    if (type === 'seeker-alex') {
      setIsRegister(true);
      setRole('seeker');
      setEmail("alex@example.com");
      setName("Alex Chen");
      setTitle("Full Stack Engineer");
      setSkillsString("React, Node.js, Express, TypeScript, Tailwind CSS, Git");
      setExperience("3 Years");
      setResumeText("Experienced Full Stack Engineer with strong expertise in the MERN Stack. Build robust REST APIs with Node.js and Express. Develop beautiful, interactive frontends using React, TypeScript, and animated layouts with Motion. Proficient in Git, database design, and workflow automation. Excited about crafting great web products.");
    } else if (type === 'seeker-maya') {
      setIsRegister(true);
      setRole('seeker');
      setEmail("maya@example.com");
      setName("Maya Patel");
      setTitle("Backend Specialist");
      setSkillsString("Node.js, Express, REST APIs, MongoDB, PostgreSQL, Git");
      setExperience("5 Years");
      setResumeText("Dedicated Backend Developer specializing in scalable node applications, backend database structures, database query optimizations, and RESTful web microservices. Built high-traffic payment processing gateways and recruiter messaging platforms. Avid open-source contributor and git wizard.");
    } else if (type === 'recruiter-hemam') {
      setIsRegister(true);
      setRole('recruiter');
      setEmail("rise@tamizhanskills.com");
      setName("Hemam Tamil");
      setCompanyName("Tamizhan Skills");
      setTitle("");
      setSkillsString("");
      setExperience("");
      setResumeText("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!email.trim()) {
      setError("Please provide a valid email address.");
      setLoading(false);
      return;
    }

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    
    // Skill preprocessing for seeker
    const skills = skillsString
      ? skillsString.split(",").map(s => s.trim()).filter(s => s.length > 0)
      : [];

    const payload = isRegister ? {
      email: email.trim(),
      name: name.trim(),
      role,
      companyName: role === "recruiter" ? companyName.trim() : undefined,
      title: role === "seeker" ? title.trim() : undefined,
      skills: role === "seeker" ? skills : undefined,
      experience: role === "seeker" ? experience.trim() : undefined,
      resumeText: role === "seeker" ? resumeText.trim() : undefined,
    } : {
      email: email.trim()
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setSuccessMsg(isRegister ? "Profile created successfully!" : "Logged in successfully!");
      
      // Delay briefly to allow user to experience the transition
      setTimeout(() => {
        onAuthSuccess({
          user: data.user,
          token: data.token
        });
      }, 600);

    } catch (err: any) {
      setError(err.message || "Something went wrong during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto self-center bg-white p-8 rounded-2xl border border-slate-200 shadow-xl" id="auth-panel">
      
      {/* Brand / Logo intro */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 font-mono text-amber-700 text-xs font-semibold mb-3 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          MERN Internship Projects
        </span>
        <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-900">
          Welcome to RiseTalent
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Industry-Ready Job Application & AI Screening Platform
        </p>

        {/* Quick presets area for seamless reviewer navigation */}
        <div className="mt-5 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-left">
          <p className="text-xs font-bold text-indigo-850 mb-2 flex items-center justify-between">
            <span>⚡ Prototyping Quick Fills (1-Click Setup):</span>
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => fillPreset('recruiter-hemam')}
              className="text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-1 px-1.5 rounded transition-transform active:scale-95 cursor-pointer text-center"
            >
              💼 Hemam (Recruiter)
            </button>
            <button
              type="button"
              onClick={() => fillPreset('seeker-alex')}
              className="text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-1 px-1.5 rounded transition-transform active:scale-95 cursor-pointer text-center"
            >
              🧑‍💻 Alex (Seeker)
            </button>
            <button
              type="button"
              onClick={() => fillPreset('seeker-maya')}
              className="text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-1 px-1.5 rounded transition-transform active:scale-95 cursor-pointer text-center"
            >
              👩‍💻 Maya (Seeker)
            </button>
          </div>
        </div>
      </div>

      {/* Tabs list to toggle register vs login mode */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6" id="auth-tabs">
        <button
          type="button"
          onClick={() => { setIsRegister(false); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
            !isRegister ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          Login Access
        </button>
        <button
          type="button"
          onClick={() => { setIsRegister(true); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
            isRegister ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Register Profile
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Register exclusive fields */}
        {isRegister && (
          <>
            {/* Role toggler */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 mb-1 block">Account Workspace Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('seeker')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    role === 'seeker'
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold shadow-xs"
                      : "border-slate-250 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Job Seeker
                </button>
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    role === 'recruiter'
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold shadow-xs"
                      : "border-slate-250 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Building className="w-4 h-4" />
                  Recruiter
                </button>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Tamizh Selvan"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            {/* Recruiter specific content */}
            {role === 'recruiter' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="e.g. Tamizhan Skills Academic"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            )}

            {/* Seeker specific content */}
            {role === 'seeker' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Professional Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Frontend React developer"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 block">Expertise Skills (comma separated)</label>
                    <span className="text-[10px] text-slate-400 font-mono">Tags</span>
                  </div>
                  <input
                    type="text"
                    value={skillsString}
                    onChange={(e) => setSkillsString(e.target.value)}
                    required
                    placeholder="e.g. React, Node.js, Git, Express"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Years of Experience</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    required
                    placeholder="e.g. 2 Years, or Entry Level"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Resume Text Profile details</label>
                  <textarea
                    rows={4}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    required
                    placeholder="Paste details of resume here. Include work experience, bullet points about previous work projects, education, and technical framework competencies."
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:border-indigo-600 focus:outline-hidden font-sans placeholder:text-slate-400"
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Email Input */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="e.g. rise@tamizhanskills.com"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-hidden font-sans"
          />
        </div>

        {/* Messaging Logs */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-55 block"
          id="auth-submit-btn"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Authenticating...
            </span>
          ) : isRegister ? (
            "Create & Sign In to Profile"
          ) : (
            "Access Account Portal"
          )}
        </button>
      </form>
      
      {/* Helpful credential tip */}
      {!isRegister && (
        <p className="text-[11px] text-center text-slate-400 mt-4 leading-normal">
          Registered email logins require no password settings. Simply enter custom or seeded email directly.
        </p>
      )}
    </div>
  );
}
