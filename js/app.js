const GEMINI_API_KEY = 'AIzaSyCDt-GVR_o90Mhp_AzHP3lFwQWeq2wdAes';
const GEMINI_MODEL = 'gemini-1.5-flash';
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
        // Query all .tab-btn elements. On click, remove .active from all tab buttons and all .tab-content divs
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => {
            c.classList.remove('active');
            c.classList.add('hidden'); // Ensure CSS hidden class is added back 
        });
        
        // add .active to the clicked button
        btn.classList.add('active');
        
        // Match div id to tab. Using fallback index if data-tab is missing
        let tabValue = btn.getAttribute('data-tab');
        if (!tabValue) {
            const defaultTabs = ['text', 'image', 'context'];
            tabValue = defaultTabs[index] || 'text';
        }
        
        const targetContent = document.getElementById(`tab-${tabValue}`);
        if (targetContent) {
            targetContent.classList.add('active');
            targetContent.classList.remove('hidden'); // Remove hidden class so it displays
        }
    });
});

// SECTION 3 — FILE UPLOAD:
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');

if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const fullDataUrl = event.target.result;
        currentImageMime = file.type;
        currentImageBase64 = fullDataUrl.split(',')[1];
        
        if (file.type.startsWith('image/')) {
            imagePreview.innerHTML = `<img src="${fullDataUrl}" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid var(--border);" alt="Preview" />`;
            imagePreview.classList.remove('hidden');
            if (dropZone) dropZone.classList.add('hidden');
        } else {
            imagePreview.innerHTML = `<div style="padding: 16px; border: 1px solid var(--border); border-radius: 8px; text-align: center; color: var(--text);">${file.name}</div>`;
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
    if (!SpeechRecognition) {
        alert("Speech Recognition is not supported in this browser. Please use Google Chrome.");
        return;
    }
    
    if (isRecording && recognition) {
        recognition.stop();
        return;
    }
    
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
        for (let i = 0; i < event.results.length; ++i) {
            fullTranscript += event.results[i][0].transcript;
        }
        if (rawInput) rawInput.value = fullTranscript;
    };
    
    recognition.onend = () => {
        isRecording = false;
        if (voiceBtn) voiceBtn.classList.remove('recording');
        if (voiceBtnLabel) voiceBtnLabel.textContent = "Start Voice Input";
    };
    
    recognition.start();
}

if (voiceBtn) {
    voiceBtn.addEventListener('click', toggleVoice);
}

// SECTION 5 — EXAMPLE PRESETS:
function loadExample(key) {
    // switch to text tab (click first tab button)
    if (tabButtons && tabButtons[0]) {
        tabButtons[0].click();
    }
    
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
    
    if (rawInput) {
        rawInput.value = text;
    }
}

// SECTION 6 — BUILD GEMINI PROMPT:
function buildPrompt(rawText, scenario, location, resources) {
    return `You are an advanced emergency triage intelligence system.

Your job is to convert chaotic real-world input into structured, actionable emergency protocols.

### INPUT:
- Raw description: ${rawText}
- Location: ${location || 'not specified'}
- Available resources: ${resources || 'not specified'}

### STEP 1: Extract Facts
Identify:
- Symptoms
- Environment
- Risks
- Missing critical info

### STEP 2: Risk Classification
Classify severity:
CRITICAL / HIGH / MEDIUM / LOW

### STEP 3: Generate Immediate Actions
- Must be step-by-step
- Must be executable by a non-expert

### STEP 4: Uncertainty Handling
- Identify unknowns
- Ask follow-up questions

### STEP 5: Confidence Score
Give a confidence score (0–1)

### OUTPUT STRICT JSON:
{
  "severity": "...",
  "confidence": 0.0,
  "summary": "...",
  "key_risks": [],
  "immediate_actions": [],
  "follow_up_questions": [],
  "warnings": []
}

IMPORTANT:
- NO extra text
- Only valid JSON`;
}

// SECTION 7 — GEMINI API CALL:
async function callGemini(rawText, scenario, location, resources) {
    const parts = [
        { text: buildPrompt(rawText, scenario, location, resources) }
    ];
    
    if (currentImageBase64 !== null) {
        parts.unshift({
            inline_data: {
                mime_type: currentImageMime,
                data: currentImageBase64
            }
        });
    }
    
    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1200
            }
        })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error?.message || `HTTP status ${response.status}`);
    }
    
    return data.candidates[0].content.parts[0].text.trim();
}

