# 🎤 Voice + Multilingual AI Doctor Chatbot — Complete Implementation Skill

## 📋 Overview
This skill explains how to add **voice-based conversation** (Speech-to-Text + Text-to-Speech) with **Urdu, Hindi, and English** support to the medical AI chatbot, enabling patients to speak their symptoms and hear diagnoses in their native language.

---

## 🔍 Current State Analysis

### ✅ What Already Exists
| Feature | Status | Details |
|---------|--------|---------|
| **Voice Input (STT)** | Partial | Web Speech API, `en-US` only, 4s silence auto-stop |
| **Voice Output (TTS)** | Partial | `window.speechSynthesis`, prefers Hindi/Urdu voices |
| **AI Language Detection** | Partial | Gemini prompt tells AI to reply in same language |
| **Multilingual AI Responses** | Partial | AI can reply in Urdu/Hindi if prompted |

### ❌ What's Missing
| Feature | Gap |
|---------|-----|
| **Urdu/Hindi STT** | Voice input only works in English |
| **Tesseract Urdu/Hindi OCR** | Report extraction is English-only |
| **Language Auto-Detection** | No automatic detection of user's language |
| **Roman Urdu Support** | Common in Pakistan but not handled well |
| **Voice Language Toggle** | User can't switch voice languages |

---

## 🏗️ Architecture: How Voice Currently Works

### Frontend Flow
```
User clicks mic → useVoice.startListening() 
  → Web Speech API (en-US) → transcript 
  → useEffect detects change → handleSendMessage(transcript)
  → Backend receives text → Agent processes → Response
  → speak(response) → SpeechSynthesis (Hindi/Urdu voice preferred)
```

### Current File Locations
```
src/hooks/useVoice.ts              — Voice input/output hook
src/pages/Chat.tsx                 — Chat page (calls speak() on every response)
src/components/ChatMessage.tsx     — Has speaker button for TTS replay
src/components/ChatInput.tsx       — Has mic button for STT input
```

### Backend Flow
```
POST /api/v1/chat/ → get_agent(agent_id) 
  → agent.run(message) → _build_prompt(message)
  → Gemini generates response → return to frontend
```

---

## 🚀 Step-by-Step Implementation

### PHASE 1: Multilingual Voice Input (STT)

#### 1.1 Update `useVoice.ts` — Multi-Language Speech Recognition

**File:** `src/hooks/useVoice.ts`

**Changes needed:**
```typescript
// Add language state
const [language, setLanguage] = useState("en-US");

// Language options
const LANGUAGES = {
  "en-US": "English",
  "ur-PK": "Urdu (Pakistan)",
  "hi-IN": "Hindi (India)",
  "en-IN": "English (India)",
};

// Update SpeechRecognition initialization
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = language;  // Use state instead of hardcoded "en-US"
recognition.interimResults = true;
recognition.continuous = true;

// Add language switching function
const setVoiceLanguage = (lang: string) => {
  setLanguage(lang);
  // Restart recognition with new language if currently listening
  if (isListening) {
    recognition.stop();
    setTimeout(() => startListening(), 100);
  }
};
```

#### 1.2 Add Language Selector to ChatInput

**File:** `src/components/ChatInput.tsx`

Add a dropdown above or next to the mic button:
```tsx
<select value={language} onChange={(e) => setVoiceLanguage(e.target.value)}>
  <option value="en-US">🇬🇧 English</option>
  <option value="ur-PK">🇵🇰 Urdu</option>
  <option value="hi-IN">🇮🇳 Hindi</option>
</select>
```

#### 1.3 Browser Compatibility Fallback

Web Speech API has limited Urdu support. For browsers that don't support `ur-PK`:

```typescript
// Fallback: Use English STT but let Gemini handle translation
// If user speaks Urdu but browser only supports English STT:
// 1. User speaks Urdu → English STT captures approximate Roman Urdu
// 2. Backend receives Roman Urdu text
// 3. Gemini prompt handles Roman Urdu → replies in proper Urdu
const isUrduSupported = (() => {
  const langs = SpeechRecognition.getSupportedLanguages?.() || [];
  return langs.includes("ur-PK");
})();
```

---

### PHASE 2: AI Language Auto-Detection

#### 2.1 Update Backend Triage — Detect Language

**File:** `backend/app/services/triage_service.py`

