import {
    createVectorStore,
    MockEmbeddingModel,
    RecursiveCharacterTextSplitter,
    IngestionPipeline,
    Retriever,
    KeywordReranker,
} from '../src/index';

/**
 * Example: Basic RAG workflow without API server
 */
async function main() {
    console.log('LiteRAG Basic Example\n');

    // 1. Create embedding model
    console.log('1. Creating embedding model...');
    const embeddingModel = new MockEmbeddingModel(384);

    // 2. Create vector store
    console.log('2. Creating vector store...');
    const vectorStore = createVectorStore(
        {
            type: 'qdrant',
            qdrant: {
                url: 'http://localhost:6333',
                collectionName: 'basic_example',
            },
        },
        embeddingModel
    );

    // Initialize vector store
    await vectorStore.initialize();

    // 3. Create text splitter
    console.log('3. Creating text splitter...');
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
    });

    // 4. Create ingestion pipeline
    console.log('4. Creating ingestion pipeline...');
    const pipeline = new IngestionPipeline({
        textSplitter,
        vectorStore,
    });

    // 5. Ingest sample documents
    console.log('5. Ingesting documents...\n');

    const documents = [
        {
            content: `
        Retrieval-Augmented Generation (RAG) is a technique that combines the power of 
        large language models with external knowledge retrieval. It works by first retrieving 
        relevant documents from a knowledge base, then using those documents as context 
        for the language model to generate more accurate and informed responses.
      `,
            metadata: { source: 'rag_intro.txt', topic: 'RAG' },
        },
        {
            content: `
        Vector databases are specialized databases designed to store and query high-dimensional 
        vectors efficiently. They use techniques like approximate nearest neighbor (ANN) search 
        to quickly find similar vectors. Popular vector databases include Qdrant, Pinecone, 
        Weaviate, and OpenSearch with KNN plugin.
      `,
            metadata: { source: 'vector_db.txt', topic: 'Vector Databases' },
        },
        {
            content: `
        Text chunking is an important preprocessing step in RAG systems. It involves breaking 
        down large documents into smaller, manageable pieces. Common strategies include 
        fixed-size chunking, recursive character splitting, and semantic chunking. The chunk 
        size and overlap are important parameters that affect retrieval quality.
      `,
            metadata: { source: 'chunking.txt', topic: 'Text Processing' },
        },
    ];

    await pipeline.ingestDocuments(documents);

    // 6. Create retriever
    console.log('\n6. Creating retriever...');
    const retriever = new Retriever({
        vectorStore,
        topK: 3,
    });

    // 7. Query the knowledge base
    console.log('7. Querying knowledge base...\n');

    const queries = [
        'What is RAG?',
        'Tell me about vector databases',
        'How does text chunking work?',
    ];

    const reranker = new KeywordReranker();

    for (const query of queries) {
        console.log(`\n📝 Query: "${query}"`);
        console.log('─'.repeat(60));

        // Retrieve
        let results = await retriever.retrieve(query, 2);

        // Re-rank
        results = await reranker.rerank(query, results);

        // Display results
        results.forEach((result, idx) => {
            console.log(`\n[${idx + 1}] Score: ${result.score.toFixed(4)}`);
            console.log(`Source: ${result.document.metadata?.source}`);
            console.log(`Content: ${result.document.content.trim().substring(0, 150)}...`);
        });
    }

    // 8. Cleanup
    console.log('\n\n8. Cleaning up...');
    await vectorStore.close();

    console.log('\n✅ Example completed!');
}

// Run the example
main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
