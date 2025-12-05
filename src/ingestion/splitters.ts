import { TextSplitter, TextSplitterConfig } from '../core/types';

/**
 * Recursive character text splitter
 * Splits text recursively by trying different separators
 */
export class RecursiveCharacterTextSplitter implements TextSplitter {
    private chunkSize: number;
    private chunkOverlap: number;
    private separators: string[];

    constructor(config: TextSplitterConfig) {
        this.chunkSize = config.chunkSize;
        this.chunkOverlap = config.chunkOverlap;
        this.separators = config.separators || ['\n\n', '\n', ' ', ''];
    }

    splitText(text: string): string[] {
        return this.recursiveSplit(text, this.separators);
    }

    private recursiveSplit(text: string, separators: string[]): string[] {
        const finalChunks: string[] = [];

        // Get the separator to use
        let separator = separators[separators.length - 1];
        let newSeparators: string[] = [];

        for (let i = 0; i < separators.length; i++) {
            const s = separators[i];
            if (s === '') {
                separator = s;
                break;
            }
            if (text.includes(s)) {
                separator = s;
                newSeparators = separators.slice(i + 1);
                break;
            }
        }

        // Split by the separator
        const splits = separator ? text.split(separator) : [text];

        // Merge splits into chunks
        let currentChunk = '';
        for (const split of splits) {
            const trimmedSplit = split.trim();
            if (!trimmedSplit) continue;

            const testChunk = currentChunk
                ? currentChunk + (separator || '') + trimmedSplit
                : trimmedSplit;

            if (testChunk.length <= this.chunkSize) {
                currentChunk = testChunk;
            } else {
                // Current chunk is full
                if (currentChunk) {
                    finalChunks.push(currentChunk);
                }

                // If split is still too large, recursively split it
                if (trimmedSplit.length > this.chunkSize && newSeparators.length > 0) {
                    const subChunks = this.recursiveSplit(trimmedSplit, newSeparators);
                    finalChunks.push(...subChunks);
                    currentChunk = '';
                } else {
                    currentChunk = trimmedSplit;
                }
            }
        }

        // Add remaining chunk
        if (currentChunk) {
            finalChunks.push(currentChunk);
        }

        // Apply overlap
        return this.applyOverlap(finalChunks);
    }

    private applyOverlap(chunks: string[]): string[] {
        if (this.chunkOverlap === 0 || chunks.length <= 1) {
            return chunks;
        }

        const overlappedChunks: string[] = [];
        for (let i = 0; i < chunks.length; i++) {
            let chunk = chunks[i];

            // Add overlap from previous chunk
            if (i > 0 && this.chunkOverlap > 0) {
                const prevChunk = chunks[i - 1];
                const overlapText = prevChunk.slice(-this.chunkOverlap);
                chunk = overlapText + ' ' + chunk;
            }

            overlappedChunks.push(chunk);
        }

        return overlappedChunks;
    }
}

/**
 * Fixed-size text splitter
 * Splits text into fixed-size chunks
 */
export class FixedSizeTextSplitter implements TextSplitter {
    private chunkSize: number;
    private chunkOverlap: number;

    constructor(config: TextSplitterConfig) {
        this.chunkSize = config.chunkSize;
        this.chunkOverlap = config.chunkOverlap;
    }

    splitText(text: string): string[] {
        const chunks: string[] = [];
        let start = 0;

        while (start < text.length) {
            const end = Math.min(start + this.chunkSize, text.length);
            chunks.push(text.slice(start, end));
            start += this.chunkSize - this.chunkOverlap;
        }

        return chunks;
    }
}
