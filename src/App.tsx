import { useState, useEffect } from "react";
import { User, Job, Application, AuthState } from "./types";
import Header from "./components/Header";
import AuthScreen from "./components/AuthScreen";
import RecruiterDashboard from "./components/RecruiterDashboard";
import SeekerDashboard from "./components/SeekerDashboard";
import { Sparkles, Briefcase, RefreshCw, Layers } from "lucide-react";

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // Restore authenticated session from localStorage on mount
  useEffect(() => {
    const cachedUser = localStorage.getItem("rise_talent_user");
    const cachedToken = localStorage.getItem("rise_talent_token");

    if (cachedUser && cachedToken) {
      try {
        setAuthState({
          user: JSON.parse(cachedUser),
          token: cachedToken,
        });
      } catch (e) {
        console.error("Failed to restore cached authentication session", e);
      }
    }
    
    // Perform initial data fetch
    fetchAllData();
  }, []);

  // Sync data whenever authentication state changes
  useEffect(() => {
    if (authState.user) {
      fetchApplications();
    }
  }, [authState.user?.id]);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.error("Failed to fetch jobs listing array:", e);
    }
  };

  const fetchApplications = async () => {
    if (!authState.user) return;
    try {
      let url = "/api/applications";
      if (authState.user.role === "seeker") {
        url += `?seekerId=${authState.user.id}`;
      } else if (authState.user.role === "recruiter") {
        url += `?recruiterId=${authState.user.id}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (e) {
      console.error("Failed to fetch applications:", e);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchJobs(), fetchApplications()]);
    setIsLoading(false);
  };

  const handleAuthSuccess = (newAuth: AuthState) => {
    setAuthState(newAuth);
    if (newAuth.user) {
      localStorage.setItem("rise_talent_user", JSON.stringify(newAuth.user));
    }
    if (newAuth.token) {
      localStorage.setItem("rise_talent_token", newAuth.token);
    }
    // Fire fresh details fetches
    fetchJobs();
    if (newAuth.user) {
      // Lazy application fetch
      let url = "/api/applications";
      if (newAuth.user.role === "seeker") {
        url += `?seekerId=${newAuth.user.id}`;
      } else {
        url += `?recruiterId=${newAuth.user.id}`;
      }
      fetch(url)
        .then(res => res.json())
        .then(data => setApplications(data))
        .catch(err => console.error(err));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("rise_talent_user");
    localStorage.removeItem("rise_talent_token");
    setAuthState({ user: null, token: null });
    setApplications([]);
  };

  // Reset core database to pristine seeded initial values
  const handleResetDb = async () => {
    if (!confirm("Are you sure you want to restore initial demo seed records? This will clear temporary entries.")) return;
    setIsResetting(true);
    try {
      const res = await fetch("/api/system/reset", { method: "POST" });
      if (res.ok) {
        // Clear auth to let them choose seed user details
        handleLogout();
        await fetchAllData();
      }
    } catch (e) {
      console.error("Error during system database seed restore:", e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans" id="app-container">
      
      {/* Header components */}
      <Header
        user={authState.user}
        onLogout={handleLogout}
        onResetDb={handleResetDb}
        isResetting={isResetting}
      />

      {/* Main Container Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start">
        
        {/* Loading display spinner */}
        {isLoading && !authState.user ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-20" id="loading-spinner">
            <RefreshCw className="w-8 h-8 text-indigo-650 animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Querying platform database records...</p>
          </div>
        ) : !authState.user ? (
          /* ANONYMOUS: Render landing header with integrated login options */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1 my-auto pb-8">
            
            {/* Visual Intro Info (Left Column) */}
            <div className="lg:col-span-7 space-y-6 text-left max-w-2xl pr-0 lg:pr-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs font-bold rounded-full select-none shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-200" />
                Next Generator Recruitment Hub
              </span>

              <h1 className="text-4xl sm:text-5xl font-black font-sans tracking-tight text-slate-950 leading-tight">
                Evaluate candidates instantly with <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">Gemini Smart AI</span> match
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans font-medium">
                RiseTalent bridges the gap between hiring teams and candidates with automated compatibility indexes, interactive applicant status trackers, vacancy draft presets, and customized resume screening reports.
              </p>

              {/* Bento styled list of platform details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-white border border-slate-205 p-4 rounded-xl shadow-xs">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    For Recruiters
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                    Draft vacancy sheets with required skill tags. Analyze applicant suitability immediately using our multi-level pipeline check list.
                  </p>
                </div>

                <div className="bg-white border border-slate-205 p-4 rounded-xl shadow-xs">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    For Job Seekers
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                    Submit customized resumes and custom cover letters. Track review stages and view matching scores.
                  </p>
                </div>
              </div>

              {/* Developer note */}
              <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-450 leading-normal flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span>Interactions sandbox powered by full-stack Express REST APIs and standard node persistence.</span>
              </div>
            </div>

            {/* Authenticated Access Panel Wrapper (Right Column) */}
            <div className="lg:col-span-5 flex justify-center w-full">
              <AuthScreen onAuthSuccess={handleAuthSuccess} />
            </div>

          </div>
        ) : (
          /* AUTHENTICATED: Main dynamic dashboards modules */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-4 text-left">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950 font-sans tracking-tight">
                  Welcome back, {authState.user.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage your interactive recruitment pipeline boards
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">Role:</span>
                <span className={`px-2.5 py-1 font-bold rounded-lg ${
                  authState.user.role === "recruiter"
                    ? "bg-amber-50 border border-amber-200 text-amber-800"
                    : "bg-indigo-50 border border-indigo-200 text-indigo-800"
                }`}>
                  {authState.user.role === "recruiter" ? "Recruiter" : "Job Seeker"}
                </span>
              </div>
            </div>

            {authState.user.role === "recruiter" ? (
              <RecruiterDashboard
                user={authState.user}
                jobs={jobs}
                applications={applications}
                onRefresh={fetchAllData}
              />
            ) : (
              <SeekerDashboard
                user={authState.user}
                jobs={jobs}
                applications={applications}
                onRefresh={fetchAllData}
              />
            )}
          </div>
        )}

      </main>

      {/* Humble Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12 text-center text-slate-405">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs space-y-2">
          <p className="font-semibold text-slate-400">
            RiseTalent Portal Platform • Full-Stack Internship Showcase
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
            <span>+91 6383418100</span>
            <span>•</span>
            <a href="https://www.tamizhanskills.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-350 underline">www.tamizhanskills.com</a>
            <span>•</span>
            <span>Rise@tamizhanskills.com</span>
          </div>
          <p className="text-[10px] text-slate-600 block mt-2 pt-2 border-t border-slate-800">
            Powered by Node.js, Express APIs, React 19, and Gemini Flash 3.5 screening intelligence.
          </p>
        </div>
      </footer>

    </div>
  );
}
