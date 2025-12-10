import { VectorStore, SearchResult, MetadataFilter } from '../core/types';

/**
 * Retriever for querying the vector store
 */
export class Retriever {
    private vectorStore: VectorStore;
    private topK: number;

    constructor(options: { vectorStore: VectorStore; topK?: number }) {
        this.vectorStore = options.vectorStore;
        this.topK = options.topK || 5;
    }

    /**
     * Retrieve relevant documents for a query
     * @param query - Query text
     * @param options - Optional parameters including filter
     */
    async retrieve(
        query: string,
        options?: { topK?: number; filter?: MetadataFilter }
    ): Promise<SearchResult[]> {
        const k = options?.topK || this.topK;
        const filter = options?.filter;

        // Search vector store
        const results = await this.vectorStore.similaritySearch(query, k, filter);

        return results;
    }

    /**
     * Retrieve and format as context string
     */
    async retrieveAsContext(query: string, k?: number): Promise<string> {
        const results = await this.retrieve(query, { topK: k });
        return results.map((result, idx) => `[${idx + 1}] ${result.document.content}`).join('\n\n');
    }
}
