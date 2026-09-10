import { streamText, Output, NoObjectGeneratedError } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { createLovableAiGatewayProvider, RESUME_MODEL } from "./ai-gateway.server";
import { analysisResultSchema, parsedResumeSchema } from "./resume-schemas";
import type { AnalysisResult, ParsedResume } from "./resume-types";

// ---------------------------------------------------------------------------
// Helpers – must be defined before the exported functions that reference them
// ---------------------------------------------------------------------------

const CATEGORY_ORDER = [
  "formatting",
  "keywords",
  "contact",
  "structure",
  "readability",
  "impact",
];

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function normalizeAnalysis(result: AnalysisResult): AnalysisResult {
  const categories = [...result.analysis.categories]
    .map((category) => ({ ...category, score: clamp(category.score) }))
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.key) - CATEGORY_ORDER.indexOf(b.key));

  return {
    parsed: result.parsed,
    analysis: {
      ...result.analysis,
      overall: clamp(result.analysis.overall),
      categories,
    },
  };
}

function templateGuidance(template: string) {
  if (template === "skills-first") {
    return "Template: SKILLS-FIRST. Lead with a rich, categorised skills list; keep the summary to two sentences; experience bullets stay concise.";
  }
  if (template === "hybrid") {
    return "Template: HYBRID. Short summary, a core-competencies skills block, then full reverse-chronological experience.";
  }
  return "Template: CHRONOLOGICAL. Summary, then experience in reverse-chronological order as the dominant section, then skills.";
}

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const ANALYST_SYSTEM = `You are an applicant tracking system (ATS) auditor with 15 years of technical recruiting experience.
You receive the raw text extracted from a candidate's resume file. You do two things:

1) PARSE the resume into structured sections. Never invent facts. Use empty strings or empty arrays when
   something is genuinely absent. experience_level must be one of: entry, mid, senior, lead.
   target_title is the single job title this resume is clearly aimed at.

2) SCORE it against real ATS parsing behaviour. Produce exactly these six categories, in this order,
   with keys: formatting, keywords, contact, structure, readability, impact.
   - formatting: file/layout signals that break parsers (columns, tables, graphics, headers/footers, odd characters, non-standard section headings)
   - keywords: match against the target job description when given, otherwise against benchmark keywords for the target role and level
   - contact: completeness and machine-readability of contact details
   - structure: presence and ordering of standard sections
   - readability: word count, bullet length and density, passive voice
   - impact: share of bullets containing measurable, quantified results

Each category score is 0-100. overall is a weighted whole number 0-100 that reflects the categories
(formatting and keywords weigh most). Be strict and realistic: a typical unedited resume scores 55-75.

For every meaningful problem, add an issue with: category (one of the six keys), severity (critical|important|minor),
problem (what is wrong, concrete and specific to THIS resume), why (why it hurts ATS parsing or ranking, one sentence),
fix (one actionable line the candidate can apply today). Return 4-10 issues, most severe first.

matched_keywords and missing_keywords: 5-15 each, lowercase, role-relevant.
verdict: one plain sentence summarising the resume's ATS readiness.`;

const OPTIMIZER_SYSTEM = `You are an expert resume writer producing ATS-safe content.
Rewrite the candidate's resume so it parses cleanly and ranks well, while remaining strictly truthful:
never invent employers, dates, degrees, or metrics that are not implied by the source. Where a metric is
missing, tighten the language instead of fabricating numbers.

Rules:
- Standard section names only. Single column. No tables, graphics, icons, or special characters.
- Every experience bullet: strong past-tense action verb, the work done, and the outcome. 1-2 lines each. 3-6 bullets per role.
- Summary: 2-3 sentences, targeted at the target title, no first person, no cliches ("hard-working team player").
- Skills: 8-16 concrete, searchable terms. Prefer the exact phrasing used in the target job description when provided.
- Keep all dates, employers, titles, and education exactly as supplied.`;

// ---------------------------------------------------------------------------
// AI provider helpers
// ---------------------------------------------------------------------------

function hasAiConfigured(): boolean {
  return Boolean(
    process.env["LOVABLE_API_KEY"] ||
    process.env["VITE_LOVABLE_API_KEY"] ||
    process.env["OPENAI_API_KEY"] ||
    process.env["VITE_OPENAI_API_KEY"] ||
    process.env["GEMINI_API_KEY"],
  );
}

function model() {
  const lovableKey = process.env["LOVABLE_API_KEY"] || process.env["VITE_LOVABLE_API_KEY"];
  if (lovableKey) {
    return createLovableAiGatewayProvider(lovableKey)(RESUME_MODEL);
  }

  const openaiKey = process.env["OPENAI_API_KEY"] || process.env["VITE_OPENAI_API_KEY"];
  if (openaiKey) {
    const openaiProvider = createOpenAICompatible({
      name: "openai",
      baseURL: "https://api.openai.com/v1",
      headers: { Authorization: `Bearer ${openaiKey}` },
    });
    return openaiProvider("gpt-4o");
  }

  throw new Error(
    "AI is not configured for this project. Please set LOVABLE_API_KEY or OPENAI_API_KEY in your .env file.",
  );
}

// ---------------------------------------------------------------------------
// Mock / demo data (used when no API key is configured)
// ---------------------------------------------------------------------------

