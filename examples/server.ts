import {
    LiteRAGServer,
    createVectorStore,
    MockEmbeddingModel,
    RecursiveCharacterTextSplitter,
    InMemoryCache,
    KeywordReranker,
} from '../src/index';

/**
 * Example: Running LiteRAG server with Qdrant
 */
async function main() {
    console.log('Starting LiteRAG server...\n');

    // Create embedding model (using mock for demo)
    const embeddingModel = new MockEmbeddingModel(384);

    // Configure vector store
    // Change this to match your setup
    const vectorStore = createVectorStore(
        {
            type: 'qdrant',
            qdrant: {
                url: process.env.QDRANT_URL || 'http://localhost:6333',
                collectionName: process.env.COLLECTION_NAME || 'literag_demo',
                apiKey: process.env.QDRANT_API_KEY,
            },
        },
        embeddingModel
    );

    // Alternative: OpenSearch configuration
    // const vectorStore = createVectorStore(
    //   {
    //     type: 'opensearch',
    //     opensearch: {
    //       node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
    //       indexName: process.env.INDEX_NAME || 'literag_demo',
    //       auth: {
    //         username: process.env.OPENSEARCH_USER || 'admin',
    //         password: process.env.OPENSEARCH_PASSWORD || 'admin',
    //       },
    //     },
    //   },
    //   embeddingModel
    // );

    // Create server
    const server = new LiteRAGServer({
        port: parseInt(process.env.PORT || '3000'),
        vectorStore,
        embeddingModel,
        textSplitter: new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 50,
        }),
        reranker: new KeywordReranker(),
        cache: new InMemoryCache(),
        cacheTTL: 300, // 5 minutes
    });

    // Start server
    await server.start();

    console.log('\n✅ LiteRAG server is ready!');
    console.log('\nAvailable endpoints:');
    console.log('  POST   /ingest       - Ingest a document');
    console.log('  POST   /ingest/batch - Ingest multiple documents');
    console.log('  POST   /query        - Query the knowledge base');
    console.log('  DELETE /documents    - Delete documents');
    console.log('  GET    /health       - Health check');
    console.log('\nExample usage:');
    console.log('  curl -X POST http://localhost:3000/ingest \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -d \'{"content": "Your text here", "metadata": {"source": "test"}}\'');
}

// Run the server
main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
