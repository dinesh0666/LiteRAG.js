/**
 * Core types and interfaces for LiteRAG.js
 */

/**
 * Metadata associated with a document
 */
export interface Metadata {
    [key: string]: string | number | boolean | string[] | number[];
}

/**
 * A document with content and metadata
 */
export interface Document {
    id?: string;
    content: string;
    metadata?: Metadata;
    embedding?: number[];
}

/**
 * A chunk of a document
 */
export interface Chunk extends Document {
    chunkIndex: number;
    sourceDocumentId?: string;
}

/**
 * Search result with score
 */
export interface SearchResult {
    document: Document;
    score: number;
}

/**
 * Configuration for vector store
 */
export interface VectorStoreConfig {
    type: 'opensearch' | 'qdrant';
    // OpenSearch/Elasticsearch config
    opensearch?: {
        node: string;
        auth?: {
            username: string;
            password: string;
        };
        indexName: string;
    };
    // Qdrant config
    qdrant?: {
        url: string;
        apiKey?: string;
        collectionName: string;
    };
}

/**
 * Metadata filter for vector search
 * Provides a unified interface that works across all vector stores
 */
export interface MetadataFilter {
    /** Simple equality matching */
    equals?: Record<string, string | number | boolean>;

    /** Logical AND - all conditions must match */
    and?: MetadataFilter[];

    /** Logical OR - at least one condition must match */
    or?: MetadataFilter[];

    /** Logical NOT - condition must not match */
    not?: MetadataFilter;

    /** Greater than comparison */
    greaterThan?: Record<string, number>;

    /** Less than comparison */
    lessThan?: Record<string, number>;

    /** Greater than or equal comparison */
    greaterThanOrEqual?: Record<string, number>;

    /** Less than or equal comparison */
    lessThanOrEqual?: Record<string, number>;

    /** Value must be in the provided list */
    in?: Record<string, (string | number | boolean)[]>;
}

/**
 * Vector store interface - all vector DB implementations must implement this
 */
export interface VectorStore {
    /**
     * Initialize the vector store (create index/collection if needed)
     */
    initialize(): Promise<void>;

    /**
     * Add documents to the vector store
     */
    addDocuments(documents: Document[]): Promise<void>;

    /**
     * Search for similar documents
     * @param query - Query text or embedding vector
     * @param k - Number of results to return
     * @param filter - Optional metadata filter
     */
    similaritySearch(query: string | number[], k: number, filter?: MetadataFilter): Promise<SearchResult[]>;

    /**
     * Delete documents by IDs
     */
    deleteDocuments(ids: string[]): Promise<void>;

    /**
     * Close the connection
     */
    close(): Promise<void>;
}

/**
 * Embedding model interface
 */
export interface EmbeddingModel {
    /**
     * Generate embeddings for text
     */
    embedText(text: string): Promise<number[]>;

    /**
     * Generate embeddings for multiple texts
     */
    embedBatch(texts: string[]): Promise<number[][]>;

    /**
     * Get the dimension of embeddings
     */
    getDimension(): number;
}

/**
 * Text splitter configuration
 */
export interface TextSplitterConfig {
    chunkSize: number;
    chunkOverlap: number;
    separators?: string[];
}

/**
 * Text splitter interface
 */
export interface TextSplitter {
    splitText(text: string): string[];
}