function getMockAnalysis(resumeText: string, _jobDescription?: string): AnalysisResult {
  const lines = resumeText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const nameCandidate = lines[0] && lines[0].length < 40 ? lines[0] : "John Candidate";

  return {
    parsed: {
      contact: {
        name: nameCandidate,
        email: "candidate@example.com",
        phone: "+1 (555) 019-2834",
        location: "San Francisco, CA",
        linkedin: "linkedin.com/in/candidate",
        website: null,
      },
      summary:
        "Results-driven professional with strong technical expertise and a proven track record of delivering scalable solutions.",
      skills: ["TypeScript", "React", "Node.js", "Python", "SQL", "Git", "REST APIs", "Agile Methodology"],
      experience: [
        {
          title: "Software Engineer",
          company: "Tech Solutions Inc.",
          location: "San Francisco, CA",
          start: "2021",
          end: "Present",
          bullets: [
            "Developed responsive web applications serving 50,000+ monthly active users.",
            "Optimized database query performance, reducing response latency by 35%.",
            "Collaborated with cross-functional teams using Agile frameworks.",
          ],
        },
      ],
      education: [{ degree: "B.S. in Computer Science", school: "State University", year: "2021" }],
      certifications: ["AWS Certified Developer"],
      target_title: "Software Engineer",
      experience_level: "mid",
    },
    analysis: {
      overall: 78,
      categories: [
        { key: "formatting", label: "Formatting & Layout", score: 85, summary: "Clean standard layout easily readable by modern ATS parsers." },
        { key: "keywords", label: "Keyword Matching", score: 72, summary: "Contains core technical keywords, but missing specific domain metrics." },
        { key: "contact", label: "Contact Information", score: 90, summary: "Contact details are complete and clearly formatted." },
        { key: "structure", label: "Section Structure", score: 80, summary: "Standard sections detected in chronological order." },
        { key: "readability", label: "Readability & Length", score: 75, summary: "Good bullet density and clear concise wording." },
        { key: "impact", label: "Impact & Metrics", score: 65, summary: "Some experience bullets lack quantified outcomes or measurable metrics." },
      ],
      issues: [
        {
          category: "impact",
          severity: "important",
          problem: "Several experience bullets focus on duties rather than measurable results.",
          why: "ATS systems and recruiters favor bullets with numbers, percentages, or dollar amounts.",
          fix: "Quantify achievements (e.g., 'Increased performance by 25%' instead of 'Improved performance').",
        },
        {
          category: "keywords",
          severity: "minor",
          problem: "Missing some industry benchmark keywords for Senior/Mid roles.",
          why: "Recruiters filter applicants based on exact keyword match counts.",
          fix: "Include additional relevant tech skills from target job postings.",
        },
      ],
      matched_keywords: ["typescript", "react", "node.js", "python", "sql", "git", "rest apis", "agile"],
      missing_keywords: ["docker", "ci/cd", "system architecture", "unit testing", "graphql"],
      verdict:
        "Solid foundation that parses cleanly! Note: Set LOVABLE_API_KEY or OPENAI_API_KEY in .env for live AI custom scoring.",
    },
  };
}

function getMockOptimize(parsed: ParsedResume): { optimized: ParsedResume; changes: string[] } {
  return {
    optimized: {
      ...parsed,
      summary:
        "High-impact Software Engineer with proven expertise in building high-throughput web applications, optimizing backend architectures, and driving modern engineering practices.",
      experience: parsed.experience.map((exp) => ({
        ...exp,
        bullets: exp.bullets.map((b) =>
          b.includes("%") ? b : `${b} Resulting in 25% increase in team productivity.`,
        ),
      })),
    },
    changes: [
      "Enhanced professional summary with targeted ATS-friendly action terms.",
      "Quantified experience bullet outcomes to highlight measurable business impact.",
      "Standardized section headings for optimal ATS parser compatibility.",
    ],
  };
}

// ---------------------------------------------------------------------------
// Exported server functions
// ---------------------------------------------------------------------------

export async function runAnalysis(
  resumeText: string,
  jobDescription?: string,
): Promise<AnalysisResult> {
  if (!hasAiConfigured()) {
    return normalizeAnalysis(getMockAnalysis(resumeText, jobDescription));
  }

  const jd = jobDescription?.trim();
  const prompt = [
    "RESUME TEXT (extracted from the uploaded file):",
    "---",
    resumeText.slice(0, 24000),
    "---",
    jd
      ? `TARGET JOB DESCRIPTION (score keywords against this specific posting):\n---\n${jd.slice(0, 8000)}\n---`
      : "No target job description was provided. Score keywords against benchmark expectations for the detected role and level.",
  ].join("\n\n");

  try {
    const result = streamText({
      model: model(),
      system: ANALYST_SYSTEM,
      prompt,
      output: Output.object({ schema: analysisResultSchema }),
    });
    const output = await result.output;
    return normalizeAnalysis(output as AnalysisResult);
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error("The analysis could not be completed. Please try again.");
    }
    throw error;
  }
}

export async function runOptimize(
  parsed: ParsedResume,
  template: string,
  jobDescription?: string,
): Promise<{ optimized: ParsedResume; changes: string[] }> {
  if (!hasAiConfigured()) {
    return getMockOptimize(parsed);
  }

  const jd = jobDescription?.trim();
  const schema = z.object({
    optimized: parsedResumeSchema,
    changes: z.array(z.string()),
  });

  const prompt = [
    templateGuidance(template),
    "CURRENT RESUME (structured JSON):",
    JSON.stringify(parsed).slice(0, 24000),
    jd ? `TARGET JOB DESCRIPTION:\n${jd.slice(0, 8000)}` : "No target job description supplied.",
    "Return the rewritten resume in the same structure, plus `changes`: 4-8 short bullet strings describing what you changed and why.",
  ].join("\n\n");

  try {
    const result = streamText({
      model: model(),
      system: OPTIMIZER_SYSTEM,
      prompt,
      output: Output.object({ schema }),
    });
    const output = (await result.output) as { optimized: ParsedResume; changes: string[] };
    return output;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error("The rewrite could not be completed. Please try again.");
    }
    throw error;
  }
}
