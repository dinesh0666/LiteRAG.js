import OpenAI from 'openai';
import {
    RecursiveCharacterTextSplitter,
    MockEmbeddingModel,
    KeywordReranker,
} from '../src/index';

/**
 * Complete RAG Pipeline with LLM Integration
 * 
 * This example shows how to integrate LiteRAG.js with an LLM (OpenAI)
 * to create a full Retrieval-Augmented Generation system.
 * 
 * Setup:
 * 1. npm install openai
 * 2. Set OPENAI_API_KEY environment variable
 */

// In-memory vector store (same as demo)
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
 * RAG Pipeline Class
 * Combines retrieval with LLM generation
 */
class RAGPipeline {
    private vectorStore: SimpleInMemoryVectorStore;
    private textSplitter: RecursiveCharacterTextSplitter;
    private reranker: KeywordReranker;
    private llm: OpenAI;

    constructor(openaiApiKey: string) {
        const embeddingModel = new MockEmbeddingModel(384);
        this.vectorStore = new SimpleInMemoryVectorStore(embeddingModel);
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 50,
        });
        this.reranker = new KeywordReranker();
        this.llm = new OpenAI({ apiKey: openaiApiKey });
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
     * Query the RAG system
     * 1. Retrieve relevant documents
     * 2. Re-rank results
     * 3. Generate answer using LLM with context
     */
    async query(question: string, options?: { topK?: number; temperature?: number }) {
        const topK = options?.topK || 5;
        const temperature = options?.temperature || 0.7;

        console.log(`\n🔍 Query: "${question}"`);
        console.log('─'.repeat(60));

        // Step 1: Retrieve relevant documents
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

        // Step 3: Build context from top results
        const context = rerankedResults
            .slice(0, 3) // Use top 3 results
            .map((r, idx) => `[${idx + 1}] ${r.document.content}`)
            .join('\n\n');

        console.log(`✅ Retrieved ${rerankedResults.length} relevant chunks\n`);

        // Step 4: Generate answer using LLM
        console.log('🤖 Generating answer with LLM...');
        const prompt = this.buildPrompt(question, context);

        const completion = await this.llm.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature,
            max_tokens: 500,
        });

        const answer = completion.choices[0].message.content;

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
     * Build the prompt for the LLM
     */
    private buildPrompt(question: string, context: string): string {
        return `You are a helpful assistant. Answer the question based on the context provided below.

Context:
${context}

Question: ${question}

Instructions:
- Answer based on the context provided
- If the context doesn't contain enough information, say so
- Be concise and accurate
- Cite which source number you're using (e.g., "According to [1]...")

Answer:`;
    }
}

/**
 * Example usage
 */
async function main() {
    console.log('🚀 LiteRAG.js + LLM Integration Demo');
    console.log('═'.repeat(60));

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('\n❌ Error: OPENAI_API_KEY environment variable not set');
        console.log('\nTo use this demo:');
        console.log('1. Get an API key from https://platform.openai.com/api-keys');
        console.log('2. Set it: export OPENAI_API_KEY="your-key-here"');
        console.log('3. Run this script again\n');
        process.exit(1);
    }

    // Initialize RAG pipeline
    const rag = new RAGPipeline(apiKey);

    // Ingest sample documents
    console.log('\n📚 Ingesting knowledge base...');
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
            content: `Vector embeddings are numerical representations of text that capture semantic 
      meaning. Similar texts have similar embeddings, allowing for semantic search. Common 
      embedding models include OpenAI's text-embedding-ada-002, sentence-transformers from 
      HuggingFace, and Cohere embeddings. Embeddings typically have 384 to 1536 dimensions.`,
            metadata: { source: 'embeddings.txt', topic: 'Embeddings' },
        },
    ]);

    // Example queries
    const questions = [
        'What is RAG and how does it work?',
        'What are the key features of LiteRAG.js?',
        'Explain vector embeddings',
    ];

    for (const question of questions) {
        await rag.query(question);
        console.log('\n');
    }

    console.log('═'.repeat(60));
    console.log('✅ Demo complete!\n');
}

// Run if executed directly
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

export { RAGPipeline };
