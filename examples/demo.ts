import express from 'express';
import path from 'path';

/**
 * Interactive Web Demo for LiteRAG.js
 * A simple UI to demonstrate RAG capabilities
 */

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.static('public'));

// Serve the demo page
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LiteRAG.js - Interactive Demo</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .demo-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5em;
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
            margin-top: 15px;
        }
        
        button {
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        button:active {
            transform: translateY(0);
        }
        
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .results {
            margin-top: 20px;
        }
        
        .result-item {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
        }
        
        .result-score {
            color: #667eea;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .result-content {
            color: #333;
            line-height: 1.6;
        }
        
        .status {
            padding: 10px 20px;
            border-radius: 8px;
            margin-top: 15px;
            font-weight: 500;
        }
        
        .status.success {
            background: #d4edda;
            color: #155724;
        }
        
        .status.error {
            background: #f8d7da;
            color: #721c24;
        }
        
        .status.info {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .feature {
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        
        .feature h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 LiteRAG.js</h1>
            <p>Interactive Retrieval-Augmented Generation Demo</p>
        </div>
        
        <div class="demo-container">
            <!-- Ingest Section -->
            <div class="section">
                <h2>📝 Step 1: Ingest Documents</h2>
                <textarea id="ingestText" rows="6" placeholder="Paste your document content here...

Example:
Retrieval-Augmented Generation (RAG) combines large language models with external knowledge retrieval. It retrieves relevant documents from a knowledge base and uses them as context for generating accurate responses."></textarea>
                <div class="button-group">
                    <button onclick="ingestDocument()">Ingest Document</button>
                    <button onclick="loadSampleData()">Load Sample Data</button>
                </div>
                <div id="ingestStatus"></div>
            </div>
            
            <!-- Query Section -->
            <div class="section">
                <h2>🔍 Step 2: Query Knowledge Base</h2>
                <textarea id="queryText" rows="3" placeholder="Enter your search query...

Example: What is RAG?"></textarea>
                <div class="button-group">
                    <button onclick="queryKnowledge()">Search</button>
                </div>
                <div id="queryStatus"></div>
            </div>
            
            <!-- Results Section -->
            <div class="section">
                <h2>📊 Results</h2>
                <div id="results"></div>
            </div>
            
            <!-- Features -->
            <div class="features">
                <div class="feature">
                    <h3>⚡ Fast</h3>
                    <p>Vector similarity search in milliseconds</p>
                </div>
                <div class="feature">
                    <h3>🔧 Configurable</h3>
                    <p>Swap vector stores, chunking strategies, re-rankers</p>
                </div>
                <div class="feature">
                    <h3>📦 Lightweight</h3>
                    <p>Minimal dependencies, focused on core RAG</p>
                </div>
                <div class="feature">
                    <h3>🎯 Production-Ready</h3>
                    <p>Caching, error handling, TypeScript</p>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const API_URL = 'http://localhost:3000';
        
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
                    body: JSON.stringify({
                        content: text,
                        metadata: { source: 'demo', timestamp: new Date().toISOString() }
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showStatus(statusDiv, '✅ Document ingested successfully!', 'success');
                } else {
                    showStatus(statusDiv, \`❌ Error: \${data.error}\`, 'error');
                }
            } catch (error) {
                showStatus(statusDiv, \`❌ Error: \${error.message}. Make sure the API server is running on port 3000.\`, 'error');
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
                showStatus(statusDiv, \`❌ Error: \${error.message}. Make sure the API server is running on port 3000.\`, 'error');
            }
        }
        
        function loadSampleData() {
            document.getElementById('ingestText').value = \`Retrieval-Augmented Generation (RAG) is a technique that combines the power of large language models with external knowledge retrieval. It works by first retrieving relevant documents from a knowledge base, then using those documents as context for the language model to generate more accurate and informed responses.

Vector databases are specialized databases designed to store and query high-dimensional vectors efficiently. They use techniques like approximate nearest neighbor (ANN) search to quickly find similar vectors. Popular vector databases include Qdrant, Pinecone, Weaviate, and OpenSearch with KNN plugin.

Text chunking is an important preprocessing step in RAG systems. It involves breaking down large documents into smaller, manageable pieces. Common strategies include fixed-size chunking, recursive character splitting, and semantic chunking.\`;
            
            document.getElementById('queryText').value = 'What is RAG and how does it work?';
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
        
        // Load sample data on page load
        window.addEventListener('load', () => {
            loadSampleData();
        });
    </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
    console.log(`\n🎬 LiteRAG.js Interactive Demo`);
    console.log(`================================`);
    console.log(`\n📱 Open your browser to: http://localhost:${PORT}`);
    console.log(`\n⚠️  Make sure the API server is running on port 3000`);
    console.log(`   Run: npx ts-node examples/server.ts\n`);
});
