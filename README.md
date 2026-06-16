# HR Competency Matrix Pro

An AI-powered web application for modern HR job-architecture design. It builds
job descriptions and competencies — manually or generated with AI — tunes the
competencies for each role against defined criteria, and maps the result onto a
6×4 logic matrix (Impact level × Function level).

## Background / Motivation
In many organizations, job grades, job descriptions, KPIs, and competency
definitions are outdated and incomplete. This tool was built to support HR
transformation: turning a reorganized job-grade hierarchy into a complete,
consistent, and visual competency framework that can feed performance
management, talent development, and other HR processes.

## What it does
- Define jobs and auto-generate their key responsibilities/KPIs with AI (or enter them manually)
- For each KPI, generate the required competencies — with a reasoned justification,
  importance level, and role type (Enabler / Enhancer / Critical)
- Tune competencies per role against defined criteria (Impact & Function dimensions)
- Plot every competency on a 6×4 matrix: Impact (Input → Process → Product → Output → Outcome → Impact)
  × Function (Individual → Team → Organizational → Social)
- Built-in Persian HR assistant chatbot
- One-click PDF & Excel export
- Bilingual: Persian content with an English, enum-based taxonomy
- Responsive UI with dark mode

## AI / Engineering highlights
- Google Gemini via the @google/genai SDK
- Structured JSON outputs with enum-constrained response schemas
- Prompt-engineered de-duplication (rejects semantically similar competencies)
- Multi-model routing: gemini-2.5-flash-lite for light tasks,
  gemini-3-pro (with a thinking budget) for reasoning-heavy mapping
- Stateful chat sessions with a system instruction

## Validation
Piloted on a large HR organization across ~50 job roles, producing complete,
mapped competency matrices from both manual input and AI generation.

## Tech Stack
React 19 · TypeScript · Vite · @google/genai · xlsx · jsPDF + html2canvas · lucide-react

## Getting Started
```bash
npm install
npm run dev
```

## Configuration
Set your Gemini API key as an environment variable (never commit it):
