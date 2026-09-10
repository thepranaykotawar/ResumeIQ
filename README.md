# ResumeIQ

> **Upload your resume. Get an ATS score. Optimize it. Find matching jobs.**

ResumeIQ is an AI-powered resume optimization and job-matching platform designed to help job seekers create **ATS-friendly, professional resumes** and discover relevant job opportunities.

Instead of being another resume-template marketplace, ResumeIQ focuses on a fast, practical workflow:

**Upload → Analyze → Optimize → Match**

---

## 🚀 Features

### 📄 ATS Resume Checker

Upload an existing resume in **PDF or DOCX** format and receive an ATS compatibility score from **0–100**.

The analysis evaluates:

* Formatting compatibility
* Keyword usage
* Contact information
* Resume section structure
* Readability and length
* Bullet-point quality
* Quantified achievements
* ATS-unfriendly elements such as tables, columns, graphics, and text boxes

Each detected issue includes:

* **What is wrong**
* **Why it matters**
* **How to fix it**

---

### 🤖 AI Resume Optimizer

Use AI to improve your resume while keeping the user in control.

ResumeIQ can:

* Rewrite weak bullet points
* Improve professional language
* Add relevant keywords
* Improve achievement-focused writing
* Reorganize resume sections
* Convert content into ATS-friendly formatting
* Generate optimized resume versions

Users can compare the **original vs. optimized resume** and edit the AI-generated content before exporting.

> AI suggestions never automatically replace the original resume.

---

### 🎯 Job Matcher

ResumeIQ analyzes the user's:

* Skills
* Job titles
* Experience level
* Resume keywords

It then searches supported job-search APIs and displays relevant job openings.

Each job listing includes:

* Job title
* Company
* Location
* Remote / Hybrid / On-site status
* Match percentage
* Job description
* Original application link

Users can also select a specific job and **tailor their resume analysis against that job description**.

---

### 📊 Resume Dashboard

Users can manage their previous resumes from a centralized dashboard.

Dashboard features include:

* Previously uploaded resumes
* ATS scores
* Analysis dates
* Re-run analysis
* Download optimized resumes
* Resume history
* Delete resume records

---

## ✨ User Workflow

```text
┌─────────────┐
│ Upload CV   │
└──────┬──────┘
       ↓
┌─────────────┐
│ AI Analysis │
└──────┬──────┘
       ↓
┌─────────────┐
│ ATS Score   │
└──────┬──────┘
       ↓
┌─────────────┐
│ Optimize CV │
└──────┬──────┘
       ↓
┌─────────────┐
│ Match Jobs  │
└─────────────┘
```

---

## 🖥️ Core Pages

### Landing Page

A simple product-focused landing page with:

* ResumeIQ branding
* Clear value proposition
* Upload → Analyze → Match workflow
* Primary CTA: **Check My Resume**
* Minimal, professional design

### Authentication

Authentication is handled through Supabase.

Supported methods:

* Email & Password
* Google OAuth

Users can perform one free anonymous resume check before being asked to create an account.

### Resume Upload

Supported formats:

* `.pdf`
* `.docx`

The upload flow provides clear progress feedback:

```text
Reading document...
       ↓
Extracting sections...
       ↓
Analyzing resume...
       ↓
Scoring ATS compatibility...
       ↓
Generating report...
```

### ATS Report

The ATS report provides an overall score along with category-level scores.

Example:

| Category              |      Score |
| --------------------- | ---------: |
| Formatting            |         92 |
| Keywords              |         78 |
| Contact Information   |        100 |
| Section Structure     |         95 |
| Readability           |         88 |
| Quantified Impact     |         72 |
| **Overall ATS Score** | **87/100** |

---

## 🛠️ Tech Stack

### Frontend

* **React**
* **TypeScript**
* **Tailwind CSS**

### Backend

* **Supabase**

  * Authentication
  * PostgreSQL
  * Storage
  * Edge Functions

### AI

* **Anthropic Claude API**

Claude is used for:

* Resume parsing
* Resume analysis
* ATS scoring
* Resume rewriting
* Job-specific keyword analysis

All AI requests are routed through **Supabase Edge Functions** to keep API credentials secure.

### Job Search

ResumeIQ is designed to integrate with job-search APIs such as:

* Adzuna
* JSearch / RapidAPI
* Remotive

Job boards are **not scraped directly**.

---

## 🗄️ Database Structure

The application stores resume-related information in Supabase PostgreSQL.

Core entities include:

```text
users
  │
  └── resumes
        │
        ├── ats_scores
        │
        ├── optimized_versions
        │
        └── job_matches
```

Resume files are stored securely using **Supabase Storage**, while parsed resume data and analysis results are stored in PostgreSQL.

---

## 🔐 Security

ResumeIQ is designed with user data and API security in mind.

* Authentication handled by Supabase Auth
* Resume files stored in Supabase Storage
* AI API keys are never exposed to the frontend
* Claude API requests run through Edge Functions
* Database access can be protected using Row Level Security
* Usage can be rate-limited for free users

