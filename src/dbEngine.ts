import fs from "fs";
import path from "path";
import mysql, { Pool } from "mysql2/promise";
import { User, Job, Application } from "./types";

// Local storage fallback setup
const DB_FILE = path.join(process.cwd(), "db.json");

// Default seed structures
const SEED_USERS: User[] = [
  {
    id: "recruiter-1",
    email: "rise@tamizhanskills.com",
    name: "Hemam Tamil",
    role: "recruiter",
    companyName: "Tamizhan Skills",
  },
  {
    id: "seeker-1",
    email: "alex@example.com",
    name: "Alex Chen",
    role: "seeker",
    title: "Full Stack Engineer",
    skills: ["React", "Node.js", "Express", "TypeScript", "Tailwind CSS", "Git"],
    experience: "3 Years",
    resumeText: "Experienced Full Stack Engineer with strong expertise in the MERN Stack. Build robust REST APIs with Node.js and Express. Develop beautiful, interactive frontends using React, TypeScript, and animated layouts with Motion. Proficient in Git, database design, and workflow automation. Excited about crafting great web products.",
  },
  {
    id: "seeker-2",
    email: "maya@example.com",
    name: "Maya Patel",
    role: "seeker",
    title: "Backend Specialist",
    skills: ["Node.js", "Express", "REST APIs", "MongoDB", "PostgreSQL", "Git"],
    experience: "5 Years",
    resumeText: "Dedicated Backend Developer specializing in scalable node applications, backend database structures, database query optimizations, and RESTful web microservices. Built high-traffic payment processing gateways and recruiter messaging platforms. Avid open-source contributor and git wizard.",
  }
];

const SEED_JOBS: Job[] = [
  {
    id: "job-1",
    title: "Senior Full Stack Dev (MERN)",
    company: "Tamizhan Skills",
    location: "Chennai, India (Hybrid)",
    type: "Full-Time",
    salary: "₹12,00,000 - ₹18,00,000 per annum",
    description: "We are seeking a talented Senior Full Stack Developer to help drive our recruiting platform and learner dashboard products. You will work on building robust REST endpoints, improving our state systems, and mentoring junior developers.",
    requirements: [
      "Extensive experience with React, State managers, Tailwind CSS",
      "Robust knowledge of Node.js, Express, and REST APIs",
      "Familiarity with Git pipelines and local testing workflows",
      "Passion for building educational and high-quality software systems"
    ],
    skills: ["React", "Node.js", "Express", "TypeScript", "Tailwind CSS", "Git"],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    recruiterId: "recruiter-1",
    status: "active"
  },
  {
    id: "job-2",
    title: "Junior Backend Developer",
    company: "Tamizhan Skills",
    location: "Remote",
    type: "Internship",
    salary: "₹30,000 - ₹45,000 per month",
    description: "Looking for an energetic backend software intern or junior developer who can configure and test server routes, manage SQL schemas, and write clear API documentation. Perfect role for an enthusiastic developer beginning their career.",
    requirements: [
      "Good familiarity with Express routing & Node.js",
      "Basic knowledge of relational or non-relational database models",
      "Understanding of Git commits and branching structures",
      "Familiarity with test frameworks like Jest or Postman"
    ],
    skills: ["Node.js", "Express", "Git", "REST APIs"],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    recruiterId: "recruiter-1",
    status: "active"
  },
  {
    id: "job-3",
    title: "UI/UX & Frontend Engineer",
    company: "Vertex Systems",
    location: "San Francisco, CA (Remote)",
    type: "Remote",
    salary: "$120,000 - $140,000",
    description: "Join our client facing product experience team. You will lead the animation and polish of our data visualization charts and collaborative workspaces. Requires supreme pixel perfection and performance mastery.",
    requirements: [
      "Excellent eye for typesetting, margins, and layout hierarchy",
      "Deep control of CSS transition mechanics and interactive states",
      "Proficiency in React 18, functional hooks, and custom UI systems"
    ],
    skills: ["React", "TypeScript", "Tailwind CSS", "Motion"],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    recruiterId: "recruiter-other",
    status: "active"
  }
];

