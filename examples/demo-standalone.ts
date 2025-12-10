import express from 'express';
import {
    RecursiveCharacterTextSplitter,
    MockEmbeddingModel,
    KeywordReranker,
} from '../src/index';

/**
 * Interactive Web Demo - No Docker Required!
 * Uses in-memory vector store instead of Qdrant
 */

const app = express();
const PORT = 8080;

app.use(express.json());

// In-memory vector store
interface Document {
    id: string;
    content: string;
    metadata?: any;
    embedding?: number[];
}

class SimpleInMemoryVectorStore {
    private documents: Document[] = [];
    private embeddingModel: MockEmbeddingModel;

    constructor(embeddingModel: MockEmbeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    async addDocuments(docs: Array<{ content: string; metadata?: any }>) {
        for (const doc of docs) {
            const embedding = await this.embeddingModel.embedText(doc.content);
            this.documents.push({
                id: `doc_${this.documents.length}`,
                content: doc.content,
                metadata: doc.metadata,
                embedding,
            });
        }
    }

    async search(query: string, k: number = 5) {
        const queryEmbedding = await this.embeddingModel.embedText(query);

        const results = this.documents.map((doc) => {
            const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding!);
            return { document: doc, score: similarity };
        });

        return results.sort((a, b) => b.score - a.score).slice(0, k);
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    clear() {
        this.documents = [];
    }
}

// Initialize components
const embeddingModel = new MockEmbeddingModel(384);
const vectorStore = new SimpleInMemoryVectorStore(embeddingModel);
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
});
const reranker = new KeywordReranker();

