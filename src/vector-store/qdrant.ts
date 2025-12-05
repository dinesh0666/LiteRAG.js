import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';
import { VectorStore, Document, SearchResult, EmbeddingModel } from '../core/types';

/**
 * Qdrant vector store implementation
 */
export class QdrantVectorStore implements VectorStore {
    private client: QdrantClient;
    private collectionName: string;
    private embeddingModel: EmbeddingModel;
    private dimension: number;

    constructor(
        url: string,
        collectionName: string,
        embeddingModel: EmbeddingModel,
        apiKey?: string
    ) {
        this.client = new QdrantClient({
            url,
            apiKey,
        });
        this.collectionName = collectionName;
        this.embeddingModel = embeddingModel;
        this.dimension = embeddingModel.getDimension();
    }

    async initialize(): Promise<void> {
        try {
            // Check if collection exists
            const collections = await this.client.getCollections();
            const exists = collections.collections.some((c) => c.name === this.collectionName);

            if (!exists) {
                // Create collection
                await this.client.createCollection(this.collectionName, {
                    vectors: {
                        size: this.dimension,
                        distance: 'Cosine',
                    },
                });
                console.log(`Created Qdrant collection: ${this.collectionName}`);
            } else {
                console.log(`Qdrant collection already exists: ${this.collectionName}`);
            }
        } catch (error) {
            throw new Error(`Failed to initialize Qdrant: ${error}`);
        }
    }

    async addDocuments(documents: Document[]): Promise<void> {
        if (documents.length === 0) return;

        try {
            // Generate embeddings for documents
            const texts = documents.map((doc) => doc.content);
            const embeddings = await this.embeddingModel.embedBatch(texts);

            // Prepare points for Qdrant
            const points = documents.map((doc, idx) => ({
                id: doc.id || uuidv4(),
                vector: embeddings[idx],
                payload: {
                    content: doc.content,
                    metadata: doc.metadata || {},
                },
            }));

            // Upsert points
            await this.client.upsert(this.collectionName, {
                wait: true,
                points,
            });

            console.log(`Added ${documents.length} documents to Qdrant`);
        } catch (error) {
            throw new Error(`Failed to add documents to Qdrant: ${error}`);
        }
    }

    async similaritySearch(query: string | number[], k: number): Promise<SearchResult[]> {
        try {
            // Get query embedding
            let queryVector: number[];
            if (typeof query === 'string') {
                queryVector = await this.embeddingModel.embedText(query);
            } else {
                queryVector = query;
            }

            // Search
            const searchResult = await this.client.search(this.collectionName, {
                vector: queryVector,
                limit: k,
                with_payload: true,
            });

            // Convert to SearchResult format
            return searchResult.map((result) => ({
                document: {
                    id: result.id.toString(),
                    content: result.payload?.content as string,
                    metadata: result.payload?.metadata as any,
                },
                score: result.score,
            }));
        } catch (error) {
            throw new Error(`Failed to search in Qdrant: ${error}`);
        }
    }

    async deleteDocuments(ids: string[]): Promise<void> {
        try {
            await this.client.delete(this.collectionName, {
                wait: true,
                points: ids,
            });
            console.log(`Deleted ${ids.length} documents from Qdrant`);
        } catch (error) {
            throw new Error(`Failed to delete documents from Qdrant: ${error}`);
        }
    }

    async close(): Promise<void> {
        // Qdrant client doesn't require explicit closing
        console.log('Qdrant connection closed');
    }
}
