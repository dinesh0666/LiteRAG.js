import { Client } from '@opensearch-project/opensearch';
import { v4 as uuidv4 } from 'uuid';
import { VectorStore, Document, SearchResult, EmbeddingModel } from '../core/types';

/**
 * OpenSearch vector store implementation
 */
export class OpenSearchVectorStore implements VectorStore {
    private client: Client;
    private indexName: string;
    private embeddingModel: EmbeddingModel;
    private dimension: number;

    constructor(
        node: string,
        indexName: string,
        embeddingModel: EmbeddingModel,
        auth?: { username: string; password: string }
    ) {
        this.client = new Client({
            node,
            ...(auth && {
                auth: {
                    username: auth.username,
                    password: auth.password,
                },
            }),
        });
        this.indexName = indexName;
        this.embeddingModel = embeddingModel;
        this.dimension = embeddingModel.getDimension();
    }

    async initialize(): Promise<void> {
        try {
            // Check if index exists
            const exists = await this.client.indices.exists({ index: this.indexName });

            if (!exists.body) {
                // Create index with vector mapping
                await this.client.indices.create({
                    index: this.indexName,
                    body: {
                        settings: {
                            index: {
                                knn: true,
                                'knn.algo_param.ef_search': 100,
                            },
                        },
                        mappings: {
                            properties: {
                                content: { type: 'text' },
                                embedding: {
                                    type: 'knn_vector',
                                    dimension: this.dimension,
                                    method: {
                                        name: 'hnsw',
                                        space_type: 'cosinesimil',
                                        engine: 'nmslib',
                                    },
                                },
                                metadata: { type: 'object', enabled: true },
                            },
                        },
                    },
                });
                console.log(`Created OpenSearch index: ${this.indexName}`);
            } else {
                console.log(`OpenSearch index already exists: ${this.indexName}`);
            }
        } catch (error) {
            throw new Error(`Failed to initialize OpenSearch: ${error}`);
        }
    }

    async addDocuments(documents: Document[]): Promise<void> {
        if (documents.length === 0) return;

        try {
            // Generate embeddings
            const texts = documents.map((doc) => doc.content);
            const embeddings = await this.embeddingModel.embedBatch(texts);

            // Prepare bulk operations
            const body = documents.flatMap((doc, idx) => {
                const id = doc.id || uuidv4();
                return [
                    { index: { _index: this.indexName, _id: id } },
                    {
                        content: doc.content,
                        embedding: embeddings[idx],
                        metadata: doc.metadata || {},
                    },
                ];
            });

            // Bulk index
            const response = await this.client.bulk({ refresh: true, body });

            if (response.body.errors) {
                const erroredDocuments = response.body.items.filter((item: any) => item.index?.error);
                console.error('Errors indexing documents:', erroredDocuments);
                throw new Error('Some documents failed to index');
            }

            console.log(`Added ${documents.length} documents to OpenSearch`);
        } catch (error) {
            throw new Error(`Failed to add documents to OpenSearch: ${error}`);
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

            // KNN search
            const response = await this.client.search({
                index: this.indexName,
                body: {
                    size: k,
                    query: {
                        knn: {
                            embedding: {
                                vector: queryVector,
                                k: k,
                            },
                        },
                    },
                },
            });

            // Convert to SearchResult format
            return response.body.hits.hits.map((hit: any) => ({
                document: {
                    id: hit._id,
                    content: hit._source.content,
                    metadata: hit._source.metadata,
                },
                score: hit._score,
            }));
        } catch (error) {
            throw new Error(`Failed to search in OpenSearch: ${error}`);
        }
    }

    async deleteDocuments(ids: string[]): Promise<void> {
        try {
            const body = ids.flatMap((id) => [{ delete: { _index: this.indexName, _id: id } }]);

            await this.client.bulk({ refresh: true, body });
            console.log(`Deleted ${ids.length} documents from OpenSearch`);
        } catch (error) {
            throw new Error(`Failed to delete documents from OpenSearch: ${error}`);
        }
    }

    async close(): Promise<void> {
        await this.client.close();
        console.log('OpenSearch connection closed');
    }
}
