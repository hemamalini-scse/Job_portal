import { UserRound, LogOut, Briefcase, RefreshCw } from "lucide-react";
import { User } from "../types";

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onResetDb: () => void;
  isResetting: boolean;
}

export default function Header({ user, onLogout, onResetDb, isResetting }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight text-slate-950">
              RiseTalent <span className="text-indigo-600 font-medium text-xs rounded-full px-2 py-0.5 bg-indigo-50 border border-indigo-100">Full-Stack</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Recruitment & Interactive AI Screener</p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-4">
          {/* Diagnostic Reset Button */}
          <button
            onClick={onResetDb}
            disabled={isResetting}
            title="Reset platform database back to template seed"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-250 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
            id="reset-db-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isResetting ? "animate-spin" : ""}`} />
            {isResetting ? "Resetting..." : "Reset Seeds"}
          </button>

          {user && (
            <div className="flex items-center gap-4 border-l border-slate-200 pl-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                  <UserRound className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-xs font-medium text-indigo-600 capitalize">
                    {user.role === "recruiter" ? `Recruiter • ${user.companyName || "Company"}` : `Job Seeker`}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign out of current account session"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                id="log-out-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
