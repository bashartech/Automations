---
name: "mistral-ai-setup"
description: "Complete Mistral AI integration setup for building conversational AI chatbots with context awareness and safety controls. Use when user needs to integrate Mistral AI API, set up chatbot functionality, or implement stateful conversations with medical safety guidelines."
---

# Mistral AI Setup Skill

## When to Use This Skill

- User wants to integrate Mistral AI API into their application
- User needs to build a conversational chatbot with context awareness
- User asks about Mistral AI setup, configuration, or best practices
- User needs to implement stateful conversations (remembering chat history)
- User requires medical/healthcare chatbot with safety controls
- User wants cost-effective AI solution (Mistral is cheaper than GPT-4)

## Procedure

### 1. Mistral AI Account Setup

**Step 1.1: Create Account**
- Go to https://console.mistral.ai/
- Sign up for an account (GitHub or email)
- Verify your email address
- Log in to Mistral Console

**Step 1.2: Get API Key**
- Navigate to "API Keys" section
- Click "Create new key"
- Name your key (e.g., "MediDesk Production")
- Copy and save your API key securely
- Example: `lts2pzXQNn7nI8BSXi54z8cmlTr68GdJ`
- **Important**: This key is shown only once - save it immediately

**Step 1.3: Choose Model**
Available models (as of 2024):
- **mistral-small-latest** - Fast, cost-effective ($0.001/1K tokens) ✅ Recommended for chatbots
- **mistral-medium-latest** - Balanced performance
- **mistral-large-latest** - Most capable, higher cost
- **open-mistral-7b** - Open source, self-hosted option

For chatbots: Use `mistral-small-latest` for best cost/performance ratio.

**Step 1.4: Understand Pricing**
- Mistral Small: ~$0.001 per 1K tokens
- Average conversation (10 turns): ~$0.015
- 100 conversations: ~$1.50
- Free tier: $5 credit for testing

### 2. Project Integration

**Step 2.1: Install Dependencies**
No package installation needed - use native `fetch` API:
```bash
# No npm install required - uses browser fetch
```

**Step 2.2: Configure Environment Variables**
Create or update `.env` file:
```env
VITE_MISTRAL_API_KEY=lts2pzXQNn7nI8BSXi54z8cmlTr68GdJ
```

**Step 2.3: Create Constants File**
Create `src/utils/constants.ts`:
```typescript
// Mistral AI Configuration
export const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
export const MISTRAL_MODEL = 'mistral-small-latest';
export const MISTRAL_TEMPERATURE = 0.2; // Low for consistency
export const MISTRAL_MAX_TOKENS = 500; // Limit response length

// Fallback response for errors
export const FALLBACK_RESPONSE =
  "I apologize, but I'm having trouble connecting right now. " +
  "Please try again or contact our staff directly.";

// Welcome message
export const WELCOME_MESSAGE =
  "Hello! I'm MediDesk, your AI assistant. " +
  "I can help you with hospital information, appointment booking, " +
  "and general inquiries. How can I assist you today?";
```

**Step 2.4: Create Mistral Service File**
Create `src/services/mistral.ts`:
```typescript
import type { MistralMessage, MistralResponse } from '../types';
import {
  MISTRAL_API_URL,
  MISTRAL_MODEL,
  MISTRAL_TEMPERATURE,
  MISTRAL_MAX_TOKENS,
  FALLBACK_RESPONSE
} from '../utils/constants';
import { getHospitalDataForAI } from './hospitalConfig';

/**
 * System prompt with strict medical safety rules
 */
const getSystemPrompt = (): string => {
  const hospitalData = getHospitalDataForAI();

  return `You are MediDesk, a professional hospital front-desk assistant AI.

STRICT RULES (YOU MUST FOLLOW THESE):
1. You do NOT provide medical advice, diagnosis, or treatment recommendations
2. You do NOT answer medical questions about symptoms, diseases, or medications
3. You ONLY answer questions using the hospital data provided below
4. You act ONLY as a front-desk receptionist helping with:
   - Appointment booking information
   - Hospital timings and contact details
   - Department information and doctor availability
   - Consultation fees
   - Hospital facilities and services
   - General administrative queries

5. If asked about medical conditions, symptoms, or treatment:
   - Politely decline and suggest booking an appointment with a doctor
   - Example: "I cannot provide medical advice. I recommend booking an appointment with our [relevant department] for proper medical consultation."

6. If information is not in the hospital data below, respond with:
   "${FALLBACK_RESPONSE}"

7. Be friendly, professional, and concise
8. Always prioritize patient safety by not giving medical information

HOSPITAL DATA:
${hospitalData}

