# TriageAI — Emergency Intelligence Bridge

![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%201.5%20Flash-green?style=flat-square) ![PromptWars](https://img.shields.io/badge/Google-PromptWars-blue?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)

## Chosen Vertical
Medical & Emergency Triage — Universal bridge between chaotic human descriptions and structured, life-saving action protocols.

## What It Does
When faced with an emergency, humans panic. They communicate in chaotic, emotionally-charged, unstructured ways—blurting out fragments of information, sending messy photos, or stammering through voice messages. This raw data is a goldmine of critical context, but emergency systems require structure and clarity to mount a proper response.

TriageAI solves this exact bottleneck. By leveraging Google's extremely fast Gemini 1.5 Flash model, it instantly parses completely unstructured inputs—whether it's panicked text, a disjointed voice recording, or a photo of an accident—and converts them into a pristine, actionable protocol in milliseconds.

This creates a powerful societal benefit: an intelligent, localized bridge between human intent and complex medical dispatch systems, ensuring that life-saving actions are taken rapidly and resources are perfectly allocated even in the most chaotic circumstances.

## Architecture
```
User Input (Text/Voice/Image) → Context Enrichment → Gemini 1.5 Flash API → JSON Protocol Extraction → Rendered Action Protocol
```

## How to Run
1. Clone the repo
2. Open `js/app.js` and set `GEMINI_API_KEY` to your key from [aistudio.google.com](https://aistudio.google.com/)
3. Open `index.html` in Chrome (Chrome required for voice input)

## Features
| Feature | Description |
| :--- | :--- |
| Voice Input | Web Speech API — speak your description |
| Image Upload | Drop medical records or accident photos |
| AI Triage | Gemini 1.5 Flash parses any messy input |
| Severity Badge | CRITICAL / HIGH / MEDIUM / LOW with visual urgency |
| Emergency Alert | Prominent 112 call prompt when needed |
| Structured Output | Immediate actions, warnings, red flags, follow-up |
| Google Resources | Relevant search suggestions |
| Responsive | Works on mobile and desktop |

## Google Services Used
- Gemini 1.5 Flash (`gemini-1.5-flash`) via Google AI Studio API
- Google Fonts (Space Mono, Syne)

## Test Scenarios
- **Chest Pain (Elderly):** A 67-year-old male experiencing intense chest pain radiating to the left arm, with high blood pressure and medical history.
- **Accident Scene:** A chaotic traffic collision with a two-wheeler, an injured victim, and surrounding chaos without immediate ambulance support.
- **Child Fever:** A worried parent describing a 3-year-old’s 103.2F fever, vomiting, and distance to the hospital to get a decisive next step.
- **Mental Health Crisis:** A friend urgently reporting a distressed, possibly suicidal associate alone at home with a history of depression.

## Project Structure
```text
triage-ai/
  index.html
  css/style.css
  js/app.js
  README.md
  .gitignore
```

## Evaluation Alignment
| Criteria | How addressed |
| :--- | :--- |
| Code Quality | Single-responsibility functions, CSS variables, clear naming |
| Security | Client-side only, no data stored, API key in config constant |
| Efficiency | Single Gemini API call per request, zero npm dependencies |
| Testing | 4 built-in test scenarios, graceful error handling |
| Accessibility | Semantic HTML, keyboard navigable, responsive layout |
| Google Services | Gemini 1.5 Flash as core intelligence, Google Fonts |

Built for Google PromptWars · Warm-Up Challenge · March 2026
