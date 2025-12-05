import { MockEmbeddingModel } from '../core/embedding';

describe('MockEmbeddingModel', () => {
    let model: MockEmbeddingModel;

    beforeEach(() => {
        model = new MockEmbeddingModel(384);
    });

    it('should generate embeddings of correct dimension', async () => {
        const embedding = await model.embedText('test text');
        expect(embedding.length).toBe(384);
    });

    it('should generate normalized embeddings', async () => {
        const embedding = await model.embedText('test text');

        // Check if vector is normalized (magnitude should be ~1)
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        expect(magnitude).toBeCloseTo(1, 5);
    });

    it('should generate deterministic embeddings', async () => {
        const text = 'consistent text';
        const embedding1 = await model.embedText(text);
        const embedding2 = await model.embedText(text);

        expect(embedding1).toEqual(embedding2);
    });

    it('should generate different embeddings for different texts', async () => {
        const embedding1 = await model.embedText('text one');
        const embedding2 = await model.embedText('text two');

        expect(embedding1).not.toEqual(embedding2);
    });

    it('should embed batch of texts', async () => {
        const texts = ['text 1', 'text 2', 'text 3'];
        const embeddings = await model.embedBatch(texts);

        expect(embeddings.length).toBe(3);
        embeddings.forEach((embedding) => {
            expect(embedding.length).toBe(384);
        });
    });

    it('should return correct dimension', () => {
        expect(model.getDimension()).toBe(384);
    });
});
