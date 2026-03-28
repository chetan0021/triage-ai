const GEMINI_API_KEY = 'REPLACE_ME_GEMINI_API_KEY'; // Injected by Docker/Cloud Run at runtime
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// SECTION 1 — STATE VARIABLES:
let currentImageBase64 = null;
let currentImageMime = null;
let isRecording = false;
let recognition = null;

// SECTION 2 — TAB SWITCHING:
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => {
            c.classList.remove('active');
            c.classList.add('hidden');
        });
        btn.classList.add('active');
        let tabValue = btn.getAttribute('data-tab');
        if (!tabValue) {
            const defaultTabs = ['text', 'image', 'context'];
            tabValue = defaultTabs[index] || 'text';
        }
        const targetContent = document.getElementById(`tab-${tabValue}`);
        if (targetContent) {
            targetContent.classList.add('active');
            targetContent.classList.remove('hidden');
        }
    });
});

// SECTION 3 — FILE UPLOAD:
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');

if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]);
    });
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const fullDataUrl = event.target.result;
        currentImageMime = file.type;
        currentImageBase64 = fullDataUrl.split(',')[1];
        if (file.type.startsWith('image/')) {
            imagePreview.innerHTML = `<img src="${fullDataUrl}" style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid var(--border);" alt="Preview"/>`;
            imagePreview.classList.remove('hidden');
            if (dropZone) dropZone.classList.add('hidden');
        } else {
            imagePreview.innerHTML = `<div style="padding:16px;border:1px solid var(--border);border-radius:8px;text-align:center;color:var(--text);">${file.name}</div>`;
            imagePreview.classList.remove('hidden');
            if (dropZone) dropZone.classList.add('hidden');
        }
    };
    reader.readAsDataURL(file);
}

// SECTION 4 — VOICE INPUT:
const voiceBtn = document.getElementById('voiceBtn');
const voiceBtnLabel = document.getElementById('voiceBtnLabel');
const rawInput = document.getElementById('rawInput');

function toggleVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech Recognition not supported. Use Chrome."); return; }
    if (isRecording && recognition) { recognition.stop(); return; }
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.onstart = () => {
        isRecording = true;
        if (voiceBtn) voiceBtn.classList.add('recording');
        if (voiceBtnLabel) voiceBtnLabel.textContent = "⏹ Stop Recording";
    };
    recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) fullTranscript += event.results[i][0].transcript;
        if (rawInput) rawInput.value = fullTranscript;
    };
    recognition.onend = () => {
        isRecording = false;
        if (voiceBtn) voiceBtn.classList.remove('recording');
        if (voiceBtnLabel) voiceBtnLabel.textContent = "Start Voice Input";
    };
    recognition.start();
}
if (voiceBtn) voiceBtn.addEventListener('click', toggleVoice);

// SECTION 5 — EXAMPLE PRESETS:
function loadExample(key) {
    if (tabButtons && tabButtons[0]) tabButtons[0].click();
    let text = "";
    switch(key) {
        case 'chest':
            text = "Patient is 67 year old male, known diabetic and hypertensive. Complaining of severe chest pain since last 1 hour, radiating to left arm. Profuse sweating. BP was 160/100 last check. He took an aspirin at home. Allergic to penicillin. Previous history of something with heart 2 years ago, not sure what. Currently confused and anxious.";
            break;
        case 'accident':
            text = "Road accident near Hosur road flyover. Two wheeler vs truck. Rider not wearing helmet. Unconscious but breathing. Bleeding from head, left leg at odd angle. Bystanders around. No ambulance yet. Traffic jam building. One person trying to move the victim.";
            break;
        case 'child':
            text = "My 3 year old has fever since yesterday night, 103.2F. Vomiting twice. Refused food. Had a brief shivering episode. No rash visible. No neck stiffness I think. Last vaccines were 6 months ago. No known allergies. We are 45 mins from nearest hospital. Should we go now?";
            break;
        case 'mental':
            text = "My friend called me saying she does not want to be here anymore. She has been very stressed with job loss last month and a breakup. She is alone at home. She has history of depression but stopped medication 3 months back. She is not picking up calls now. I am 20 mins away. What should I do?";
            break;
    }
    if (rawInput) rawInput.value = text;
}