// Serve the demo page
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LiteRAG.js - Interactive Demo (No Docker!)</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container { max-width: 1200px; margin: 0 auto; }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            margin-top: 10px;
        }
        
        .demo-container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        
        textarea {
            width: 100%;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 14px;
            font-family: inherit;
            resize: vertical;
            transition: border-color 0.3s;
        }
        
        textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 10px;
            flex-wrap: wrap;
        }
        
        button {
            padding: 10px 25px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        button:active { transform: translateY(0); }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .result-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 12px;
            border-left: 4px solid #667eea;
        }
        
        .result-score {
            color: #667eea;
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 0.9em;
        }
        
        .result-content {
            color: #333;
            line-height: 1.5;
            font-size: 0.95em;
        }
        
        .status {
            padding: 10px 15px;
            border-radius: 8px;
            margin-top: 10px;
            font-size: 0.9em;
        }
        
        .status.success { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
        .status.info { background: #d1ecf1; color: #0c5460; }
        
        .info-box {
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            border-left: 4px solid #667eea;
        }
        
        .info-box strong { color: #667eea; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 LiteRAG.js</h1>
            <p>Interactive RAG Demo</p>
            <div class="badge">✨ No Docker Required - Runs In-Memory!</div>
        </div>
        
        <div class="demo-container">
            <div class="info-box">
                <strong>💡 How it works:</strong> This demo uses an in-memory vector store instead of Qdrant/OpenSearch. 
                Perfect for testing without Docker! For production, use a real vector database for better performance.
            </div>
            
            <div class="section">
                <h2>📝 Step 1: Ingest Documents</h2>
                <textarea id="ingestText" rows="5" placeholder="Paste your document content here..."></textarea>
                <div class="button-group">
                    <button onclick="ingestDocument()">Ingest Document</button>
                    <button onclick="loadSampleData()">Load Sample Data</button>
                    <button onclick="clearData()">Clear All Data</button>
                </div>
                <div id="ingestStatus"></div>
            </div>
            
            <div class="section">
                <h2>🔍 Step 2: Query Knowledge Base</h2>
                <textarea id="queryText" rows="2" placeholder="Enter your search query..."></textarea>
                <div class="button-group">
                    <button onclick="queryKnowledge()">Search</button>
                </div>
                <div id="queryStatus"></div>
            </div>
            
            <div class="section">
                <h2>📊 Results</h2>
                <div id="results"></div>
            </div>
        </div>
    </div>
    
    <script>
        const API_URL = 'http://localhost:${PORT}';
        
        async function ingestDocument() {
            const text = document.getElementById('ingestText').value;
            const statusDiv = document.getElementById('ingestStatus');
            
            if (!text.trim()) {
                showStatus(statusDiv, 'Please enter some text to ingest', 'error');
                return;
            }
            
            showStatus(statusDiv, 'Ingesting document...', 'info');
            
            try {
                const response = await fetch(\`\${API_URL}/ingest\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: text, metadata: { source: 'demo' } })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showStatus(statusDiv, \`✅ \${data.message}\`, 'success');
                } else {
                    showStatus(statusDiv, \`❌ Error: \${data.error}\`, 'error');
                }
            } catch (error) {
                showStatus(statusDiv, \`❌ Error: \${error.message}\`, 'error');
            }
        }
        
        async function queryKnowledge() {
            const query = document.getElementById('queryText').value;
            const statusDiv = document.getElementById('queryStatus');
            const resultsDiv = document.getElementById('results');
            
            if (!query.trim()) {
                showStatus(statusDiv, 'Please enter a search query', 'error');
                return;
            }
            
            showStatus(statusDiv, 'Searching...', 'info');
            resultsDiv.innerHTML = '';
            
            try {
                const response = await fetch(\`\${API_URL}/query\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, k: 5 })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showStatus(statusDiv, \`✅ Found \${data.results.length} results\`, 'success');
                    displayResults(data.results);
                } else {
                    showStatus(statusDiv, \`❌ Error: \${data.error}\`, 'error');
                }
            } catch (error) {
                showStatus(statusDiv, \`❌ Error: \${error.message}\`, 'error');
            }
        }
        
        async function clearData() {
            const statusDiv = document.getElementById('ingestStatus');
            try {
                const response = await fetch(\`\${API_URL}/clear\`, { method: 'POST' });
                const data = await response.json();
                showStatus(statusDiv, \`✅ \${data.message}\`, 'success');
                document.getElementById('results').innerHTML = '';
            } catch (error) {
                showStatus(statusDiv, \`❌ Error: \${error.message}\`, 'error');
            }
        }
        
        function loadSampleData() {
            document.getElementById('ingestText').value = \`Retrieval-Augmented Generation (RAG) is a powerful technique that combines large language models with external knowledge retrieval. It works by first retrieving relevant documents from a knowledge base using vector similarity search, then using those documents as context for the language model to generate accurate responses.

Vector databases are specialized databases designed to store and query high-dimensional vectors efficiently. Popular vector databases include Qdrant, Pinecone, Weaviate, and OpenSearch with KNN plugin.

LiteRAG.js is a lightweight RAG framework for Node.js and TypeScript with support for multiple vector stores, smart chunking, and hybrid re-ranking.\`;
            
            document.getElementById('queryText').value = 'What is RAG?';
        }
        
        function displayResults(results) {
            const resultsDiv = document.getElementById('results');
            
            if (results.length === 0) {
                resultsDiv.innerHTML = '<p style="color: #666;">No results found. Try ingesting some documents first.</p>';
                return;
            }
            
            resultsDiv.innerHTML = results.map((result, idx) => \`
                <div class="result-item">
                    <div class="result-score">Result #\${idx + 1} - Score: \${result.score.toFixed(4)}</div>
                    <div class="result-content">\${result.content}</div>
                </div>
            \`).join('');
        }
        
        function showStatus(div, message, type) {
            div.innerHTML = \`<div class="status \${type}">\${message}</div>\`;
        }
        
        window.addEventListener('load', () => {
            loadSampleData();
        });
    </script>
</body>
</html>
  `);
});

// API endpoints
app.post('/ingest', async (req, res) => {
    try {
        const { content, metadata } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const chunks = textSplitter.splitText(content);
        const chunkDocs = chunks.map((chunk, idx) => ({
            content: chunk,
            metadata: { ...metadata, chunkIndex: idx, totalChunks: chunks.length },
        }));

        await vectorStore.addDocuments(chunkDocs);

        res.json({
            success: true,
            message: `Ingested ${chunks.length} chunks successfully`,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/query', async (req, res) => {
    try {
        const { query, k = 5 } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        let results = await vectorStore.search(query, k);

        // Re-rank
        const rerankedResults = await reranker.rerank(
            query,
            results.map((r) => ({
                document: {
                    id: r.document.id,
                    content: r.document.content,
                    metadata: r.document.metadata,
                },
                score: r.score,
            }))
        );

        res.json({
            query,
            results: rerankedResults.map((r) => ({
                content: r.document.content,
                metadata: r.document.metadata,
                score: r.score,
            })),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/clear', (req, res) => {
    vectorStore.clear();
    res.json({ success: true, message: 'All data cleared' });
});

app.listen(PORT, () => {
    console.log(`\n🎬 LiteRAG.js Interactive Demo (No Docker Required!)`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\n📱 Open your browser to: http://localhost:${PORT}`);
    console.log(`\n✨ This demo runs entirely in-memory - no vector database needed!`);
    console.log(`   Perfect for testing without Docker.\n`);
});