Add language detection to the triage function:
```python
def detect_language(text: str) -> str:
    """Detect if text is Urdu, Hindi, Roman Urdu, or English."""
    urdu_chars = set("آابتثجحخدذرزسشصضطظعغفقکلمنوںھایےۓۂۃ")
    hindi_chars = set("अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह")
    
    urdu_count = sum(1 for c in text if c in urdu_chars)
    hindi_count = sum(1 for c in text if c in hindi_chars)
    
    if urdu_count > len(text) * 0.1:
        return "urdu"
    elif hindi_count > len(text) * 0.1:
        return "hindi"
    
    # Roman Urdu detection (keywords)
    roman_urdu_words = ["mujhe", "mera", "hai", "bohat", "zyada", "takleef", "dard", "kya", "mein", "ko", "se"]
    text_lower = text.lower()
    roman_matches = sum(1 for w in roman_urdu_words if w in text_lower)
    if roman_matches >= 2:
        return "roman_urdu"
    
    return "english"

def classify_triage(symptoms: str, vital_signs: Dict[str, Any] = None) -> Dict[str, Any]:
    detected_lang = detect_language(symptoms)
    # ... existing code ...
    return {
        "triage_level": triage_level,
        # ... existing fields ...
        "detected_language": detected_lang,  # NEW
    }
```

#### 2.2 Update Base Agent Prompt — Language-Specific Instructions

**File:** `backend/app/agents/base_agent.py`

In `_build_prompt()`, add language-specific guidance:
```python
detected_lang = triage_result.get('detected_language', 'english')

LANGUAGE_INSTRUCTIONS = {
    "urdu": """
LANGUAGE: Reply in URDU (اردو) script.
- Use proper Urdu medical terms
- Write in Urdu script (not Roman Urdu)
- Explain conditions clearly in Urdu
""",
    "hindi": """
LANGUAGE: Reply in HINDI (हिन्दी) using simple Devanagari script.
- Use Hindi medical terms that patients understand
- Explain conditions in simple Hindi
""",
    "roman_urdu": """
LANGUAGE: Reply in ROMAN URDU (Urdu written in English alphabet).
- Example: "Aap ko bukhar hai, yeh dawai lein"
- Use common Roman Urdu medical terms
- Keep sentences simple and clear
""",
    "english": """
LANGUAGE: Reply in ENGLISH.
- Use simple medical terms patients can understand
- Explain complex terms in parentheses
"""
}

prompt = f"""{self.instructions}
...
=== LANGUAGE DETECTION ===
Detected Language: {detected_lang}
{LANGUAGE_INSTRUCTIONS.get(detected_lang, LANGUAGE_INSTRUCTIONS['english'])}

CRITICAL: ALWAYS reply in the SAME LANGUAGE as the user's message.
- If user writes in Urdu → Reply in Urdu
- If user writes in Hindi → Reply in Hindi
- If user writes in Roman Urdu → Reply in Roman Urdu
- If user writes in English → Reply in English
"""
```

---

### PHASE 3: Urdu/Hindi TTS Enhancement

#### 3.1 Update `useVoice.ts` — Better Voice Selection

```typescript
const getBestVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  
  if (language === "ur-PK") {
    // Priority: Urdu > Hindi (reads Roman Urdu well) > English
    const urduVoice = voices.find(v => v.lang.startsWith("ur"));
    if (urduVoice) return urduVoice;
  }
  
  if (language === "hi-IN") {
    const hindiVoice = voices.find(v => v.lang.startsWith("hi"));
    if (hindiVoice) return hindiVoice;
  }
  
  // Default: system voice
  return voices.find(v => v.default) || voices[0];
};

const speak = (text: string) => {
  if (!text) return;
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getBestVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = language;
  utterance.rate = 0.9;  // Slightly slower for medical clarity
  utterance.pitch = 1;
  
  window.speechSynthesis.speak(utterance);
};
```

#### 3.2 Cloud TTS Fallback (Optional, for Production)

Browser TTS has limited Urdu support. For production, use Google Cloud TTS:

```python
# backend/app/services/tts_service.py
from google.cloud import texttospeech

class TTSService:
    def __init__(self):
        self.client = texttospeech.TextToSpeechClient()
        
    def generate_audio(self, text: str, language: str = "en-US") -> bytes:
        voice_map = {
            "ur-PK": {"language_code": "ur-PK", "name": "ur-PK-Standard-A"},
            "hi-IN": {"language_code": "hi-IN", "name": "hi-IN-Standard-A"},
            "en-US": {"language_code": "en-US", "name": "en-US-Standard-C"},
        }
        
        voice_config = voice_map.get(language, voice_map["en-US"])
        
        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code=voice_config["language_code"],
            name=voice_config["name"]
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        response = self.client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        return response.audio_content
```

