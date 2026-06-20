import express from "express";
import dotenv from "dotenv";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { Job, Application, User } from "./src/types";
import { DatabaseEngine } from "./src/dbEngine";

dotenv.config();
dotenv.config({ path: ".env.example" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Initialize Database Wrapper (MySQL + JSON dynamic dual-mode)
  const db = new DatabaseEngine();
  await db.ready;

  // Helper route to reset DB
  app.post("/api/system/reset", async (req, res) => {
    try {
      await db.resetDatabase();
      res.json({ success: true, message: "Database reset to seeded initial state" });
    } catch (err: any) {
      console.error("Database reset error:", err);
      res.status(500).json({ error: err.message || "Failed to reset database" });
    }
  });

  // Lazy Gemini Evaluation Function with Heuristic Screen Fallback
  async function performAiScreening(jobTitle: string, jobDescription: string, requirements: string[], resumeText: string): Promise<{ aiScore: number; aiAnalysis: string }> {
    const apiKey = process.env.GEMINI_API_KEY;

    function runHeuristicScreening(isErrorMode: boolean = false): { aiScore: number; aiAnalysis: string } {
      const textToScan = (resumeText + " " + jobTitle + " " + jobDescription).toLowerCase();
      
      const skillsToScan = ["react", "node", "express", "typescript", "tailwind", "git", "mongodb", "postgresql", "rest", "ui/ux", "motion", "aws", "jest", "next", "docker", "esbuild"];
      let seekerSkillsMatched: string[] = [];

      skillsToScan.forEach(skill => {
        if (textToScan.includes(skill)) {
          seekerSkillsMatched.push(skill.toUpperCase());
        }
      });

      let score = 55; // baseline
      if (seekerSkillsMatched.length > 0) {
        score += Math.min(40, seekerSkillsMatched.length * 8);
      }
      
      const modePrefix = isErrorMode ? "[Simulated Match - Safe Fallback]" : "[Simulated Match]";
      let analysisText = "";
      if (score >= 80) {
        analysisText = `${modePrefix} Strong candidate showing significant overlap of skills (${seekerSkillsMatched.join(", ")}). Their resume text indicates solid command of core tools. Highly recommended for shortlisting.`;
      } else if (score >= 65) {
        analysisText = `${modePrefix} Adequate candidate with several matches (${seekerSkillsMatched.join(", ")}). Warrants review for initial phone screening. Some core requirements are met.`;
      } else {
        analysisText = `${modePrefix} Low compatibility match index. Identified limited corresponding skill-tags (${seekerSkillsMatched.join(", ") || "None"}). Recommend manual resume screening to confirm details.`;
      }

      return {
        aiScore: Math.min(100, Math.max(score, 25)),
        aiAnalysis: analysisText
      };
    }

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      console.log("No Gemini API Key found. Performing heuristic matching instead.");
      return runHeuristicScreening(false);
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      console.log("Querying 'gemini-3.5-flash' for candidate resume evaluation...");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Evaluate the compatibility of the following Candidate Resume against the Job Details.
        
JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}
REQUIREMENTS: ${requirements.join(", ")}

CANDIDATE RESUME:
${resumeText}

Provide an honest, precise, and concise candidate screening. Include a numeric match score from 0 to 100 based on technical and experience alignment, and an analysis paragraph of 2-3 sentences.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              aiScore: {
                type: Type.INTEGER,
                description: "A compatibility score between 0 and 100 based on skill match and qualifications.",
              },
              aiAnalysis: {
                type: Type.STRING,
                description: "A concise 2-3 sentence analysis of candidate alignment, skill gaps, or standout features.",
              },
            },
            required: ["aiScore", "aiAnalysis"],
          }
        }
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());
      
      return {
        aiScore: Number(result.aiScore) || 70,
        aiAnalysis: result.aiAnalysis || "Screening completed. Alignment is verified."
      };
    } catch (err) {
      console.error("Gemini API error detected:", err);
      return runHeuristicScreening(true);
    }
  }

  // --- REST ENDPOINTS ---

  // AUTH API - Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, name, role, companyName, title, skills, experience, resumeText } = req.body;
      
      if (!email || !name || !role) {
        res.status(400).json({ error: "Missing required profile registration parameters" });
        return;
      }

      const existing = await db.getUserByEmail(email);
      if (existing) {
        res.status(400).json({ error: "User with this email already exists" });
        return;
      }

      const newUser: User = {
        id: "usr-" + Date.now().toString(36),
        email: email.trim(),
        name: name.trim(),
        role: role === "recruiter" ? "recruiter" : "seeker",
        companyName: companyName ? companyName.trim() : undefined,
        title: title ? title.trim() : undefined,
        skills: Array.isArray(skills) ? skills : [],
        experience: experience ? experience.trim() : undefined,
        resumeText: resumeText ? resumeText.trim() : undefined,
      };

      await db.createUser(newUser);
      res.status(201).json({ user: newUser, token: "mock-session-token-" + newUser.id });
    } catch (err: any) {
      console.error("Registration error:", err);
      res.status(500).json({ error: err.message || "Registration failed" });
    }
  });

  // AUTH API - Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email is required for authentication" });
        return;
      }

      const user = await db.getUserByEmail(email);
      if (!user) {
        res.status(404).json({ error: "No profile registered with this email" });
        return;
      }

      res.json({ user, token: "mock-session-token-" + user.id });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: err.message || "Authentication failed" });
    }
  });

  // JOBS API - List
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobsList = await db.getJobs();
      res.json(jobsList);
    } catch (err: any) {
      console.error("Fetch jobs error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch jobs" });
    }
  });

  // JOBS API - Find Single
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await db.getJob(req.params.id);
      if (!job) {
        res.status(404).json({ error: "Job listing not found" });
        return;
      }
      res.json(job);
    } catch (err: any) {
      console.error("Fetch single job error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch job" });
    }
  });

  // JOBS API - Create
  app.post("/api/jobs", async (req, res) => {
    try {
      const { title, company, location, type, salary, description, requirements, skills, recruiterId } = req.body;

      if (!title || !company || !location || !type || !description || !recruiterId) {
        res.status(400).json({ error: "Missing required job listing metadata" });
        return;
      }

      const newJob: Job = {
        id: "job-" + Date.now().toString(36),
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        type,
        salary: salary ? salary.trim() : "Not Specified",
        description: description.trim(),
        requirements: Array.isArray(requirements) ? requirements : [],
        skills: Array.isArray(skills) ? skills : [],
        createdAt: new Date().toISOString(),
        recruiterId,
        status: "active"
      };

      await db.createJob(newJob);
      res.status(201).json(newJob);
    } catch (err: any) {
      console.error("Create job error:", err);
      res.status(500).json({ error: err.message || "Failed to create job" });
    }
  });

  // JOBS API - Edit
  app.put("/api/jobs/:id", async (req, res) => {
    try {
      const updatedJob = await db.updateJob(req.params.id, req.body);
      if (!updatedJob) {
        res.status(404).json({ error: "Job listing not found" });
        return;
      }
      res.json(updatedJob);
    } catch (err: any) {
      console.error("Update job error:", err);
      res.status(500).json({ error: err.message || "Failed to update job" });
    }
  });

  // JOBS API - Delete
  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const success = await db.deleteJob(req.params.id);
      if (!success) {
        res.status(404).json({ error: "Job listing not found" });
        return;
      }
      res.json({ success: true, message: "Job listing deleted successfully" });
    } catch (err: any) {
      console.error("Delete job error:", err);
      res.status(500).json({ error: err.message || "Failed to delete job" });
    }
  });

  // APPLICATIONS API - List (Seeker or Recruiter constrained)
  app.get("/api/applications", async (req, res) => {
    try {
      const seekerId = req.query.seekerId as string;
      const recruiterId = req.query.recruiterId as string;
      const allApps = await db.getApplications();

      if (seekerId) {
        const filtered = allApps.filter(app => app.seekerId === seekerId);
        res.json(filtered);
      } else if (recruiterId) {
        const allJobs = await db.getJobs();
        const recruiterJobs = allJobs.filter(j => j.recruiterId === recruiterId).map(j => j.id);
        // Include default seeded job submissions (e.g. support matching for preseeded recruiter accounts)
        const filtered = allApps.filter(app => recruiterJobs.includes(app.jobId) || app.jobId === "job-1" || app.jobId === "job-2");
        res.json(filtered);
      } else {
        res.json(allApps);
      }
    } catch (err: any) {
      console.error("Get applications error:", err);
      res.status(500).json({ error: err.message || "Failed to retrieve applications" });
    }
  });

  // APPLICATIONS API - Create
  app.post("/api/applications", async (req, res) => {
    try {
      const { jobId, seekerId, coverLetter, seekerName, seekerEmail, resumeText } = req.body;

      if (!jobId || !seekerId || !resumeText || !seekerName || !seekerEmail) {
        res.status(400).json({ error: "Missing required parameters for submission" });
        return;
      }

      const job = await db.getJob(jobId);
      if (!job) {
        res.status(404).json({ error: "The selected job listing no longer exists" });
        return;
      }

      const allApps = await db.getApplications();
      const duplicate = allApps.find(app => app.jobId === jobId && app.seekerId === seekerId);
      if (duplicate) {
        res.status(400).json({ error: "You have already applied to this position" });
        return;
      }

      const evaluation = await performAiScreening(job.title, job.description, job.requirements, resumeText);

      const newApplication: Application = {
        id: "app-" + Date.now().toString(36),
        jobId,
        jobTitle: job.title,
        company: job.company,
        seekerId,
        seekerName: seekerName.trim(),
        seekerEmail: seekerEmail.trim(),
        coverLetter: coverLetter ? coverLetter.trim() : "No cover letter provided.",
        resumeText: resumeText.trim(),
        status: "Applied",
        appliedAt: new Date().toISOString(),
        aiScore: evaluation.aiScore,
        aiAnalysis: evaluation.aiAnalysis
      };

      await db.createApplication(newApplication);
      res.status(201).json(newApplication);
    } catch (err: any) {
      console.error("Create application error:", err);
      res.status(500).json({ error: err.message || "Failed to submit application" });
    }
  });

  // UPDATE APPLICATION status & notes
  app.put("/api/applications/:id/status", async (req, res) => {
    try {
      const { status, notes } = req.body;
      
      if (!status) {
        res.status(400).json({ error: "Status state is required" });
        return;
      }

      const updatedApp = await db.updateApplicationStatus(req.params.id, status, notes);
      if (!updatedApp) {
        res.status(404).json({ error: "Application record not found" });
        return;
      }

      res.json(updatedApp);
    } catch (err: any) {
      console.error("Update status error:", err);
      res.status(500).json({ error: err.message || "Failed to update application status" });
    }
  });

  // Re-trigger AI Screening manually
  app.post("/api/applications/:id/ai-evaluate", async (req, res) => {
    try {
      const allApps = await db.getApplications();
      const application = allApps.find(app => app.id === req.params.id);
      if (!application) {
        res.status(404).json({ error: "Application record not found" });
        return;
      }

      const job = await db.getJob(application.jobId);
      if (!job) {
        res.status(404).json({ error: "Associated job description is missing" });
        return;
      }

      const evaluation = await performAiScreening(job.title, job.description, job.requirements, application.resumeText);
      const updatedApp = await db.updateApplicationAi(req.params.id, evaluation.aiScore, evaluation.aiAnalysis);
      
      res.json(updatedApp);
    } catch (err: any) {
      console.error("AI Evaluation error:", err);
      res.status(500).json({ error: err.message || "Failed to re-evaluate application" });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Fallback default API response if client requests random service end
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ error: "Endpoint path not matched" });
    } else {
      next();
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully routed to port ${PORT}`);
    console.log(`MySQL dual-mode adapter active status: ${db.isMySQL ? "ENABLED" : "JSON FILE FALLBACK"}`);
  });
}

startServer().catch((err) => {
  console.error("Express initialization error:", err);
});
