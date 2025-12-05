import { SearchResult } from '../core/types';

/**
 * Re-ranker interface
 */
export interface Reranker {
    rerank(query: string, results: SearchResult[]): Promise<SearchResult[]>;
}

/**
 * Simple re-ranker based on keyword matching
 * Boosts scores for documents containing query keywords
 */
export class KeywordReranker implements Reranker {
    async rerank(query: string, results: SearchResult[]): Promise<SearchResult[]> {
        const queryKeywords = this.extractKeywords(query.toLowerCase());

        // Re-score based on keyword matches
        const reranked = results.map((result) => {
            const content = result.document.content.toLowerCase();
            let keywordScore = 0;

            for (const keyword of queryKeywords) {
                const matches = (content.match(new RegExp(keyword, 'g')) || []).length;
                keywordScore += matches;
            }

            // Combine original score with keyword score
            const boostedScore = result.score * (1 + keywordScore * 0.1);

            return {
                ...result,
                score: boostedScore,
            };
        });

        // Sort by new score
        return reranked.sort((a, b) => b.score - a.score);
    }

    private extractKeywords(text: string): string[] {
        // Simple keyword extraction (remove common stop words)
        const stopWords = new Set([
            'the',
            'a',
            'an',
            'and',
            'or',
            'but',
            'in',
            'on',
            'at',
            'to',
            'for',
            'of',
            'with',
            'by',
            'from',
            'is',
            'are',
            'was',
            'were',
            'be',
            'been',
            'being',
        ]);

        return text
            .split(/\s+/)
            .filter((word) => word.length > 2 && !stopWords.has(word))
            .slice(0, 10); // Limit to top 10 keywords
    }
}

/**
 * No-op re-ranker (returns results as-is)
 */
export class NoOpReranker implements Reranker {
    async rerank(query: string, results: SearchResult[]): Promise<SearchResult[]> {
        return results;
    }
}

/**
 * Reciprocal Rank Fusion (RRF) re-ranker
 * Useful for combining multiple retrieval results
 */
export class RRFReranker implements Reranker {
    private k: number;

    constructor(k: number = 60) {
        this.k = k;
    }

    async rerank(query: string, results: SearchResult[]): Promise<SearchResult[]> {
        // Apply RRF scoring
        const reranked = results.map((result, idx) => ({
            ...result,
            score: 1 / (this.k + idx + 1),
        }));

        return reranked.sort((a, b) => b.score - a.score);
    }
}