---

### PHASE 4: Roman Urdu Handling

#### 4.1 Roman Urdu → Urdu Translation (Optional)

If user speaks Roman Urdu but you want Urdu script response:

```python
# Use Gemini to translate Roman Urdu to Urdu script
# Add to base_agent.py prompt:
"""
If the user writes in Roman Urdu (Urdu in English letters):
- Understand their message correctly
- Reply in PROPER URDU SCRIPT (اردو) unless they specifically ask for Roman Urdu
- Example: User writes "mujhe sir dard hai" → Reply "آپ کو سر درد ہے، یہ دوائیں لیں..."
"""
```

#### 4.2 Common Roman Urdu Medical Terms Mapping

```python
ROMAN_URDU_MEDICAL_TERMS = {
    "sir dard": "headache",
    "pet dard": "stomach ache", 
    "bukhar": "fever",
    "zor ka dard": "severe pain",
    "saanphoolna": "swelling",
    "chakkar": "dizziness",
    "ulti": "vomiting",
    "dast": "diarrhea",
    "khansi": "cough",
    "saans phoolna": "shortness of breath",
    "dil ki dharkan": "heartbeat",
    "khoon": "blood",
    "dawa": "medicine",
    "marz": "disease",
    "ilaj": "treatment",
    "doctor ko dikhao": "show to doctor",
    "aramand": "comfortable",
    "bechain": "restless",
}
```

---

### PHASE 5: UI/UX Improvements

#### 5.1 Language Selector in Chat

Add a language toggle button in the chat header:
```tsx
<div className="flex items-center gap-2">
  <Globe className="w-4 h-4" />
  <select value={language} onChange={handleLanguageChange}>
    <option value="en-US">🇬🇧 English</option>
    <option value="ur-PK">🇵🇰 اردو</option>
    <option value="hi-IN">🇮🇳 हिन्दी</option>
  </select>
</div>
```

#### 5.2 Voice Language Auto-Switch

When user types in Urdu/Hindi, auto-switch voice recognition:
```tsx
useEffect(() => {
  const lang = detectLanguage(messages[messages.length - 1]?.content || "");
  if (lang !== language) {
    setVoiceLanguage(lang);
  }
}, [messages]);
```

#### 5.3 Voice Indicator in Messages

Add a language badge to each AI message:
```tsx
<div className="flex items-center gap-1">
  {triage.urgency && <span>{triage.urgency}</span>}
  {message.language && (
    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 rounded-full">
      {message.language === 'urdu' ? '🇵🇰 اردو' : 
       message.language === 'hindi' ? '🇮🇳 हिन्दी' : '🇬🇧 EN'}
    </span>
  )}
</div>
```

---

## 📊 Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 P0 | Multi-language STT (useVoice.ts) | 2 hours | High |
| 🔴 P0 | Language detection in triage | 1 hour | High |
| 🟡 P1 | Language-specific AI prompts | 1 hour | High |
| 🟡 P1 | Better TTS voice selection | 1 hour | Medium |
| 🟢 P2 | Roman Urdu → Urdu script conversion | 2 hours | Medium |
| 🟢 P2 | Cloud TTS fallback | 4 hours | Low |
| 🟢 P2 | Language selector UI | 2 hours | Medium |

**Total estimated effort: 13 hours**

---

## 🧪 Testing Checklist

- [ ] Voice input works in English
- [ ] Voice input works in Urdu (if browser supports it)
- [ ] Voice input works in Hindi (if browser supports it)
- [ ] Roman Urdu typed input → Urdu script response
- [ ] Hindi typed input → Hindi response
- [ ] TTS outputs in correct language
- [ ] Language auto-detection works for all 4 types
- [ ] Chat message language badge shows correctly
- [ ] Triage correctly identifies severity in Urdu/Hindi messages
- [ ] Medicine recommendations display correctly in all languages

---

## 🔧 Environment Variables Required

```env
# Voice + Multilingual Configuration
GOOGLE_CLOUD_TTS_KEY=path/to/tts-credentials.json  # Optional, for Cloud TTS
DEFAULT_VOICE_LANGUAGE=en-US                        # Default STT language
SUPPORTED_LANGUAGES=en-US,ur-PK,hi-IN               # Comma-separated list
```

---

## 📚 References

- [Web Speech API MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [SpeechSynthesis MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech)
- [Gemini Multi-Language Support](https://ai.google.dev/gemini-api/docs/models/gemini)