Remember: You are a front-desk assistant, NOT a medical professional. Your role is to help patients with administrative tasks and direct them to appropriate medical staff.`;
};

/**
 * Send a message to Mistral AI and get response
 * @param userMessage - The user's message
 * @param conversationHistory - Optional conversation history for context
 * @returns AI response text
 */
export const askMistral = async (
  userMessage: string,
  conversationHistory: MistralMessage[] = []
): Promise<string> => {
  try {
    // Validate API key
    const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('Mistral API key is not configured');
    }

    // Build messages array with system prompt
    const messages: MistralMessage[] = [
      { role: 'system', content: getSystemPrompt() },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    // Make API request
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        temperature: MISTRAL_TEMPERATURE,
        max_tokens: MISTRAL_MAX_TOKENS,
        messages: messages
      })
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Mistral API error:', errorData);
      throw new Error(`Mistral API error: ${response.status}`);
    }

    // Parse response
    const data: MistralResponse = await response.json();

    // Extract AI message
    if (data.choices && data.choices.length > 0) {
      const aiMessage = data.choices[0].message.content;
      return aiMessage;
    } else {
      throw new Error('No response from Mistral AI');
    }

  } catch (error) {
    console.error('Error calling Mistral AI:', error);
    return FALLBACK_RESPONSE;
  }
};
```

**Step 2.5: Create Type Definitions**
Create `src/types/index.ts`:
```typescript
// Mistral AI message format
export interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Mistral API response format
export interface MistralResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Chat message for UI
export interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
}
```

### 3. Implementing Stateful Conversations

**Step 3.1: Maintain Conversation History**
In your chat component:
```typescript
const [messages, setMessages] = useState<Message[]>([]);

const handleSendMessage = async (content: string) => {
  // Add user message
  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: content.trim(),
    timestamp: new Date()
  };
  setMessages(prev => [...prev, userMessage]);

  // Build conversation history (last 10 messages)
  const conversationHistory = messages
    .filter(msg => msg.role !== 'system' && msg.id !== 'welcome')
    .slice(-10) // Keep last 10 for context
    .map(msg => ({
      role: msg.role === 'ai' ? 'assistant' as const : msg.role as 'user',
      content: msg.content
    }));

  // Get AI response with context
  const aiResponse = await askMistral(content.trim(), conversationHistory);

  // Add AI message
  const aiMessage: Message = {
    id: (Date.now() + 1).toString(),
    role: 'ai',
    content: aiResponse,
    timestamp: new Date()
  };
  setMessages(prev => [...prev, aiMessage]);
};
```

**Step 3.2: Context Window Management**
- Keep last 10 messages for context (balance between context and cost)
- Filter out system messages and welcome messages
- Each message adds ~50-100 tokens
- Total context per request: ~1500 tokens (system + history + current)

### 4. Medical Safety Implementation

**Step 4.1: System Prompt Safety Rules**
The system prompt includes strict rules:
- ✅ No medical advice, diagnosis, or treatment
- ✅ Only administrative information
- ✅ Redirect medical queries to doctors
- ✅ Use only provided hospital data

**Step 4.2: Additional Safety Layer (Optional)**
```typescript
export const containsMedicalQuery = (message: string): boolean => {
  const medicalKeywords = [
    'symptom', 'pain', 'disease', 'medication', 'drug', 'treatment',
    'diagnose', 'diagnosis', 'cure', 'sick', 'illness', 'infection'
  ];

  const lowerMessage = message.toLowerCase();
  return medicalKeywords.some(keyword => lowerMessage.includes(keyword));
};

export const getMedicalQueryResponse = (department?: string): string => {
  const dept = department || 'appropriate department';
  return `I cannot provide medical advice or diagnosis. For medical concerns, I recommend booking an appointment with our ${dept}. Our qualified doctors will be able to help you properly. Would you like to book an appointment?`;
};
```

### 5. Testing & Optimization

**Step 5.1: Test Conversation Flow**
```
User: "What are your timings?"
AI: "OPD: 9am-5pm, Emergency: 24/7"

User: "Can I visit tomorrow?"
AI: "Yes! Would you like to book an appointment?" ✅ (Remembers context)
```

**Step 5.2: Test Safety Controls**
```
User: "I have a headache, what should I take?"
AI: "I cannot provide medical advice. Please book an appointment with our General Medicine department." ✅ (Refuses medical advice)
```

**Step 5.3: Monitor Token Usage**
- Check Mistral Console for usage statistics
- Average conversation: ~1500 tokens per request
- Optimize by reducing max_tokens if responses are too long
- Adjust context window size (10 messages is optimal)

### 6. Production Best Practices

**Performance:**
- ✅ Use `mistral-small-latest` for cost efficiency
- ✅ Set temperature to 0.2 for consistent responses
- ✅ Limit max_tokens to 500 (prevents overly long responses)
- ✅ Keep context window to 10 messages (balance cost/context)