// SECTION 6 — BUILD GEMINI PROMPT:
function buildPrompt(rawText, scenario, location, resources) {
    return `You are an Autonomous Intelligence System designed to interpret messy, real-world, unstructured inputs and convert them into structured, actionable decisions.

You must handle:
- Panic messages
- Incomplete descriptions
- Mixed or irrelevant information
- Multimodal context (voice, images, environment)

Your objective is to:
1. Extract meaningful information from chaos
2. Identify uncertainty and missing details
3. Assess risk and urgency
4. Generate clear, actionable steps
5. Provide reasoning and confidence

---

INPUT:
Raw Input: ${rawText}
Scenario Hint: ${scenario || 'not specified'}
Location Context: ${location || 'not specified'}
Available Resources: ${resources || 'not specified'}

---

STEP 1: SIGNAL EXTRACTION
- Extract relevant facts from noisy input
- Ignore irrelevant or emotional noise
- Identify key entities, conditions, and events

STEP 2: CONTEXT UNDERSTANDING
- Understand environment (medical, accident, disaster, general issue)
- Detect possible intent or scenario type

STEP 3: UNCERTAINTY MODELING
- Identify missing or unclear critical information
- Avoid assumptions
- Mark uncertainty explicitly

STEP 4: RISK CLASSIFICATION
Classify urgency: CRITICAL / HIGH / MEDIUM / LOW
- Be conservative
- Escalate when unsure

STEP 5: ACTION PLANNING
- Provide step-by-step instructions
- Must be usable by non-experts
- Prioritize safety and feasibility

STEP 6: SAFETY & ESCALATION
- Identify when external help is required
- Add warnings for dangerous actions

STEP 7: CONFIDENCE SCORING
- Score confidence (0-1)
- Lower score when uncertainty is high

---

OUTPUT STRICT JSON ONLY. No extra text, no markdown fences:
{
  "scenario_type": "medical | accident | environmental | mental_health | unknown",
  "severity": "CRITICAL | HIGH | MEDIUM | LOW",
  "confidence": 0.0,
  "summary": "clear explanation of interpreted situation",
  "extracted_signals": ["key facts extracted from messy input"],
  "uncertainty": ["missing or unclear details"],
  "key_risks": ["major risks identified"],
  "recommended_actions": ["step-by-step instructions for non-experts"],
  "warnings": ["dangerous actions to avoid"],
  "seek_help_if": ["conditions requiring professional/emergency help"],
  "follow_up_questions": ["questions to resolve critical unknowns"]
}`;
}

// SECTION 7 — GEMINI API CALL:
async function callGemini(rawText, scenario, location, resources) {
    const parts = [{ text: buildPrompt(rawText, scenario, location, resources) }];
    if (currentImageBase64 !== null) {
        parts.unshift({ inline_data: { mime_type: currentImageMime, data: currentImageBase64 } });
    }
    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
        })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `HTTP status ${response.status}`);
    return data.candidates[0].content.parts[0].text.trim();
}

// SECTION 8 — RENDER PROTOCOL:
function renderProtocol(protocol) {
    const { scenario_type, severity, confidence, summary, extracted_signals, uncertainty, key_risks, recommended_actions, warnings, seek_help_if, follow_up_questions } = protocol;

    let html = '<div class="protocol-card">';
    const sevLower = (severity || 'low').toLowerCase();
    let icon = '🟢';
    if (sevLower === 'critical') icon = '🚨';
    if (sevLower === 'high') icon = '🟠';
    if (sevLower === 'medium') icon = '🟡';

    const confPct = confidence !== undefined ? Math.round(confidence * 100) : 0;
    const confColor = confPct >= 80 ? 'var(--accent)' : confPct >= 50 ? 'var(--yellow)' : 'var(--red)';

    // Header row
    html += `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div class="severity-badge severity-${sevLower}"><strong>${icon} ${severity}</strong></div>
        <div style="display:flex;align-items:center;gap:8px;">
            ${scenario_type ? `<span style="font-family:var(--mono);font-size:0.7rem;color:var(--text-muted);background:var(--surface2);padding:3px 8px;border-radius:99px;text-transform:uppercase;">${scenario_type}</span>` : ''}
            <div style="font-family:var(--mono);font-size:0.75rem;color:var(--text-muted);">Confidence</div>
            <div style="width:80px;height:6px;background:var(--surface2);border-radius:99px;overflow:hidden;">
                <div style="width:${confPct}%;height:100%;background:${confColor};border-radius:99px;"></div>
            </div>
            <div style="font-family:var(--mono);font-size:0.75rem;color:${confColor};">${confPct}%</div>
        </div>
    </div>`;

    if (summary) html += `<div class="info-item" style="margin-top:16px;font-style:italic;color:var(--text-muted);">"${summary}"</div>`;

    const section = (title, items, itemFn) => {
        if (!items || items.length === 0) return '';
        let s = `<div class="protocol-section"><div class="protocol-section-title">${title}</div>`;
        items.forEach((item, i) => { s += itemFn(item, i); });
        s += '</div>';
        return s;
    };

    html += section('🔍 Extracted Signals', extracted_signals, item => `<div class="info-item">• ${item}</div>`);
    html += section('⚡ Key Risks', key_risks, item => `<div class="info-item">📌 ${item}</div>`);
    html += section('🚀 Recommended Actions', recommended_actions, (item, i) => `<div class="action-item"><span class="badge badge-num">${i+1}</span><span>${item}</span></div>`);
    html += section('🏥 Seek Help If', seek_help_if, item => `<div class="warning-item" style="border-color:var(--red);">🚑 ${item}</div>`);
    html += section('⛔ Warnings / Do NOT Do', warnings, item => `<div class="warning-item">⛔ ${item}</div>`);
    html += section('❓ Uncertainties & Follow-up', [...(uncertainty||[]), ...(follow_up_questions||[])], item => `<div class="action-item"><span class="badge" style="background:transparent;">❓</span><span>${item}</span></div>`);

    html += '</div>';
    return html;
}

