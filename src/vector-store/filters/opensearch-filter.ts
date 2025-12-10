import { MetadataFilter } from '../../core/types';

/**
 * OpenSearch/Elasticsearch query format
 */
interface OpenSearchQuery {
    bool?: {
        must?: any[];
        should?: any[];
        must_not?: any[];
        minimum_should_match?: number;
    };
    term?: Record<string, any>;
    range?: Record<string, any>;
    terms?: Record<string, any[]>;
}

/**
 * Convert unified MetadataFilter to OpenSearch/Elasticsearch query format
 */
export function toOpenSearchFilter(filter: MetadataFilter): OpenSearchQuery {
    const boolQuery: OpenSearchQuery = { bool: {} };

    // Handle equals
    if (filter.equals) {
        boolQuery.bool!.must = boolQuery.bool!.must || [];
        for (const [key, value] of Object.entries(filter.equals)) {
            boolQuery.bool!.must.push({
                term: { [`metadata.${key}`]: value },
            });
        }
    }

    // Handle greaterThan
    if (filter.greaterThan) {
        boolQuery.bool!.must = boolQuery.bool!.must || [];
        for (const [key, value] of Object.entries(filter.greaterThan)) {
            boolQuery.bool!.must.push({
                range: { [`metadata.${key}`]: { gt: value } },
            });
        }
    }

    // Handle lessThan
    if (filter.lessThan) {
        boolQuery.bool!.must = boolQuery.bool!.must || [];
        for (const [key, value] of Object.entries(filter.lessThan)) {
            boolQuery.bool!.must.push({
                range: { [`metadata.${key}`]: { lt: value } },
            });
        }
    }

    // Handle greaterThanOrEqual
    if (filter.greaterThanOrEqual) {
        boolQuery.bool!.must = boolQuery.bool!.must || [];
        for (const [key, value] of Object.entries(filter.greaterThanOrEqual)) {
            boolQuery.bool!.must.push({
                range: { [`metadata.${key}`]: { gte: value } },
            });
        }
    }

    // Handle lessThanOrEqual
    if (filter.lessThanOrEqual) {
        boolQuery.bool!.must = boolQuery.bool!.must || [];
        for (const [key, value] of Object.entries(filter.lessThanOrEqual)) {
            boolQuery.bool!.must.push({
                range: { [`metadata.${key}`]: { lte: value } },
            });
        }
    }

    // Handle in
    if (filter.in) {
        boolQuery.bool!.must = boolQuery.bool!.must || [];
        for (const [key, values] of Object.entries(filter.in)) {
            boolQuery.bool!.must.push({
                terms: { [`metadata.${key}`]: values },
            });
        }
    }

    // Handle AND
    if (filter.and && filter.and.length > 0) {
        boolQuery.bool!.must = boolQuery.bool!.must || [];
        for (const subFilter of filter.and) {
            const converted = toOpenSearchFilter(subFilter);
            boolQuery.bool!.must.push(converted);
        }
    }

    // Handle OR
    if (filter.or && filter.or.length > 0) {
        boolQuery.bool!.should = boolQuery.bool!.should || [];
        for (const subFilter of filter.or) {
            const converted = toOpenSearchFilter(subFilter);
            boolQuery.bool!.should.push(converted);
        }
        // At least one should condition must match
        boolQuery.bool!.minimum_should_match = 1;
    }

    // Handle NOT
    if (filter.not) {
        boolQuery.bool!.must_not = boolQuery.bool!.must_not || [];
        const converted = toOpenSearchFilter(filter.not);
        boolQuery.bool!.must_not.push(converted);
    }

    return boolQuery;
}
