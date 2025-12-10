# Testing Llama 3.2 with LiteRAG.js

## Current Status

⏳ **Downloading Llama 3.2** (2GB) - This will take about 20-30 minutes depending on your internet speed.

## What We'll Test

Once the download completes, we'll run:

```bash
OLLAMA_MODEL=llama3.2 npx ts-node examples/rag-with-ollama.ts
```

## Llama 3.2 vs Gemma 3

| Feature | Llama 3.2 | Gemma 3:4b |
|---------|-----------|------------|
| **Size** | 2.0 GB | 3.3 GB |
| **Speed** | ⚡⚡⚡ Very Fast | ⚡⚡ Fast |
| **Quality** | 🌟🌟🌟🌟 Excellent | 🌟🌟🌟 Good |
| **Context** | 128k tokens | 8k tokens |
| **Best For** | General tasks, chat | Quick responses |

## What to Expect

The RAG pipeline will:
1. ✅ Check Llama 3.2 is available
2. ✅ Ingest sample documents
3. ✅ Run 3 demo queries:
   - "What is RAG and how does it work?"
   - "What are the key features of LiteRAG.js?"
   - "Tell me about Ollama"
4. ✅ Show both regular and streaming responses

## Alternative: Use Smaller Model

If you want to test immediately with a smaller model:

```bash
# Pull phi (only 1.6GB, very fast)
ollama pull phi

# Test with phi
OLLAMA_MODEL=phi npx ts-node examples/rag-with-ollama.ts
```

## Monitor Download Progress

Check the download status:
```bash
ollama list
```

## After Download

Once complete, you'll see:
```
NAME          ID              SIZE      MODIFIED
llama3.2      a80c4f17acd5    2.0 GB    X seconds ago
```

Then we can run the test!
