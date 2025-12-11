# Outage Detective

Outage Detective is an AI-powered **network incident copilot** built with **Gemini 3 Pro in Google AI Studio**.  
It helps SREs and Network Engineers turn chaotic router/switch logs into a clear incident summary, root-cause hypothesis, and step-by-step action plan.

> Built for **Google DeepMind – Vibe Code with Gemini 3 Pro in AI Studio**.

---

## Problem

During a major incident, engineers have to:

- Scrape through thousands of lines of router/switch logs
- Correlate timestamps across devices and dashboards
- Guess which errors actually matter

This is slow, stressful, and easy to mess up — especially under pressure.

---

## What Outage Detective does

1. **Takes raw incident context as input**
   - Incident summary (free text)
   - Network topology / dashboard screenshot (optional image)
   - Raw network logs (BGP/OSPF/syslog, etc.)

2. **Uses Gemini 3 Pro to reason over everything**
   - Long-context analysis across all logs
   - Multimodal reasoning over **text + image**
   - Correlates error bursts, links, devices, and timestamps

3. **Generates a structured incident report**
   - Human-readable **incident summary**
   - **Probable root cause** (with justification)
   - **Ranked investigation plan** – concrete next steps

---

## How it uses Gemini 3 Pro

- **Advanced reasoning:** prompts Gemini 3 Pro to:
  - Parse logs
  - Cluster related errors
  - Build a hypothesis instead of just summarizing text
- **Multimodality:** combines:
  - Text logs + incident description + a **screenshot** of the topology/monitoring dashboard
- **Long context window:** allows pasting a realistic slice of production logs without trimming everything manually.

All of this runs inside **Google AI Studio Build** and can be exported as this standalone web app.

---

## Demo

-  **Video demo (≤ 2 min):**  
  https://youtu.be/-RwPv814PTc?si=BHsHx5c-M5YxNrQS

-  **Live AI Studio app:**  
  https://ai.studio/apps/drive/1FHJ_HbG4_wkN1AwxxboFu-MDkiP7UZE2


---

##  Tech stack

- **Frontend:** TypeScript + React + Vite (AI Studio exported app)
- **LLM:** Gemini 3 Pro (via Google AI Studio)
- **Hosting / Local dev:** Node.js, `npm run dev`

---

## Running locally

Prerequisite: **Node.js** installed.

1. Clone the repo:
   ```bash
   git clone https://github.com/ziennaa/Outage-Detective.git
   cd Outage-Detective
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a .env.local file in the project root:
```
GEMINI_API_KEY=your-gemini-api-key-here
```
Do not commit .env.local. It’s ignored by .gitignore and should stay private.
4. Run the dev server:
```
npm run dev
```
5. Open the local URL shown in the terminal

##  How to use the app
1. In Incident Summary, briefly describe the issue
e.g. "EU users seeing timeouts, packet loss between edge and core routers."

2. Optionally upload:
- A topology / Grafana / monitoring dashboard screenshot
3. Paste raw network logs:
- Router / switch logs
- BGP / OSPF session messages
- Error logs around the incident window
4. Click Run Analysis.
 
Analysis shown contains
- incident summary
- A root-cause hypothesis (e.g. flapping uplink / misconfigured BGP peer)
- A ranked runbook-style investigation plan

## Impact
Outage Detective turns:

“30 minutes of log digging” to a “30 seconds to a structured hypothesis.”

It doesn’t replace engineers, it gives them a starting point, helps them avoid blind spots, and standardizes how incidents are analyzed and documented.

---
Built by Manya Kalra (@ziennaa) as part of the
Google DeepMind – Vibe Code with Gemini 3 Pro in AI Studio hackathon.
