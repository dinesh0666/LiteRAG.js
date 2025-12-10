import {
    RecursiveCharacterTextSplitter,
    MockEmbeddingModel,
    KeywordReranker,
} from '../src/index';

/**
 * Complete RAG Pipeline with Ollama (Local LLM)
 * 
 * This example shows how to use LiteRAG.js with Ollama for a completely
 * local, private RAG system that runs on your machine.
 * 
 * Setup:
 * 1. Install Ollama: https://ollama.ai
 * 2. Pull a model: ollama pull llama2
 * 3. Run this script: npx ts-node examples/rag-with-ollama.ts
 * 
 * No API keys needed! Everything runs locally.
 */

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
}

/**
 * Ollama Client
 */
class OllamaClient {
    private baseUrl: string;
    private model: string;

    constructor(model: string = 'llama2', baseUrl: string = 'http://localhost:11434') {
        this.baseUrl = baseUrl;
        this.model = model;
    }

    /**
     * Generate a response (non-streaming)
     */
    async generate(prompt: string, options?: { temperature?: number }): Promise<string> {
        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: options?.temperature || 0.7,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json() as any;
        return data.response;
    }

    /**
     * Generate a response with streaming
     */
    async *generateStream(prompt: string): AsyncGenerator<string> {
        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt: prompt,
                stream: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter((line) => line.trim());

            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.response) {
                        yield data.response;
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }
    }

    /**
     * Check if Ollama is running and model is available
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) return false;

            const data = await response.json() as any;
            const models = data.models || [];
            return models.some((m: any) => m.name.includes(this.model));
        } catch (error) {
            return false;
        }
    }
}

/**
 * RAG Pipeline with Ollama
 */
class OllamaRAGPipeline {
    private vectorStore: SimpleInMemoryVectorStore;
    private textSplitter: RecursiveCharacterTextSplitter;
    private reranker: KeywordReranker;
    private llm: OllamaClient;

    constructor(model: string = 'llama2') {
        const embeddingModel = new MockEmbeddingModel(384);
        this.vectorStore = new SimpleInMemoryVectorStore(embeddingModel);
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 50,
        });
        this.reranker = new KeywordReranker();
        this.llm = new OllamaClient(model);
    }

    /**
     * Ingest documents into the knowledge base
     */
    async ingestDocuments(documents: Array<{ content: string; metadata?: any }>) {
        for (const doc of documents) {
            const chunks = this.textSplitter.splitText(doc.content);
            const chunkDocs = chunks.map((chunk, idx) => ({
                content: chunk,
                metadata: { ...doc.metadata, chunkIndex: idx },
            }));
            await this.vectorStore.addDocuments(chunkDocs);
        }
        console.log(`✅ Ingested ${documents.length} documents`);
    }

    /**
     * Query the RAG system (non-streaming)
     */
    async query(question: string, options?: { topK?: number; temperature?: number }) {
        const topK = options?.topK || 5;

        console.log(`\n🔍 Query: "${question}"`);
        console.log('─'.repeat(60));

        // Step 1: Retrieve
        console.log('📚 Retrieving relevant documents...');
        let results = await this.vectorStore.search(question, topK);

        // Step 2: Re-rank
        console.log('🎯 Re-ranking results...');
        const rerankedResults = await this.reranker.rerank(
            question,
            results.map((r) => ({
                document: {
                    id: r.document.id,
                    content: r.document.content,
                    metadata: r.document.metadata,
                },
                score: r.score,
            }))
        );

        // Step 3: Build context
        const context = rerankedResults
            .slice(0, 3)
            .map((r, idx) => `[${idx + 1}] ${r.document.content}`)
            .join('\n\n');

        console.log(`✅ Retrieved ${rerankedResults.length} relevant chunks\n`);

        // Step 4: Generate with Ollama
        console.log('🤖 Generating answer with Ollama (this may take a moment)...');
        const prompt = this.buildPrompt(question, context);

        const answer = await this.llm.generate(prompt, { temperature: options?.temperature });

        console.log('\n💬 Answer:');
        console.log('─'.repeat(60));
        console.log(answer);
        console.log('─'.repeat(60));

        return {
            question,
            answer,
            sources: rerankedResults.slice(0, 3).map((r) => ({
                content: r.document.content,
                score: r.score,
                metadata: r.document.metadata,
            })),
        };
    }

    /**
     * Query with streaming response
     */
    async queryStream(question: string, options?: { topK?: number }) {
        const topK = options?.topK || 5;

        console.log(`\n🔍 Query: "${question}"`);
        console.log('─'.repeat(60));

        // Retrieve and re-rank
        console.log('📚 Retrieving and re-ranking...');
        let results = await this.vectorStore.search(question, topK);
        const rerankedResults = await this.reranker.rerank(
            question,
            results.map((r) => ({
                document: {
                    id: r.document.id,
                    content: r.document.content,
                    metadata: r.document.metadata,
                },
                score: r.score,
            }))
        );

        const context = rerankedResults
            .slice(0, 3)
            .map((r, idx) => `[${idx + 1}] ${r.document.content}`)
            .join('\n\n');

        console.log('✅ Done!\n');
        console.log('🤖 Generating answer (streaming)...');
        console.log('─'.repeat(60));

        const prompt = this.buildPrompt(question, context);

        // Stream the response
        for await (const chunk of this.llm.generateStream(prompt)) {
            process.stdout.write(chunk);
        }

        console.log('\n' + '─'.repeat(60));
    }

    /**
     * Build the prompt for Ollama
     */
    private buildPrompt(question: string, context: string): string {
        return `You are a helpful assistant. Answer the question based on the context provided below.

Context:
${context}

Question: ${question}

Instructions:
- Answer based ONLY on the context provided
- If the context doesn't contain enough information, say "I don't have enough information to answer that"
- Be concise and accurate
- Cite which source you're using (e.g., "According to [1]...")

Answer:`;
    }

    /**
     * Check if Ollama is ready
     */
    async checkOllama(): Promise<boolean> {
        return await this.llm.checkHealth();
    }
}

