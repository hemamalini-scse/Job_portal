export interface User {
  id: string;
  email: string;
  name: string;
  role: 'seeker' | 'recruiter';
  companyName?: string; // Only for recruiters
  title?: string;       // Only for seekers, e.g., "Senior React Developer"
  skills?: string[];    // Only for seekers, list of skill tags
  experience?: string;  // Only for seekers
  resumeText?: string;  // Resume contents
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-Time' | 'Part-Time' | 'Contract' | 'Remote' | 'Internship';
  salary: string;
  description: string;
  requirements: string[];
  skills: string[];
  createdAt: string;
  recruiterId: string;
  status: 'active' | 'closed';
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  seekerId: string;
  seekerName: string;
  seekerEmail: string;
  coverLetter: string;
  resumeText: string;
  status: 'Applied' | 'Under Review' | 'Interview Scheduled' | 'Offer Extended' | 'Rejected';
  appliedAt: string;
  notes?: string;
  aiScore?: number;    // Compatibility match score: 0 to 100
  aiAnalysis?: string; // Brief AI review analysis
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
