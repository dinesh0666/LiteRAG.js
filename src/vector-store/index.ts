import { VectorStore, VectorStoreConfig, EmbeddingModel } from '../core/types';
import { QdrantVectorStore } from './qdrant';
import { OpenSearchVectorStore } from './opensearch';

/**
 * Factory function to create a vector store based on configuration
 */
export function createVectorStore(
    config: VectorStoreConfig,
    embeddingModel: EmbeddingModel
): VectorStore {
    switch (config.type) {
        case 'qdrant':
            if (!config.qdrant) {
                throw new Error('Qdrant configuration is required');
            }
            return new QdrantVectorStore(
                config.qdrant.url,
                config.qdrant.collectionName,
                embeddingModel,
                config.qdrant.apiKey
            );

        case 'opensearch':
            if (!config.opensearch) {
                throw new Error('OpenSearch configuration is required');
            }
            return new OpenSearchVectorStore(
                config.opensearch.node,
                config.opensearch.indexName,
                embeddingModel,
                config.opensearch.auth
            );

        default:
            throw new Error(`Unsupported vector store type: ${config.type}`);
    }
}

export { QdrantVectorStore } from './qdrant';
export { OpenSearchVectorStore } from './opensearch';