/**
 * Example usage
 */
async function main() {
    console.log('🚀 LiteRAG.js + Ollama (Local LLM) Demo');
    console.log('═'.repeat(60));
    console.log('🔒 100% Local & Private - No API keys needed!\n');

    // Initialize RAG pipeline
    const model = process.env.OLLAMA_MODEL || 'llama2';
    console.log(`📦 Using Ollama model: ${model}`);

    const rag = new OllamaRAGPipeline(model);

    // Check if Ollama is running
    console.log('🔍 Checking Ollama status...');
    const isReady = await rag.checkOllama();

    if (!isReady) {
        console.error('\n❌ Ollama is not running or model not found!');
        console.log('\nTo fix this:');
        console.log('1. Install Ollama: https://ollama.ai');
        console.log('2. Pull a model: ollama pull llama2');
        console.log('3. Verify it\'s running: ollama list');
        console.log('4. Run this script again\n');
        console.log('Available models: llama2, mistral, codellama, phi, etc.');
        console.log('See all models: https://ollama.ai/library\n');
        process.exit(1);
    }

    console.log('✅ Ollama is ready!\n');

    // Ingest sample documents
    console.log('📚 Ingesting knowledge base...');
    await rag.ingestDocuments([
        {
            content: `Retrieval-Augmented Generation (RAG) is a technique that enhances large language 
      models by retrieving relevant information from external knowledge bases. The process works 
      in three steps: 1) User asks a question, 2) System retrieves relevant documents using 
      vector similarity search, 3) LLM generates an answer using the retrieved context. This 
      approach reduces hallucinations and allows LLMs to access up-to-date information.`,
            metadata: { source: 'rag_guide.txt', topic: 'RAG' },
        },
        {
            content: `LiteRAG.js is a lightweight RAG framework for Node.js and TypeScript. It provides 
      support for multiple vector stores including Qdrant, OpenSearch, and Elasticsearch. Key 
      features include smart text chunking with recursive and fixed-size splitters, hybrid 
      re-ranking with keyword and RRF algorithms, and lightning-fast caching. The framework 
      achieves sub-100ms vector search and end-to-end RAG queries in under 200ms.`,
            metadata: { source: 'literag_docs.txt', topic: 'LiteRAG.js' },
        },
        {
            content: `Ollama is a tool that allows you to run large language models locally on your 
      machine. It supports models like Llama 2, Mistral, Code Llama, and many others. Ollama 
      makes it easy to run LLMs without needing API keys or internet connection. It's perfect 
      for privacy-sensitive applications and development. Models run entirely on your hardware, 
      keeping your data private.`,
            metadata: { source: 'ollama_info.txt', topic: 'Ollama' },
        },
    ]);

    console.log('\n' + '═'.repeat(60));
    console.log('Demo 1: Regular Query (wait for complete response)');
    console.log('═'.repeat(60));

    await rag.query('What is RAG and how does it work?');

    console.log('\n' + '═'.repeat(60));
    console.log('Demo 2: Streaming Query (see response as it generates)');
    console.log('═'.repeat(60));

    await rag.queryStream('What are the key features of LiteRAG.js?');

    console.log('\n' + '═'.repeat(60));
    console.log('Demo 3: Another Query');
    console.log('═'.repeat(60));

    await rag.queryStream('Tell me about Ollama');

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Demo complete!\n');
    console.log('💡 Benefits of using Ollama:');
    console.log('   • 100% private - data never leaves your machine');
    console.log('   • No API costs - completely free');
    console.log('   • Works offline - no internet needed');
    console.log('   • Fast - runs on your local hardware\n');
}

// Run if executed directly
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

export { OllamaRAGPipeline, OllamaClient };