const SEED_APPLICATIONS: Application[] = [
  {
    id: "app-1",
    jobId: "job-1",
    jobTitle: "Senior Full Stack Dev (MERN)",
    company: "Tamizhan Skills",
    seekerId: "seeker-1",
    seekerName: "Alex Chen",
    seekerEmail: "alex@example.com",
    coverLetter: "I have been working with the MERN stack for over 3 years and I am extremely excited about joining Tamizhan Skills. I have built fully responsive recruitment platforms previously and excel at crafting modern React pages.",
    resumeText: "Experienced Full Stack Engineer with strong expertise in the MERN Stack. Build robust REST APIs with Node.js and Express. Develop beautiful, interactive frontends using React, TypeScript, and animated layouts with Motion. Proficient in Git, database design, and workflow automation. Excited about crafting great web products.",
    status: "Interview Scheduled",
    appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Outstanding profile with React and Node experience. Scheduled technical round for Monday.",
    aiScore: 92,
    aiAnalysis: "The candidate shows an exceptional match with the requirements, possessing strong React, Node.js, Express, and Git experience. Cover letter is clear, showing professional engagement."
  },
  {
    id: "app-2",
    jobId: "job-2",
    jobTitle: "Junior Backend Developer",
    company: "Tamizhan Skills",
    seekerId: "seeker-2",
    seekerName: "Maya Patel",
    seekerEmail: "maya@example.com",
    coverLetter: "Hello recruiter, I have strong academic and project exposure to Express APIs and backend databases. I have used Git for all my group work and would be happy to contribute to the code pipelines.",
    resumeText: "Dedicated Backend Developer specializing in scalable node applications, backend database structures, database query optimizations, and RESTful web microservices. Built high-traffic payment processing gateways and recruiter messaging platforms. Avid open-source contributor and git wizard.",
    status: "Under Review",
    appliedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    notes: "Reviewing profile metrics. Maya seems overqualified for an internship but highly capable for junior-mid roles.",
    aiScore: 84,
    aiAnalysis: "The candidate lists key required skills (Node.js, Express, Git, REST APIs). Their experience seems extensive, which might make them overqualified but highly technical for this position."
  }
];

export class DatabaseEngine {
  private pool: Pool | null = null;
  private useMysql = false;
  public readonly ready: Promise<void>;

  constructor() {
    this.ready = this.initDatabase();
  }

  private async initDatabase() {
    const host = process.env.MYSQL_HOST;
    const user = process.env.MYSQL_USER;
    const password = process.env.MYSQL_PASSWORD;
    const database = process.env.MYSQL_DATABASE;
    const port = parseInt(process.env.MYSQL_PORT || "3306", 10);

    if (host && user && database) {
      console.log(`[Database] MySQL Connection Configuration detected: ${user}@${host}:${port}/${database}`);
      try {
        const bootstrapConnection = await mysql.createConnection({
          host,
          port,
          user,
          password,
          ssl: process.env.MYSQL_SSL === "true" ? {} : undefined
        });

        await bootstrapConnection.query(
          `CREATE DATABASE IF NOT EXISTS \`${database.replace(/`/g, "``")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        await bootstrapConnection.end();

        const poolConnection = mysql.createPool({
          host,
          port,
          user,
          password,
          database,
          waitForConnections: true,
          connectionLimit: 5,
          queueLimit: 0,
          ssl: process.env.MYSQL_SSL === "true" ? {} : undefined
        });

        // Test connection
        const connection = await poolConnection.getConnection();
        console.log("[Database] Successfully connected to remote MySQL Database Server!");
        connection.release();

        this.pool = poolConnection;
        this.useMysql = true;

        // Provision table schema
        await this.provisionSchemas();
      } catch (err: any) {
        console.warn(`[Database] MySQL connection attempt failed: ${err.message || err}. Falling back to local db.json storage.`);
        this.useMysql = false;
        this.pool = null;
        this.ensureLocalFileExists();
      }
    } else {
      console.log("[Database] No comprehensive MYSQL variables detected. Defaulting to local db.json storage.");
      this.useMysql = false;
      this.ensureLocalFileExists();
    }
  }