**Security:**
- ✅ Store API key in environment variables
- ✅ Never commit .env to version control
- ✅ Use .gitignore to exclude .env
- ✅ Rotate API keys periodically

**Reliability:**
- ✅ Implement try-catch error handling
- ✅ Return fallback response on errors
- ✅ Log errors for debugging
- ✅ Don't expose API errors to users

**Cost Optimization:**
- ✅ Cache common responses (FAQ)
- ✅ Limit context window size
- ✅ Use lower temperature for consistency
- ✅ Set reasonable max_tokens limit

## Output Format

When helping users set up Mistral AI, provide:

**Configuration Summary:**
```
Mistral AI Configuration:
- API Key: lts2pzXQNn7nI8BSXi54z8cmlTr68GdJ
- Model: mistral-small-latest
- Temperature: 0.2 (consistent responses)
- Max Tokens: 500
- Context Window: 10 messages
- Estimated Cost: $0.015 per 10-turn conversation
```

**Integration Checklist:**
- [ ] Mistral AI account created
- [ ] API key obtained and saved
- [ ] Environment variables configured
- [ ] Constants file created (src/utils/constants.ts)
- [ ] Mistral service created (src/services/mistral.ts)
- [ ] Type definitions added (src/types/index.ts)
- [ ] Conversation history implemented
- [ ] Medical safety controls added
- [ ] Error handling implemented
- [ ] Testing completed

**Code Files to Create:**
1. `.env` - API key
2. `src/utils/constants.ts` - Configuration
3. `src/services/mistral.ts` - Mistral service
4. `src/types/index.ts` - Type definitions
5. Chat component with conversation history

## Quality Criteria

- **Complete Setup**: From account creation to production deployment
- **Stateful Conversations**: Proper context management (last 10 messages)
- **Medical Safety**: Strict rules preventing medical advice
- **Error Handling**: Graceful failures with fallback responses
- **Cost Optimization**: Efficient token usage and context management
- **Security**: API keys in environment variables, never hardcoded
- **Clear Documentation**: Step-by-step with code examples

## Common Issues & Solutions

**Issue 1: "Invalid API key" error**
- Verify API key in .env matches Mistral Console
- Check for typos or extra spaces
- Ensure environment variables loaded (restart dev server)
- Confirm API key has not been revoked

**Issue 2: Chatbot not remembering context**
- Verify conversation history is being built correctly
- Check that welcome message is filtered out
- Ensure messages are mapped to correct roles (user/assistant)
- Confirm conversationHistory is passed to askMistral()

**Issue 3: Responses are too long/short**
- Adjust MISTRAL_MAX_TOKENS (default: 500)
- Increase for longer responses, decrease for brevity
- Monitor token usage in Mistral Console

**Issue 4: Inconsistent responses**
- Lower temperature (0.1-0.3 for consistency)
- Higher temperature (0.7-1.0 for creativity)
- Default 0.2 is optimal for chatbots

**Issue 5: High costs**
- Reduce context window (10 → 5 messages)
- Lower max_tokens limit
- Cache common FAQ responses
- Use mistral-small instead of mistral-large

**Issue 6: Medical advice being given**
- Strengthen system prompt rules
- Add keyword detection layer
- Test with medical queries
- Update prompt if AI bypasses rules

## Example

**Input**: "I need to integrate Mistral AI into my healthcare chatbot with conversation memory and medical safety controls"

**Output**:

I'll help you set up Mistral AI with stateful conversations and medical safety. Here's the complete setup:

### 1. Get Mistral API Key

1. Go to https://console.mistral.ai/
2. Sign up and verify email
3. Navigate to "API Keys" → "Create new key"
4. Save your key: `lts2pzXQNn7nI8BSXi54z8cmlTr68GdJ`

### 2. Configure Environment

Create `.env`:
```env
VITE_MISTRAL_API_KEY=lts2pzXQNn7nI8BSXi54z8cmlTr68GdJ
```

### 3. Create Service Files

**Constants** (`src/utils/constants.ts`):
[Provide complete constants code]

**Mistral Service** (`src/services/mistral.ts`):
[Provide complete service code with medical safety]

**Types** (`src/types/index.ts`):
[Provide type definitions]

### 4. Implement Stateful Chat

[Provide chat component code with conversation history]

### 5. Test

**Test Context Memory:**
```
You: "My name is John"
AI: "Hello John! How can I help?"
You: "What's my name?"
AI: "Your name is John" ✅
```

**Test Medical Safety:**
```
You: "I have a fever, what should I do?"
AI: "I cannot provide medical advice. Please book an appointment with our General Medicine department." ✅
```

**Cost Estimate:**
- Model: mistral-small-latest
- Cost: ~$0.015 per 10-turn conversation
- 100 conversations: ~$1.50

Your chatbot is now ready with conversation memory and medical safety controls!