---

## 📤 Resume Export

Optimized resumes can be exported as:

* PDF
* DOCX

Exported resumes follow ATS-safe formatting principles:

* Single-column layout
* Standard fonts
* Clear section headings
* No unnecessary graphics
* No tables
* No text boxes
* No decorative elements that can confuse ATS parsers

Users can choose from three structural resume formats:

1. **Chronological**
2. **Skills-First**
3. **Hybrid**

---

## 📱 Responsive Design

ResumeIQ follows a **desktop-first productivity-tool experience** while remaining responsive across:

* Desktop
* Laptop
* Tablet
* Mobile

The design avoids the typical resume-builder aesthetic and instead focuses on:

* Generous whitespace
* Clear typography
* Neutral backgrounds
* Strong visual hierarchy
* Minimal UI
* One consistent accent color

The overall design direction is inspired by productivity products such as **Linear and Notion**.

---

## 💳 Free Tier

The initial version is free to use with usage limits.

Example:

```text
3 resume checks / month
```

When the limit is reached, the application can display an upgrade prompt.

> Payment processing and subscriptions are intentionally not included in v1.

---

## 🎯 Project Goals

ResumeIQ aims to solve three common problems faced by job seekers:

### 1. "Is my resume ATS-friendly?"

ResumeIQ provides an understandable ATS score and actionable recommendations.

### 2. "How can I improve my resume?"

The AI optimizer helps rewrite and restructure resume content without removing user control.

### 3. "Which jobs should I apply for?"

The Job Matcher uses resume information to surface relevant job opportunities.

---

## 🚫 Non-Goals for v1

ResumeIQ intentionally does **not** include:

* Resume creation from a blank page
* Large template marketplaces
* In-app job applications
* Automatic application submission
* Autofill bots
* Collaborative/team features
* Payment processing
* Direct job-board scraping

The focus remains on:

**Analyze → Improve → Match**

---

## 📂 Project Structure

A typical frontend structure:

```text
src/
├── components/
├── pages/
├── layouts/
├── hooks/
├── services/
├── lib/
├── types/
└── App.tsx

supabase/
└── functions/
    ├── parse-resume/
    ├── analyze-resume/
    ├── optimize-resume/
    └── job-matcher/
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have:

* Node.js
* npm
* A Supabase project
* Anthropic API credentials
* Job Search API credentials

### Clone the repository

```bash
git clone <your-repository-url>
cd <repository-name>
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env` file and configure the required Supabase and API environment variables.

> Never commit API keys or secrets to GitHub.

### Start the development server

```bash
npm run dev
```

The application will be available through the local development URL shown in your terminal.

---

## 🌐 Lovable

This project was initially built with **Lovable** and can continue to be developed through the Lovable editor.

[Open ResumeIQ in Lovable](https://lovable.dev/projects/90f57deb-08e2-4e91-a1be-1c56a6b7dd00?utm_source=chatgpt.com)

Lovable provides:

* Rapid development
* GitHub synchronization
* Editable source code
* Continuous project development

---

## 🗺️ Development Roadmap

### Phase 1 — Foundation

* [x] Landing page
* [ ] Supabase authentication
* [ ] Google OAuth
* [ ] Resume upload
* [ ] Basic database structure

### Phase 2 — ATS Analysis

* [ ] PDF parsing
* [ ] DOCX parsing
* [ ] Resume section extraction
* [ ] ATS scoring engine
* [ ] ATS report UI
* [ ] Job-description keyword comparison

### Phase 3 — AI Optimization

* [ ] Claude API integration
* [ ] Resume rewriting
* [ ] Before/after comparison
* [ ] Inline editing
* [ ] PDF export
* [ ] DOCX export
* [ ] ATS-safe templates

### Phase 4 — Job Matcher

* [ ] Job API integration
* [ ] Resume-to-job matching
* [ ] Match percentage
* [ ] Job filters
* [ ] Job detail page
* [ ] Job-specific resume tailoring

### Phase 5 — Dashboard

* [ ] Resume history
* [ ] Previous ATS reports
* [ ] Optimized resume downloads
* [ ] Re-analysis
* [ ] Delete resume
* [ ] Usage tracking

---

## 🔮 Future Improvements

Potential features for future versions:

* Job application tracking
* LinkedIn profile optimization
* Cover letter generation
* Interview preparation
* Salary insights
* Personalized career recommendations
* Multiple resume versions for different job roles
* Advanced job matching
* Premium plans
* Resume analytics

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

If you find a bug or have an idea for a feature, feel free to open an issue or submit a pull request.

---

## 📄 License

This project is currently intended as a personal/portfolio project.

Add an appropriate open-source license if the project is later released for public contribution.

---

## 👨‍💻 Author

**Pranay Kotawar**

Built as an AI-powered productivity tool for modern job seekers.

---

### ⭐ ResumeIQ

**Upload your resume. Analyze it. Improve it. Find your next opportunity.**
