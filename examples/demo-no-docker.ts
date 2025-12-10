import {
    RecursiveCharacterTextSplitter,
    MockEmbeddingModel,
    InMemoryCache,
    KeywordReranker,
} from '../src/index';

/**
 * Simple in-memory RAG demo (no vector database required)
 * Perfect for testing without Docker
 */

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
        console.log(`✅ Added ${docs.length} documents to in-memory store`);
    }

    async search(query: string, k: number = 5) {
        const queryEmbedding = await this.embeddingModel.embedText(query);

        // Calculate cosine similarity
        const results = this.documents.map((doc) => {
            const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding!);
            return {
                document: doc,
                score: similarity,
            };
        });

        // Sort by score and return top k
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

async function main() {
    console.log('🚀 LiteRAG.js - In-Memory Demo (No Docker Required!)');
    console.log('═'.repeat(60));
    console.log('');

    // 1. Setup
    console.log('📦 Setting up components...');
    const embeddingModel = new MockEmbeddingModel(384);
    const vectorStore = new SimpleInMemoryVectorStore(embeddingModel);
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
    });
    const reranker = new KeywordReranker();
    console.log('✅ Components ready!\n');

    // 2. Sample documents
    console.log('📚 Ingesting sample documents...');
    const documents = [
        {
            content: `Retrieval-Augmented Generation (RAG) is a powerful AI technique that combines 
      large language models with external knowledge retrieval. It works by first retrieving 
      relevant documents from a knowledge base using vector similarity search, then using 
      those documents as context for the language model to generate accurate, informed responses. 
      This approach significantly reduces hallucinations and allows LLMs to access up-to-date 
      information beyond their training data.`,
            metadata: { source: 'rag_intro.txt', topic: 'RAG Basics' },
        },
        {
            content: `Vector databases are specialized databases designed to store and efficiently 
      query high-dimensional vectors (embeddings). They use advanced indexing techniques like 
      HNSW (Hierarchical Navigable Small World) and IVF (Inverted File Index) to perform 
      approximate nearest neighbor (ANN) search in milliseconds. Popular vector databases 
      include Qdrant, Pinecone, Weaviate, Milvus, and OpenSearch with KNN plugin. These 
      databases are essential for RAG systems, semantic search, and recommendation engines.`,
            metadata: { source: 'vector_db.txt', topic: 'Vector Databases' },
        },
        {
            content: `Text chunking is a critical preprocessing step in RAG pipelines. It involves 
      breaking down large documents into smaller, semantically meaningful pieces. Common 
      strategies include: 1) Fixed-size chunking - simple but may break semantic units, 
      2) Recursive character splitting - intelligently splits by paragraphs, sentences, then 
      words, 3) Semantic chunking - uses embeddings to group related content. The chunk size 
      and overlap are important parameters that affect retrieval quality and context window usage.`,
            metadata: { source: 'chunking.txt', topic: 'Text Processing' },
        },
        {
            content: `LiteRAG.js is a lightweight, open-source RAG framework for Node.js and TypeScript. 
      It provides a complete toolkit for building production-grade RAG applications with support 
      for multiple vector stores (Qdrant, OpenSearch, Elasticsearch), smart text chunking, 
      hybrid re-ranking, and caching. The framework is designed to be simple, fast, and 
      production-ready with sub-100ms vector search and end-to-end RAG queries in under 200ms.`,
            metadata: { source: 'literag.txt', topic: 'LiteRAG.js' },
        },
        {
            content: `Re-ranking is a technique used to improve retrieval quality in RAG systems. 
      After initial vector search retrieves candidate documents, a re-ranker re-scores them 
      using more sophisticated methods. Common approaches include: keyword-based re-ranking 
      (boosts documents with query keywords), cross-encoder models (deep neural networks that 
      score query-document pairs), and Reciprocal Rank Fusion (RRF) for combining multiple 
      retrieval results. Re-ranking can improve retrieval quality by 20-30%.`,
            metadata: { source: 'reranking.txt', topic: 'Re-ranking' },
        },
    ];

    // Chunk and add documents
    for (const doc of documents) {
        const chunks = textSplitter.splitText(doc.content);
        const chunkDocs = chunks.map((chunk, idx) => ({
            content: chunk,
            metadata: { ...doc.metadata, chunkIndex: idx, totalChunks: chunks.length },
        }));
        await vectorStore.addDocuments(chunkDocs);
    }

    console.log('');

    // 3. Interactive queries
    const queries = [
        'What is RAG and how does it work?',
        'Tell me about vector databases',
        'What is LiteRAG.js?',
        'How does text chunking work in RAG systems?',
        'What is re-ranking and why is it important?',
    ];

    console.log('🔍 Running sample queries...\n');

    for (const query of queries) {
        console.log('─'.repeat(60));
        console.log(`\n📝 Query: "${query}"`);
        console.log('');

        // Retrieve
        let results = await vectorStore.search(query, 3);

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

        // Display results
        console.log(`Found ${rerankedResults.length} relevant chunks:\n`);
        rerankedResults.forEach((result, idx) => {
            console.log(`[${idx + 1}] Score: ${result.score.toFixed(4)}`);
            console.log(`    Topic: ${result.document.metadata?.topic}`);
            console.log(`    Content: ${result.document.content.substring(0, 150).trim()}...`);
            console.log('');
        });
    }

    console.log('═'.repeat(60));
    console.log('\n✅ Demo complete!');
    console.log('\n💡 This demo ran entirely in-memory without any vector database!');
    console.log('   For production use, connect to Qdrant or OpenSearch for better performance.\n');
}

main().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
});
