import { EmbeddingModel } from './types';

/**
 * Mock embedding model for testing and development
 * Generates random embeddings
 */
export class MockEmbeddingModel implements EmbeddingModel {
    private dimension: number;

    constructor(dimension: number = 384) {
        this.dimension = dimension;
    }

    async embedText(text: string): Promise<number[]> {
        // Generate deterministic random embeddings based on text
        const seed = this.hashString(text);
        return this.generateRandomVector(seed);
    }

    async embedBatch(texts: string[]): Promise<number[][]> {
        return Promise.all(texts.map((text) => this.embedText(text)));
    }

    getDimension(): number {
        return this.dimension;
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    private generateRandomVector(seed: number): number[] {
        const vector: number[] = [];
        let random = seed;

        for (let i = 0; i < this.dimension; i++) {
            // Simple LCG random number generator
            random = (random * 1103515245 + 12345) & 0x7fffffff;
            vector.push((random / 0x7fffffff) * 2 - 1); // Normalize to [-1, 1]
        }

        // Normalize the vector
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        return vector.map((val) => val / magnitude);
    }
}

/**
 * Configuration for OpenAI embeddings
 */
export interface OpenAIEmbeddingConfig {
    apiKey: string;
    model?: string; // e.g., 'text-embedding-3-small'
}

/**
 * OpenAI embedding model (placeholder - requires openai package)
 * To use: npm install openai
 */
export class OpenAIEmbeddingModel implements EmbeddingModel {
    private config: OpenAIEmbeddingConfig;
    private dimension: number;

    constructor(config: OpenAIEmbeddingConfig) {
        this.config = config;
        this.dimension = 1536; // Default for text-embedding-ada-002
        // TODO: Initialize OpenAI client when package is installed
    }

    async embedText(text: string): Promise<number[]> {
        throw new Error(
            'OpenAI embeddings not implemented. Install openai package and implement this method.'
        );
    }

    async embedBatch(texts: string[]): Promise<number[][]> {
        throw new Error(
            'OpenAI embeddings not implemented. Install openai package and implement this method.'
        );
    }

    getDimension(): number {
        return this.dimension;
    }
}
