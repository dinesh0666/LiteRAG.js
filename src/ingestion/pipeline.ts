import { Document, Chunk, VectorStore, Metadata } from '../core/types';
import { TextSplitter } from '../core/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Ingestion pipeline configuration
 */
export interface IngestionConfig {
    textSplitter: TextSplitter;
    vectorStore: VectorStore;
}

/**
 * Ingestion pipeline
 * Handles document chunking and storage
 */
export class IngestionPipeline {
    private textSplitter: TextSplitter;
    private vectorStore: VectorStore;

    constructor(config: IngestionConfig) {
        this.textSplitter = config.textSplitter;
        this.vectorStore = config.vectorStore;
    }

    /**
     * Ingest a single document
     */
    async ingestDocument(content: string, metadata?: Metadata): Promise<void> {
        const documentId = uuidv4();

        // Split text into chunks
        const chunks = this.textSplitter.splitText(content);

        // Create chunk documents
        const chunkDocuments: Chunk[] = chunks.map((chunkText, idx) => ({
            id: `${documentId}_chunk_${idx}`,
            content: chunkText,
            chunkIndex: idx,
            sourceDocumentId: documentId,
            metadata: {
                ...metadata,
                chunkIndex: idx,
                totalChunks: chunks.length,
            },
        }));

        // Add to vector store
        await this.vectorStore.addDocuments(chunkDocuments);

        console.log(`Ingested document with ${chunks.length} chunks`);
    }

    /**
     * Ingest multiple documents
     */
    async ingestDocuments(documents: Array<{ content: string; metadata?: Metadata }>): Promise<void> {
        for (const doc of documents) {
            await this.ingestDocument(doc.content, doc.metadata);
        }
    }

    /**
     * Ingest from a text file
     */
    async ingestFromFile(filePath: string, metadata?: Metadata): Promise<void> {
        const fs = await import('fs/promises');
        const content = await fs.readFile(filePath, 'utf-8');
        await this.ingestDocument(content, { ...metadata, source: filePath });
    }
}
