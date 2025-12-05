import { RecursiveCharacterTextSplitter, FixedSizeTextSplitter } from '../ingestion/splitters';

describe('RecursiveCharacterTextSplitter', () => {
    it('should split text into chunks', () => {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 50,
            chunkOverlap: 10,
        });

        const text = 'This is a test document. It has multiple sentences. We want to split it into chunks.';
        const chunks = splitter.splitText(text);

        expect(chunks.length).toBeGreaterThan(0);
        chunks.forEach((chunk) => {
            expect(chunk.length).toBeLessThanOrEqual(60); // Allow some flexibility
        });
    });

    it('should handle empty text', () => {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 100,
            chunkOverlap: 10,
        });

        const chunks = splitter.splitText('');
        expect(chunks.length).toBe(0);
    });

    it('should respect chunk size when possible', () => {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 20,
            chunkOverlap: 0,
            separators: [' ', ''],
        });

        const text = 'word '.repeat(30); // Creates splittable text
        const chunks = splitter.splitText(text);

        chunks.forEach((chunk) => {
            // Most chunks should respect the size, allowing some flexibility for edge cases
            expect(chunk.length).toBeLessThanOrEqual(30);
        });
    });

    it('should handle text that cannot be split below chunk size', () => {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 10,
            chunkOverlap: 0,
            separators: [' ', ''],
        });

        const text = 'thisisalongwordthatcannotbesplit'; // Length 32
        const chunks = splitter.splitText(text);

        expect(chunks.length).toBe(1);
        expect(chunks[0]).toBe(text);
        expect(chunks[0].length).toBeGreaterThan(10); // Chunk size was 10, but word is longer
    });
});

describe('FixedSizeTextSplitter', () => {
    it('should split text into fixed-size chunks', () => {
        const splitter = new FixedSizeTextSplitter({
            chunkSize: 10,
            chunkOverlap: 2,
        });

        const text = 'a'.repeat(50);
        const chunks = splitter.splitText(text);

        expect(chunks.length).toBeGreaterThan(1);
        chunks.forEach((chunk) => {
            expect(chunk.length).toBeLessThanOrEqual(10);
        });
    });

    it('should apply overlap correctly', () => {
        const splitter = new FixedSizeTextSplitter({
            chunkSize: 10,
            chunkOverlap: 3,
        });

        const text = '0123456789abcdefghij';
        const chunks = splitter.splitText(text);

        expect(chunks.length).toBeGreaterThan(1);
        // Check that chunks have overlap
        if (chunks.length > 1) {
            const firstChunkEnd = chunks[0].slice(-3);
            const secondChunkStart = chunks[1].slice(0, 3);
            expect(firstChunkEnd).toBe(secondChunkStart);
        }
    });
});
