import express, { Request, Response } from 'express';
import { VectorStore, EmbeddingModel, Metadata } from '../core/types';
import { IngestionPipeline } from '../ingestion/pipeline';
import { Retriever } from '../retrieval/retriever';
import { Reranker } from '../retrieval/reranker';
import { Cache } from '../core/cache';
import { TextSplitter } from '../core/types';

/**
 * API Server configuration
 */
export interface ServerConfig {
    port: number;
    vectorStore: VectorStore;
    embeddingModel: EmbeddingModel;
    textSplitter: TextSplitter;
    reranker?: Reranker;
    cache?: Cache<any>;
    cacheTTL?: number;
}

/**
 * LiteRAG API Server
 */
export class LiteRAGServer {
    private app: express.Application;
    private config: ServerConfig;
    private ingestionPipeline: IngestionPipeline;
    private retriever: Retriever;

    constructor(config: ServerConfig) {
        this.app = express();
        this.config = config;

        // Initialize components
        this.ingestionPipeline = new IngestionPipeline({
            textSplitter: config.textSplitter,
            vectorStore: config.vectorStore,
        });

        this.retriever = new Retriever({
            vectorStore: config.vectorStore,
        });

        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware(): void {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
    }

    private setupRoutes(): void {
        // Health check
        this.app.get('/health', (req: Request, res: Response) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        // Ingest endpoint
        this.app.post('/ingest', async (req: Request, res: Response) => {
            try {
                const { content, metadata } = req.body;

                if (!content) {
                    return res.status(400).json({ error: 'Content is required' });
                }

                await this.ingestionPipeline.ingestDocument(content, metadata as Metadata);

                res.json({
                    success: true,
                    message: 'Document ingested successfully',
                });
            } catch (error: any) {
                console.error('Ingestion error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Batch ingest endpoint
        this.app.post('/ingest/batch', async (req: Request, res: Response) => {
            try {
                const { documents } = req.body;

                if (!documents || !Array.isArray(documents)) {
                    return res.status(400).json({ error: 'Documents array is required' });
                }

                await this.ingestionPipeline.ingestDocuments(documents);

                res.json({
                    success: true,
                    message: `${documents.length} documents ingested successfully`,
                });
            } catch (error: any) {
                console.error('Batch ingestion error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Query endpoint
        this.app.post('/query', async (req: Request, res: Response) => {
            try {
                const { query, k, rerank, filter, useCache = true } = req.body;

                if (!query) {
                    return res.status(400).json({ error: 'Query is required' });
                }

                const topK = k || 5;

                // Check cache
                const cacheKey = `query:${query}:${topK}:${JSON.stringify(filter || {})}`;
                if (useCache && this.config.cache) {
                    const cached = await this.config.cache.get(cacheKey);
                    if (cached) {
                        return res.json({
                            ...cached,
                            cached: true,
                        });
                    }
                }

                // Retrieve
                let results = await this.retriever.retrieve(query, { topK, filter });

                // Re-rank if configured
                if (rerank && this.config.reranker) {
                    results = await this.config.reranker.rerank(query, results);
                }

                // Format response
                const response = {
                    query,
                    results: results.map((r) => ({
                        content: r.document.content,
                        metadata: r.document.metadata,
                        score: r.score,
                    })),
                };

                // Cache result
                if (useCache && this.config.cache) {
                    await this.config.cache.set(cacheKey, response, this.config.cacheTTL);
                }

                res.json(response);
            } catch (error: any) {
                console.error('Query error:', error);
                res.status(500).json({ error: 'Failed to process query' });
            }
        });

        // Delete documents endpoint
        this.app.delete('/documents', async (req: Request, res: Response) => {
            try {
                const { ids } = req.body;

                if (!ids || !Array.isArray(ids)) {
                    return res.status(400).json({ error: 'Document IDs array is required' });
                }

                await this.config.vectorStore.deleteDocuments(ids);

                res.json({
                    success: true,
                    message: `${ids.length} documents deleted successfully`,
                });
            } catch (error: any) {
                console.error('Delete error:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }

    /**
     * Start the server
     */
    async start(): Promise<void> {
        // Initialize vector store
        await this.config.vectorStore.initialize();

        return new Promise((resolve) => {
            this.app.listen(this.config.port, () => {
                console.log(`LiteRAG server running on port ${this.config.port}`);
                resolve();
            });
        });
    }

    /**
     * Get the Express app instance
     */
    getApp(): express.Application {
        return this.app;
    }
}
