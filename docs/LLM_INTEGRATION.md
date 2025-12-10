# LLM Integration Guide

## Overview

LiteRAG.js handles the **Retrieval** part of RAG. To complete the full RAG pipeline, you need to integrate an LLM for **Generation**.

## Architecture

```
User Question
     ↓
┌────────────────────────────────────┐
│   LiteRAG.js (Retrieval)           │
│                                    │
│  1. Text Chunking                  │
│  2. Vector Search                  │
│  3. Re-ranking                     │
│  4. Return Context                 │
└────────────────────────────────────┘
     ↓ (Context)
┌────────────────────────────────────┐
│   LLM (Generation)                 │
│                                    │
│  - OpenAI GPT-4/3.5                │
│  - Anthropic Claude                │
│  - Local LLMs (Ollama)             │
│  - Google Gemini                   │
└────────────────────────────────────┘
     ↓
  Answer
```

## Quick Start

### 1. Install LLM SDK

```bash
# For OpenAI
npm install openai

# For Anthropic Claude
npm install @anthropic-ai/sdk

# For Google Gemini
npm install @google/generative-ai
```

### 2. Basic Integration

```typescript
import { Retriever, createVectorStore } from 'literag';
import OpenAI from 'openai';

// Setup retrieval
const retriever = new Retriever({ vectorStore, topK: 5 });

// Setup LLM
const llm = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// RAG Query
async function askQuestion(question: string) {
  // 1. Retrieve context
  const results = await retriever.retrieve(question);
  const context = results.map(r => r.document.content).join('\n\n');
  
  // 2. Generate answer with LLM
  const completion = await llm.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{
      role: 'user',
      content: `Context: ${context}\n\nQuestion: ${question}\n\nAnswer based on the context:`
    }]
  });
  
  return completion.choices[0].message.content;
}
```

## Supported LLMs

### 1. OpenAI (GPT-4, GPT-3.5)

```typescript
import OpenAI from 'openai';

const llm = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await llm.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.7,
});
```

**Pros:** Best quality, fast, reliable  
**Cons:** Requires API key, costs money

### 2. Anthropic Claude

```typescript
import Anthropic from '@anthropic-ai/sdk';

const llm = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await llm.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }],
});
```

**Pros:** Long context window (200k tokens), good reasoning  
**Cons:** Requires API key, costs money

### 3. Local LLMs (Ollama)

```typescript
// Install: curl https://ollama.ai/install.sh | sh
// Run: ollama run llama2

async function queryOllama(prompt: string) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama2',
      prompt: prompt,
      stream: false,
    }),
  });
  
  const data = await response.json();
  return data.response;
}
```

**Pros:** Free, private, runs offline  
**Cons:** Slower, requires good hardware, lower quality

### 4. Google Gemini

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const result = await model.generateContent(prompt);
const response = result.response.text();
```

**Pros:** Free tier available, good quality  
**Cons:** Requires API key

## Complete Example

See [examples/rag-with-llm.ts](file:///Users/dhineshkumar/Documents/littleRag/examples/rag-with-llm.ts) for a full working example.

### Run the Example

```bash
# Set your OpenAI API key
export OPENAI_API_KEY="your-key-here"

# Run the example
npx ts-node examples/rag-with-llm.ts
```

## Best Practices

### 1. Prompt Engineering

```typescript
const prompt = `You are a helpful assistant. Answer based on the context below.

Context:
${context}

Question: ${question}

Instructions:
- Only use information from the context
- If unsure, say "I don't have enough information"
- Cite sources using [1], [2], etc.
- Be concise and accurate

Answer:`;
```

### 2. Context Window Management

```typescript
// Limit context to fit in LLM's window
const MAX_CONTEXT_LENGTH = 3000; // characters

let context = results.map(r => r.document.content).join('\n\n');
if (context.length > MAX_CONTEXT_LENGTH) {
  context = context.substring(0, MAX_CONTEXT_LENGTH) + '...';
}
```

### 3. Streaming Responses

```typescript
// For better UX, stream the LLM response
const stream = await llm.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: prompt }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### 4. Error Handling

```typescript
async function safeRAGQuery(question: string) {
  try {
    // Retrieve
    const results = await retriever.retrieve(question);
    
    if (results.length === 0) {
      return "I don't have any information about that.";
    }
    
    // Generate
    const context = results.map(r => r.document.content).join('\n\n');
    const answer = await generateWithLLM(context, question);
    
    return answer;
  } catch (error) {
    console.error('RAG error:', error);
    return "Sorry, I encountered an error processing your question.";
  }
}
```

## Cost Optimization

### 1. Cache LLM Responses

```typescript
import { InMemoryCache } from 'literag';

const llmCache = new InMemoryCache<string>();

async function cachedQuery(question: string) {
  // Check cache first
  const cached = await llmCache.get(question);
  if (cached) return cached;
  
  // Generate if not cached
  const answer = await ragQuery(question);
  await llmCache.set(question, answer, 3600); // 1 hour TTL
  
  return answer;
}
```

### 2. Use Cheaper Models for Simple Queries

```typescript
async function smartModelSelection(question: string, context: string) {
  const isComplex = question.length > 100 || context.length > 2000;
  
  const model = isComplex ? 'gpt-4' : 'gpt-3.5-turbo';
  
  return await llm.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
  });
}
```

## Next Steps

1. **Try the example**: Run `npx ts-node examples/rag-with-llm.ts`
2. **Experiment with prompts**: Adjust the prompt template for your use case
3. **Add streaming**: Implement streaming for better UX
4. **Deploy**: Use the API server with LLM integration

## Resources

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic Claude Docs](https://docs.anthropic.com)
- [Ollama](https://ollama.ai)
- [Google Gemini](https://ai.google.dev)
