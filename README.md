# 🚀 QuickHire - AI-Powered Hiring Platform

**QuickHire** is a next-generation recruitment ecosystem designed to bridge the gap between talent and opportunity. Built with **Next.js 16** and powered by **Llama 3 (Groq)**, it streamlines the entire hiring lifecycle using advanced AI agents for both Recruiters and Job Seekers.

![QuickHire Banner](https://via.placeholder.com/1200x400?text=QuickHire+AI+Platform+Banner)

## ✨ Key Features

### 🤖 For Job Seekers
* **AI Resume Enhancer:** Transforms rough bio notes into professional, results-oriented experience summaries using AI.
* **Smart Job Match:** Intelligent algorithm that scans available roles and provides a "Match Score" based on the user's profile.
* **AI Cover Letter Generator:** Instantly drafts personalized cover letters tailored to specific job descriptions with a single click.
* **Application Tracking:** Visual timeline to track applications from "Applied" to "Interviewing" to "Hired".
* **AI Career Coach Chat:** A persistent chatbot available to answer career questions and provide advice.

### 💼 For Recruiters
* **AI JD Generator:** Generates comprehensive, Markdown-formatted Job Descriptions from a simple title and location.
* **Applicant Scorer:** AI reads candidate profiles and assigns a **0-100% Fit Score** against the specific job requirements, saving hours of screening time.
* **Smart Pipeline:** Drag-and-drop style dashboard to manage candidates (Inbox -> Shortlisted -> Interview -> Hired).
* **Cover Letter Viewer:** Instant popup access to candidate cover letters directly within the pipeline.

## 🛠️ Tech Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
* **Language:** TypeScript
* **Styling:** Tailwind CSS, Lucide React (Icons)
* **Backend & Auth:** Firebase (Authentication, Firestore Database)
* **CMS:** [SleekCMS](https://sleekcms.com/) (For managing static content and verified job listings)
* **AI Engine:** [Groq SDK](https://groq.com/) running Llama-3-70b
* **Deployment:** Vercel

📂 Project Structure
/app
  /api/ai           # Serverless route for handling AI requests (Groq)
  /applicants       # Recruiter pipeline dashboard
  /companies        # Company listings (CMS + Firebase)
  /components       # Reusable UI components
     /ai            # AI Widgets (Chatbot, Scorer, JD Writer)
  /dashboard        # Role-based dashboards
  /jobs             # Job board and search
  /profile          # User profile management
  /lib              # Firebase and Auth configurations



## 🚀 Getting Started

Follow these instructions to set up the project locally.

### 1. Clone the Repository
```bash
git clone [https://github.com/Bhavesh04A/QuikHire.git](https://github.com/Bhavesh04A/QuikHire.git)
cd QuikHire

Install Dependencies

npm install
# or
yarn install

Environment Configuration
Create a .env.local file in the root directory. You will need keys for Groq, and SleekCMS.
# --- AI Configuration (Groq) ---
GROQ_API_KEY=gsk_your_groq_api_key_here

# --- CMS Configuration (SleekCMS) ---
NEXT_PUBLIC_SLEEKCMS_SITE_TOKEN=your_sleekcms_token

Run Development Server
npm run dev

Open http://localhost:3000 with your browser to see the application.