// SECTION 8 — RENDER PROTOCOL:
function renderProtocol(protocol) {
    const {
        severity,
        confidence,
        summary,
        key_risks,
        immediate_actions,
        follow_up_questions,
        warnings
    } = protocol;
    
    let html = '<div class="protocol-card">';
    
    const sevLower = (severity || 'low').toLowerCase();
    let icon = '🟢';
    if(sevLower === 'critical') icon = '🚨';
    if(sevLower === 'high') icon = '🟠';
    if(sevLower === 'medium') icon = '🟡';

    // Severity badge and Confidence
    html += `<div style="display: flex; justify-content: space-between; align-items: center;">
        <div class="severity-badge severity-${sevLower}">
            <strong>${icon} ${severity}</strong>
        </div>
        <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--text-dim);">
            Confidence: ${confidence !== undefined ? confidence : 'N/A'}
        </div>
    </div>`;
    
    // Summary
    if (summary) {
        html += `<div class="info-item" style="margin-top: 16px;">${summary}</div>`;
    }
    
    // Key Risks
    if (key_risks && key_risks.length > 0) {
        html += '<div class="protocol-section"><div class="protocol-section-title">Key Risks & Facts</div>';
        key_risks.forEach(risk => {
            html += `<div class="info-item">📌 ${risk}</div>`;
        });
        html += '</div>';
    }
    
    // Immediate Actions
    if (immediate_actions && immediate_actions.length > 0) {
        html += '<div class="protocol-section"><div class="protocol-section-title">Immediate Actions</div>';
        immediate_actions.forEach((action, i) => {
            html += `<div class="action-item"><span class="badge badge-num">${i + 1}</span><span>${action}</span></div>`;
        });
        html += '</div>';
    }
    
    // Follow-up Questions
    if (follow_up_questions && follow_up_questions.length > 0) {
        html += '<div class="protocol-section"><div class="protocol-section-title">Follow-up Questions (Unknowns)</div>';
        follow_up_questions.forEach(q => {
            html += `<div class="action-item"><span class="badge" style="background: transparent;">❓</span><span>${q}</span></div>`;
        });
        html += '</div>';
    }
    
    // Warnings
    if (warnings && warnings.length > 0) {
        html += '<div class="protocol-section"><div class="protocol-section-title">Warnings / Do Not Do</div>';
        warnings.forEach(warning => {
            html += `<div class="warning-item">⛔ ${warning}</div>`;
        });
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

// SECTION 9 — MAIN ANALYZE HANDLER:
const LOADING_STEPS = [
    'Parsing unstructured input...', 
    'Identifying key medical entities...', 
    'Assessing severity level...', 
    'Generating action protocol...'
];

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
                rawInput.placeholder = "WARNING: Please provide some input text or upload a document/photo before analyzing!";
                rawInput.focus();
            }
            return;
        }
        
        if (rawInput) rawInput.style.borderColor = ''; // reset border
        
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
            
            // Strip any JSON markdown fences
            cleanJsonStr = cleanJsonStr.trim();
            if (cleanJsonStr.startsWith('```')) {
                const firstNewline = cleanJsonStr.indexOf('\n');
                if (firstNewline !== -1) cleanJsonStr = cleanJsonStr.substring(firstNewline + 1);
            }
            if (cleanJsonStr.endsWith('```')) {
                cleanJsonStr = cleanJsonStr.slice(0, -3);
            }
            cleanJsonStr = cleanJsonStr.trim();
            
            const protocol = JSON.parse(cleanJsonStr);
            const renderedHtml = renderProtocol(protocol);
            
            if (outputArea) {
                outputArea.innerHTML = `<div class="output-rendered">${renderedHtml}</div>`;
            }
            
            if (outputActions) outputActions.classList.remove('hidden');
            
        } catch (err) {
            console.error(err);
            if (outputArea) {
                outputArea.innerHTML = `<div class="warning-item" style="border-left: 4px solid var(--red); color: var(--red);">
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
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "✓ Copied!";
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }
    });
}

function printOutput() {
    window.print();
}

function clearAll() {
    if (rawInput) rawInput.value = '';
    currentImageBase64 = null;
    currentImageMime = null;
    
    if (imagePreview) {
        imagePreview.innerHTML = '';
        imagePreview.classList.add('hidden');
    }
    
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
            </div>
        `;
    }
    
    if (outputActions) outputActions.classList.add('hidden');
}

// Attach event listeners to utility buttons
document.addEventListener('DOMContentLoaded', () => {
    const actionBtns = outputActions ? outputActions.querySelectorAll('button') : [];
    if (actionBtns.length >= 3) {
        actionBtns[0].addEventListener('click', copyOutput);
        actionBtns[1].addEventListener('click', printOutput);
        actionBtns[2].addEventListener('click', clearAll);
        
        // Add danger class to clear button as per CSS specification
        actionBtns[2].classList.add('danger');
    }
});
