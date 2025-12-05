import { VectorStore, SearchResult } from '../core/types';

/**
 * Retriever configuration
 */
export interface RetrieverConfig {
    vectorStore: VectorStore;
    topK?: number;
}

/**
 * Basic retriever
 * Retrieves relevant documents from the vector store
 */
export class Retriever {
    private vectorStore: VectorStore;
    private topK: number;

    constructor(config: RetrieverConfig) {
        this.vectorStore = config.vectorStore;
        this.topK = config.topK || 5;
    }

    /**
     * Retrieve relevant documents for a query
     */
    async retrieve(query: string, k?: number): Promise<SearchResult[]> {
        const limit = k || this.topK;
        return await this.vectorStore.similaritySearch(query, limit);
    }

    /**
     * Retrieve and format as context string
     */
    async retrieveAsContext(query: string, k?: number): Promise<string> {
        const results = await this.retrieve(query, k);
        return results.map((result, idx) => `[${idx + 1}] ${result.document.content}`).join('\n\n');
    }
}
