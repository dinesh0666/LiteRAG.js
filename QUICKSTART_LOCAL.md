# LiteRAG.js - Quick Start Guide

## 🚀 Your Local RAG System is Ready!

You have a **fully functional, private RAG system** running on your machine with:
- ✅ **LiteRAG.js** - Retrieval framework
- ✅ **Gemma 3:4b** - Local LLM (via Ollama)
- ✅ **No API keys needed** - 100% private & free

---

## 📋 Quick Commands

### 1. Run the Complete RAG Demo (with LLM)

```bash
cd /Users/dhineshkumar/Documents/littleRag

# Run with Gemma
OLLAMA_MODEL=gemma3:4b npx ts-node examples/rag-with-ollama.ts
```

**What it does:**
- Ingests sample documents
- Answers 3 questions using RAG
- Shows both regular and streaming responses

### 2. Run the Interactive Web Demo (No LLM)

```bash
# Start the web UI
npx ts-node examples/demo-standalone.ts

# Open http://localhost:8080 in your browser
```

**Features:**
- Beautiful web interface
- Ingest documents via UI
- Query and see results
- No vector database needed (in-memory)

### 3. Run Simple Console Demo (No LLM)

```bash
# Quick retrieval demo
npx ts-node examples/demo-no-docker.ts
```

**What it does:**
- Shows retrieval and re-ranking
- No LLM generation
- Fastest to run

---

## 🎯 Use Cases

### Build Your Own Knowledge Base

```typescript
import { OllamaRAGPipeline } from './examples/rag-with-ollama';

const rag = new OllamaRAGPipeline('gemma3:4b');

// Add your documents
await rag.ingestDocuments([
  {
    content: 'Your company documentation...',
    metadata: { source: 'company_docs.txt' }
  }
]);

// Ask questions
const result = await rag.query('How do I...?');
console.log(result.answer);
```

### Query with Streaming

```typescript
// See the answer as it's generated
await rag.queryStream('Your question here?');
```

---

## 📊 What You Have

| Component | Status | Details |
|-----------|--------|---------|
| **LiteRAG.js** | ✅ Installed | Retrieval framework |
| **Gemma 3:4b** | ✅ Ready | Local LLM (3.3GB) |
| **Ollama** | ✅ Running | LLM runtime |
| **Examples** | ✅ Working | 4 demo scripts |
| **Tests** | ✅ Passing | 18 unit tests |

---

## 🔧 Available Models

You currently have:
```bash
ollama list
# NAME         SIZE
# gemma3:4b    3.3 GB
```

To add more models:
```bash
ollama pull llama3.2    # 2.0 GB - Excellent quality
ollama pull phi         # 1.6 GB - Fast & lightweight
ollama pull mistral     # 4.1 GB - Very good quality
```

---

## 📁 Project Structure

```
littleRag/
├── examples/
│   ├── rag-with-ollama.ts      ← Full RAG with Gemma
│   ├── demo-standalone.ts      ← Web UI demo
│   ├── demo-no-docker.ts       ← Console demo
│   ├── basic.ts                ← Basic retrieval
│   └── benchmarks.ts           ← Performance tests
├── src/
│   ├── core/                   ← Core types & cache
│   ├── vector-store/           ← Qdrant & OpenSearch
│   ├── ingestion/              ← Text chunking
│   ├── retrieval/              ← Search & re-ranking
│   └── api/                    ← REST API server
└── docs/
    └── LLM_INTEGRATION.md      ← Integration guide
```

---

## 🎓 Next Steps

### 1. **Customize for Your Use Case**

Edit `examples/rag-with-ollama.ts`:
- Replace sample documents with your data
- Adjust chunk size (currently 500 chars)
- Change number of results (currently top 3)

### 2. **Build a Web App**

Combine the web demo with Ollama:
- Use `demo-standalone.ts` as base
- Add Ollama integration from `rag-with-ollama.ts`
- Deploy locally or on your server

### 3. **Connect to Real Vector DB**

For production, use Qdrant or OpenSearch:
```bash
# Start Qdrant
docker run -p 6333:6333 qdrant/qdrant

# Update code to use Qdrant instead of in-memory
```

### 4. **Add More Documents**

```typescript
// Ingest from files
await rag.ingestDocuments([
  {
    content: fs.readFileSync('doc1.txt', 'utf-8'),
    metadata: { source: 'doc1.txt' }
  }
]);
```

---

## 💡 Pro Tips

### Faster Responses
- Use smaller models (phi) for quick tasks
- Reduce `topK` to 3 instead of 5
- Enable caching for repeated queries

### Better Quality
- Use larger models (llama3.2, mistral)
- Increase `topK` to get more context
- Adjust temperature (0.7 = balanced, 0.3 = focused)

### Privacy & Cost
- ✅ Everything runs locally
- ✅ No data sent to cloud
- ✅ No API costs
- ✅ Works offline

---

## 🐛 Troubleshooting

### Ollama not responding?
```bash
# Check if Ollama is running
ollama list

# Restart Ollama if needed
# (Close and reopen Ollama app)
```

### Model not found?
```bash
# List available models
ollama list

# Pull the model
ollama pull gemma3:4b
```

### Out of memory?
- Use smaller model (phi instead of gemma)
- Reduce chunk size
- Process fewer documents at once

---

## 📚 Resources

- **GitHub Repo**: https://github.com/dinesh0666/LiteRAG.js
- **Ollama Models**: https://ollama.ai/library
- **LLM Integration Guide**: `docs/LLM_INTEGRATION.md`

---

## ✨ You're All Set!

Your local RAG system is ready to use. Try running:

```bash
OLLAMA_MODEL=gemma3:4b npx ts-node examples/rag-with-ollama.ts
```

Enjoy your private, free RAG system! 🎉
