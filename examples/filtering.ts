import {
    createVectorStore,
    MockEmbeddingModel,
    RecursiveCharacterTextSplitter,
    IngestionPipeline,
    Retriever,
} from '../src/index';

/**
 * Example: Using metadata filters with LiteRAG.js
 * 
 * This example demonstrates how to filter search results by metadata.
 * The same filter works across Qdrant, OpenSearch, and Elasticsearch!
 */

async function main() {
    console.log('🔍 Metadata Filtering Example\n');

    // Setup
    const embeddingModel = new MockEmbeddingModel(384);
    const vectorStore = createVectorStore(
        {
            type: 'qdrant',
            qdrant: {
                url: process.env.QDRANT_URL || 'http://localhost:6333',
                collectionName: 'filter_demo',
            },
        },
        embeddingModel
    );

    await vectorStore.initialize();

    // Ingest documents with metadata
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 200,
        chunkOverlap: 20,
    });

    const pipeline = new IngestionPipeline({ textSplitter, vectorStore });

    console.log('📚 Ingesting documents with metadata...\n');

    await pipeline.ingestDocuments([
        {
            content: 'TypeScript is a strongly typed programming language that builds on JavaScript.',
            metadata: { category: 'tech', language: 'typescript', views: 1500 },
        },
        {
            content: 'Python is a high-level programming language known for its simplicity.',
            metadata: { category: 'tech', language: 'python', views: 2000 },
        },
        {
            content: 'The Great Gatsby is a novel by F. Scott Fitzgerald.',
            metadata: { category: 'literature', author: 'Fitzgerald', views: 500 },
        },
        {
            content: 'Machine learning is a subset of artificial intelligence.',
            metadata: { category: 'tech', language: 'general', views: 3000 },
        },
        {
            content: 'To Kill a Mockingbird is a novel by Harper Lee.',
            metadata: { category: 'literature', author: 'Lee', views: 800 },
        },
    ]);

    const retriever = new Retriever({ vectorStore, topK: 5 });

    // Example 1: Simple equality filter
    console.log('═'.repeat(60));
    console.log('Example 1: Filter by category = "tech"');
    console.log('═'.repeat(60));

    const results1 = await retriever.retrieve('programming language', {
        filter: { equals: { category: 'tech' } },
    });

    console.log(`Found ${results1.length} results:\n`);
    results1.forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.document.content}`);
        console.log(`   Category: ${r.document.metadata?.category}, Score: ${r.score.toFixed(3)}\n`);
    });

    // Example 2: Multiple conditions (AND)
    console.log('═'.repeat(60));
    console.log('Example 2: Filter by category = "tech" AND views > 1000');
    console.log('═'.repeat(60));

    const results2 = await retriever.retrieve('programming', {
        filter: {
            equals: { category: 'tech' },
            greaterThan: { views: 1000 },
        },
    });

    console.log(`Found ${results2.length} results:\n`);
    results2.forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.document.content}`);
        console.log(`   Views: ${r.document.metadata?.views}, Score: ${r.score.toFixed(3)}\n`);
    });

    // Example 3: OR condition
    console.log('═'.repeat(60));
    console.log('Example 3: Filter by category = "tech" OR category = "literature"');
    console.log('═'.repeat(60));

    const results3 = await retriever.retrieve('novel', {
        filter: {
            or: [
                { equals: { category: 'tech' } },
                { equals: { category: 'literature' } },
            ],
        },
    });

    console.log(`Found ${results3.length} results:\n`);
    results3.forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.document.content}`);
        console.log(`   Category: ${r.document.metadata?.category}, Score: ${r.score.toFixed(3)}\n`);
    });

    // Example 4: Complex filter with AND + OR
    console.log('═'.repeat(60));
    console.log('Example 4: Complex filter - category = "tech" AND (views > 2000 OR language = "typescript")');
    console.log('═'.repeat(60));

    const results4 = await retriever.retrieve('programming', {
        filter: {
            and: [
                { equals: { category: 'tech' } },
                {
                    or: [
                        { greaterThan: { views: 2000 } },
                        { equals: { language: 'typescript' } },
                    ],
                },
            ],
        },
    });

    console.log(`Found ${results4.length} results:\n`);
    results4.forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.document.content}`);
        console.log(`   Language: ${r.document.metadata?.language}, Views: ${r.document.metadata?.views}\n`);
    });

    // Example 5: Range filter
    console.log('═'.repeat(60));
    console.log('Example 5: Filter by views between 500 and 2000');
    console.log('═'.repeat(60));

    const results5 = await retriever.retrieve('novel', {
        filter: {
            greaterThanOrEqual: { views: 500 },
            lessThanOrEqual: { views: 2000 },
        },
    });

    console.log(`Found ${results5.length} results:\n`);
    results5.forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.document.content}`);
        console.log(`   Views: ${r.document.metadata?.views}, Score: ${r.score.toFixed(3)}\n`);
    });

    // Example 6: IN operator
    console.log('═'.repeat(60));
    console.log('Example 6: Filter by language IN ["python", "typescript"]');
    console.log('═'.repeat(60));

    const results6 = await retriever.retrieve('programming', {
        filter: {
            in: { language: ['python', 'typescript'] },
        },
    });

    console.log(`Found ${results6.length} results:\n`);
    results6.forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.document.content}`);
        console.log(`   Language: ${r.document.metadata?.language}, Score: ${r.score.toFixed(3)}\n`);
    });

    console.log('═'.repeat(60));
    console.log('✅ Demo complete!');
    console.log('═'.repeat(60));
    console.log('\n💡 Key Takeaway:');
    console.log('The SAME filter syntax works across Qdrant, OpenSearch, and Elasticsearch!');
    console.log('Just change the vector store type in config - no code changes needed.\n');

    await vectorStore.close();
}

// Run
main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