// SECTION 9 — MAIN ANALYZE HANDLER:
const LOADING_STEPS = ['Extracting signals from input...', 'Modeling uncertainty...', 'Assessing risk level...', 'Generating action protocol...'];
const analyzeBtn = document.getElementById('analyzeBtn');
const analyzeBtnText = document.getElementById('analyzeBtnText');
const scenarioType = document.getElementById('scenarioType');
const locationCtx = document.getElementById('locationCtx');
const resourcesCtx = document.getElementById('resourcesCtx');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingStepLabel = document.getElementById('loadingStep');
const outputArea = document.getElementById('outputArea');
const outputActions = document.getElementById('outputActions');

if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
        const rawText = rawInput ? rawInput.value.trim() : '';
        const scenario = scenarioType ? scenarioType.value : '';
        const location = locationCtx ? locationCtx.value.trim() : '';
        const resources = resourcesCtx ? resourcesCtx.value.trim() : '';

        if (rawText === '' && currentImageBase64 === null) {
            if (rawInput) {
                rawInput.style.borderColor = 'var(--red)';
                rawInput.placeholder = "WARNING: Please provide some input before analyzing!";
                rawInput.focus();
            }
            return;
        }
        if (rawInput) rawInput.style.borderColor = '';

        analyzeBtn.disabled = true;
        const originalText = analyzeBtnText.textContent;
        analyzeBtnText.textContent = "Analyzing...";
        loadingOverlay.classList.remove('hidden');
        let stepIdx = 0;
        if (loadingStepLabel) loadingStepLabel.textContent = LOADING_STEPS[stepIdx];
        const loaderInterval = setInterval(() => {
            stepIdx = (stepIdx + 1) % LOADING_STEPS.length;
            if (loadingStepLabel) loadingStepLabel.textContent = LOADING_STEPS[stepIdx];
        }, 900);

        try {
            let cleanJsonStr = await callGemini(rawText, scenario, location, resources);
            // Strip <think> blocks from 2.5 reasoning models
            if (cleanJsonStr.includes('<think>')) cleanJsonStr = cleanJsonStr.replace(/<think>[\s\S]*?<\/think>/g, '');
            cleanJsonStr = cleanJsonStr.trim();
            // Strip markdown JSON fences
            if (cleanJsonStr.startsWith('```')) {
                const firstNewline = cleanJsonStr.indexOf('\n');
                if (firstNewline !== -1) cleanJsonStr = cleanJsonStr.substring(firstNewline + 1);
            }
            if (cleanJsonStr.endsWith('```')) cleanJsonStr = cleanJsonStr.slice(0, -3);
            cleanJsonStr = cleanJsonStr.trim();

            const protocol = JSON.parse(cleanJsonStr);
            const renderedHtml = renderProtocol(protocol);
            if (outputArea) outputArea.innerHTML = `<div class="output-rendered">${renderedHtml}</div>`;
            if (outputActions) outputActions.classList.remove('hidden');

        } catch (err) {
            console.error(err);
            if (outputArea) {
                outputArea.innerHTML = `<div class="warning-item" style="border-left:4px solid var(--red);color:var(--red);">
                    <strong>Error:</strong><br>${err.message}
                </div>`;
            }
        } finally {
            clearInterval(loaderInterval);
            loadingOverlay.classList.add('hidden');
            analyzeBtn.disabled = false;
            analyzeBtnText.textContent = originalText;
        }
    });
}

// SECTION 10 — UTILITY FUNCTIONS:
function copyOutput() {
    if (!outputArea) return;
    navigator.clipboard.writeText(outputArea.innerText).then(() => {
        const buttons = outputActions ? outputActions.querySelectorAll('button') : [];
        if (buttons.length > 0) {
            const copyBtn = buttons[0];
            const orig = copyBtn.textContent;
            copyBtn.textContent = "✓ Copied!";
            setTimeout(() => { copyBtn.textContent = orig; }, 2000);
        }
    });
}

function printOutput() { window.print(); }

function clearAll() {
    if (rawInput) rawInput.value = '';
    currentImageBase64 = null;
    currentImageMime = null;
    if (imagePreview) { imagePreview.innerHTML = ''; imagePreview.classList.add('hidden'); }
    if (dropZone) dropZone.classList.remove('hidden');
    if (outputArea) {
        outputArea.innerHTML = `
            <div class="output-placeholder">
                <svg viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <p>Output protocol will appear here</p>
            </div>`;
    }
    if (outputActions) outputActions.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    const actionBtns = outputActions ? outputActions.querySelectorAll('button') : [];
    if (actionBtns.length >= 3) {
        actionBtns[0].addEventListener('click', copyOutput);
        actionBtns[1].addEventListener('click', printOutput);
        actionBtns[2].addEventListener('click', clearAll);
        actionBtns[2].classList.add('danger');
    }
});