  private ensureLocalFileExists() {
    if (!fs.existsSync(DB_FILE)) {
      console.log("[Database] Local db.json missing, generating seed data file...");
      const initialDb = { users: SEED_USERS, jobs: SEED_JOBS, applications: SEED_APPLICATIONS };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
    }
  }

  private loadLocalDB(): { users: User[]; jobs: Job[]; applications: Application[] } {
    this.ensureLocalFileExists();
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    } catch {
      return { users: SEED_USERS, jobs: SEED_JOBS, applications: SEED_APPLICATIONS };
    }
  }

  private saveLocalDB(data: { users: User[]; jobs: Job[]; applications: Application[] }) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  private async provisionSchemas() {
    if (!this.pool) return;
    try {
      console.log("[Database] Creating MySQL tables if they do not exist...");
      
      // Users Table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          email VARCHAR(191) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          companyName VARCHAR(255) NULL,
          title VARCHAR(255) NULL,
          experience VARCHAR(100) NULL,
          resumeText TEXT NULL,
          skills TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Jobs Table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS jobs (
          id VARCHAR(100) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          company VARCHAR(255) NOT NULL,
          location VARCHAR(255) NOT NULL,
          type VARCHAR(100) NOT NULL,
          salary VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          requirements TEXT NOT NULL,
          skills TEXT NOT NULL,
          createdAt VARCHAR(100) NOT NULL,
          recruiterId VARCHAR(100) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'active'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Applications Table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS applications (
          id VARCHAR(100) PRIMARY KEY,
          jobId VARCHAR(100) NOT NULL,
          jobTitle VARCHAR(255) NOT NULL,
          company VARCHAR(255) NOT NULL,
          seekerId VARCHAR(100) NOT NULL,
          seekerName VARCHAR(255) NOT NULL,
          seekerEmail VARCHAR(191) NOT NULL,
          coverLetter TEXT NULL,
          resumeText TEXT NOT NULL,
          status VARCHAR(100) NOT NULL DEFAULT 'Applied',
          appliedAt VARCHAR(100) NOT NULL,
          notes TEXT NULL,
          aiScore INT NULL,
          aiAnalysis TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Seed tables if empty
      const [userRows]: [any[], any] = await this.pool.query("SELECT COUNT(*) as cnt FROM users");
      if (userRows[0].cnt === 0) {
        console.log("[Database] Empty MySQL instance, seeding initial user and job records...");
        await this.seedMysqlData();
      }
    } catch (err) {
      console.error("[Database] Error provisioning schemas:", err);
    }
  }

  private async seedMysqlData() {
    if (!this.pool) return;
    try {
      // Seed Users
      for (const user of SEED_USERS) {
        await this.pool.query(
          "INSERT IGNORE INTO users (id, email, name, role, companyName, title, experience, resumeText, skills) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            user.id,
            user.email,
            user.name,
            user.role,
            user.companyName || null,
            user.title || null,
            user.experience || null,
            user.resumeText || null,
            JSON.stringify(user.skills || [])
          ]
        );
      }

      // Seed Jobs
      for (const job of SEED_JOBS) {
        await this.pool.query(
          "INSERT IGNORE INTO jobs (id, title, company, location, type, salary, description, requirements, skills, createdAt, recruiterId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            job.id,
            job.title,
            job.company,
            job.location,
            job.type,
            job.salary,
            job.description,
            JSON.stringify(job.requirements || []),
            JSON.stringify(job.skills || []),
            job.createdAt,
            job.recruiterId,
            job.status
          ]
        );
      }

      // Seed Applications
      for (const app of SEED_APPLICATIONS) {
        await this.pool.query(
          "INSERT IGNORE INTO applications (id, jobId, jobTitle, company, seekerId, seekerName, seekerEmail, coverLetter, resumeText, status, appliedAt, notes, aiScore, aiAnalysis) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            app.id,
            app.jobId,
            app.jobTitle,
            app.company,
            app.seekerId,
            app.seekerName,
            app.seekerEmail,
            app.coverLetter,
            app.resumeText,
            app.status,
            app.appliedAt,
            app.notes || null,
            app.aiScore !== undefined ? app.aiScore : null,
            app.aiAnalysis || null
          ]
        );
      }
      console.log("[Database] Seeding processes for MySQL completed.");
    } catch (err) {
      console.error("[Database] Error seeding data:", err);
    }
  }

  public get isMySQL() {
    return this.useMysql;
  }

  // API METHODS

  public async getUsers(): Promise<User[]> {
    if (this.useMysql && this.pool) {
      const [rows] = await this.pool.query("SELECT * FROM users");
      const usersRows = rows as any[];
      return usersRows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as 'seeker' | 'recruiter',
        companyName: row.companyName || undefined,
        title: row.title || undefined,
        experience: row.experience || undefined,
        resumeText: row.resumeText || undefined,
        skills: row.skills ? JSON.parse(row.skills) : []
      }));
    }
    return this.loadLocalDB().users;
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    if (this.useMysql && this.pool) {
      const [rows] = await this.pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", [email.trim()]);
      const res = rows as any[];
      if (res.length === 0) return null;
      const row = res[0];
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as 'seeker' | 'recruiter',
        companyName: row.companyName || undefined,
        title: row.title || undefined,
        experience: row.experience || undefined,
        resumeText: row.resumeText || undefined,
        skills: row.skills ? JSON.parse(row.skills) : []
      };
    }
    const user = this.loadLocalDB().users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    return user || null;
  }

  public async createUser(user: User): Promise<User> {
    if (this.useMysql && this.pool) {
      await this.pool.query(
        "INSERT INTO users (id, email, name, role, companyName, title, experience, resumeText, skills) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          user.id,
          user.email,
          user.name,
          user.role,
          user.companyName || null,
          user.title || null,
          user.experience || null,
          user.resumeText || null,
          JSON.stringify(user.skills || [])
        ]
      );
      return user;
    }
    const db = this.loadLocalDB();
    db.users.push(user);
    this.saveLocalDB(db);
    return user;
  }

  public async getJobs(): Promise<Job[]> {
    if (this.useMysql && this.pool) {
      const [rows] = await this.pool.query("SELECT * FROM jobs ORDER BY createdAt DESC");
      const jobsRows = rows as any[];
      return jobsRows.map(row => ({
        id: row.id,
        title: row.title,
        company: row.company,
        location: row.location,
        type: row.type as any,
        salary: row.salary,
        description: row.description,
        requirements: row.requirements ? JSON.parse(row.requirements) : [],
        skills: row.skills ? JSON.parse(row.skills) : [],
        createdAt: row.createdAt,
        recruiterId: row.recruiterId,
        status: row.status as 'active' | 'closed'
      }));
    }
    return this.loadLocalDB().jobs;
  }

  public async getJob(id: string): Promise<Job | null> {
    if (this.useMysql && this.pool) {
      const [rows] = await this.pool.query("SELECT * FROM jobs WHERE id = ?", [id]);
      const res = rows as any[];
      if (res.length === 0) return null;
      const row = res[0];
      return {
        id: row.id,
        title: row.title,
        company: row.company,
        location: row.location,
        type: row.type as any,
        salary: row.salary,
        description: row.description,
        requirements: row.requirements ? JSON.parse(row.requirements) : [],
        skills: row.skills ? JSON.parse(row.skills) : [],
        createdAt: row.createdAt,
        recruiterId: row.recruiterId,
        status: row.status as 'active' | 'closed'
      };
    }
    const job = this.loadLocalDB().jobs.find(j => j.id === id);
    return job || null;
  }

  public async createJob(job: Job): Promise<Job> {
    if (this.useMysql && this.pool) {
      await this.pool.query(
        "INSERT INTO jobs (id, title, company, location, type, salary, description, requirements, skills, createdAt, recruiterId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          job.id,
          job.title,
          job.company,
          job.location,
          job.type,
          job.salary,
          job.description,
          JSON.stringify(job.requirements || []),
          JSON.stringify(job.skills || []),
          job.createdAt,
          job.recruiterId,
          job.status
        ]
      );
      return job;
    }
    const db = this.loadLocalDB();
    db.jobs.unshift(job);
    this.saveLocalDB(db);
    return job;
  }

  public async updateJob(id: string, updates: Partial<Job>): Promise<Job | null> {
    if (this.useMysql && this.pool) {
      const current = await this.getJob(id);
      if (!current) return null;
      const next = { ...current, ...updates };
      await this.pool.query(
        "UPDATE jobs SET title=?, company=?, location=?, type=?, salary=?, description=?, requirements=?, skills=?, status=? WHERE id=?",
        [
          next.title,
          next.company,
          next.location,
          next.type,
          next.salary,
          next.description,
          JSON.stringify(next.requirements || []),
          JSON.stringify(next.skills || []),
          next.status,
          id
        ]
      );
      return next;
    }
    const db = this.loadLocalDB();
    const idx = db.jobs.findIndex(j => j.id === id);
    if (idx === -1) return null;
    db.jobs[idx] = { ...db.jobs[idx], ...updates, id };
    this.saveLocalDB(db);
    return db.jobs[idx];
  }

  public async deleteJob(id: string): Promise<boolean> {
    if (this.useMysql && this.pool) {
      const [res] = await this.pool.query("DELETE FROM jobs WHERE id = ?", [id]);
      const header = res as any;
      return header.affectedRows > 0;
    }
    const db = this.loadLocalDB();
    const initialLen = db.jobs.length;
    db.jobs = db.jobs.filter(j => j.id !== id);
    this.saveLocalDB(db);
    return db.jobs.length < initialLen;
  }

  public async getApplications(): Promise<Application[]> {
    if (this.useMysql && this.pool) {
      const [rows] = await this.pool.query("SELECT * FROM applications ORDER BY appliedAt DESC");
      const appRows = rows as any[];
      return appRows.map(row => ({
        id: row.id,
        jobId: row.jobId,
        jobTitle: row.jobTitle,
        company: row.company,
        seekerId: row.seekerId,
        seekerName: row.seekerName,
        seekerEmail: row.seekerEmail,
        coverLetter: row.coverLetter,
        resumeText: row.resumeText,
        status: row.status as any,
        appliedAt: row.appliedAt,
        notes: row.notes || undefined,
        aiScore: row.aiScore !== null ? row.aiScore : undefined,
        aiAnalysis: row.aiAnalysis || undefined
      }));
    }
    return this.loadLocalDB().applications;
  }

  public async createApplication(app: Application): Promise<Application> {
    if (this.useMysql && this.pool) {
      await this.pool.query(
        "INSERT INTO applications (id, jobId, jobTitle, company, seekerId, seekerName, seekerEmail, coverLetter, resumeText, status, appliedAt, notes, aiScore, aiAnalysis) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          app.id,
          app.jobId,
          app.jobTitle,
          app.company,
          app.seekerId,
          app.seekerName,
          app.seekerEmail,
          app.coverLetter,
          app.resumeText,
          app.status,
          app.appliedAt,
          app.notes || null,
          app.aiScore !== undefined ? app.aiScore : null,
          app.aiAnalysis || null
        ]
      );
      return app;
    }
    const db = this.loadLocalDB();
    db.applications.unshift(app);
    this.saveLocalDB(db);
    return app;
  }

  public async updateApplicationStatus(id: string, status: string, notes?: string): Promise<Application | null> {
    if (this.useMysql && this.pool) {
      if (notes !== undefined) {
        await this.pool.query("UPDATE applications SET status = ?, notes = ? WHERE id = ?", [status, notes, id]);
      } else {
        await this.pool.query("UPDATE applications SET status = ? WHERE id = ?", [status, id]);
      }
      
      const [rows] = await this.pool.query("SELECT * FROM applications WHERE id = ?", [id]);
      const res = rows as any[];
      if (res.length === 0) return null;
      const row = res[0];
      return {
        id: row.id,
        jobId: row.jobId,
        jobTitle: row.jobTitle,
        company: row.company,
        seekerId: row.seekerId,
        seekerName: row.seekerName,
        seekerEmail: row.seekerEmail,
        coverLetter: row.coverLetter,
        resumeText: row.resumeText,
        status: row.status as any,
        appliedAt: row.appliedAt,
        notes: row.notes || undefined,
        aiScore: row.aiScore !== null ? row.aiScore : undefined,
        aiAnalysis: row.aiAnalysis || undefined
      };
    }

    const db = this.loadLocalDB();
    const idx = db.applications.findIndex(a => a.id === id);
    if (idx === -1) return null;
    db.applications[idx].status = status as any;
    if (notes !== undefined) {
      db.applications[idx].notes = notes;
    }
    this.saveLocalDB(db);
    return db.applications[idx];
  }

  public async updateApplicationAi(id: string, score: number, analysis: string): Promise<Application | null> {
    if (this.useMysql && this.pool) {
      await this.pool.query("UPDATE applications SET aiScore = ?, aiAnalysis = ? WHERE id = ?", [score, analysis, id]);
      const [rows] = await this.pool.query("SELECT * FROM applications WHERE id = ?", [id]);
      const res = rows as any[];
      if (res.length === 0) return null;
      const row = res[0];
      return {
        id: row.id,
        jobId: row.jobId,
        jobTitle: row.jobTitle,
        company: row.company,
        seekerId: row.seekerId,
        seekerName: row.seekerName,
        seekerEmail: row.seekerEmail,
        coverLetter: row.coverLetter,
        resumeText: row.resumeText,
        status: row.status as any,
        appliedAt: row.appliedAt,
        notes: row.notes || undefined,
        aiScore: row.aiScore !== null ? row.aiScore : undefined,
        aiAnalysis: row.aiAnalysis || undefined
      };
    }

    const db = this.loadLocalDB();
    const idx = db.applications.findIndex(a => a.id === id);
    if (idx === -1) return null;
    db.applications[idx].aiScore = score;
    db.applications[idx].aiAnalysis = analysis;
    this.saveLocalDB(db);
    return db.applications[idx];
  }

  public async resetDatabase(): Promise<void> {
    if (this.useMysql && this.pool) {
      console.log("[Database] Resetting MySQL database records to original seeds...");
      await this.pool.query("TRUNCATE TABLE users");
      await this.pool.query("TRUNCATE TABLE jobs");
      await this.pool.query("TRUNCATE TABLE applications");
      await this.seedMysqlData();
      return;
    }

    console.log("[Database] Resetting local JSON database records...");
    const resetDb = {
      users: JSON.parse(JSON.stringify(SEED_USERS)),
      jobs: JSON.parse(JSON.stringify(SEED_JOBS)),
      applications: JSON.parse(JSON.stringify(SEED_APPLICATIONS))
    };
    this.saveLocalDB(resetDb);
  }
}
