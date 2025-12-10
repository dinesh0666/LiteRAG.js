import { MetadataFilter } from '../../core/types';

/**
 * Qdrant filter format
 */
interface QdrantCondition {
    key: string;
    match?: { value: string | number | boolean };
    range?: {
        gt?: number;
        gte?: number;
        lt?: number;
        lte?: number;
    };
}

interface QdrantFilter {
    must?: (QdrantCondition | QdrantFilter)[];
    should?: (QdrantCondition | QdrantFilter)[];
    must_not?: (QdrantCondition | QdrantFilter)[];
}

/**
 * Convert unified MetadataFilter to Qdrant filter format
 */
export function toQdrantFilter(filter: MetadataFilter): QdrantFilter {
    const qdrantFilter: QdrantFilter = {};

    // Handle equals
    if (filter.equals) {
        qdrantFilter.must = qdrantFilter.must || [];
        for (const [key, value] of Object.entries(filter.equals)) {
            qdrantFilter.must.push({
                key,
                match: { value },
            });
        }
    }

    // Handle greaterThan
    if (filter.greaterThan) {
        qdrantFilter.must = qdrantFilter.must || [];
        for (const [key, value] of Object.entries(filter.greaterThan)) {
            qdrantFilter.must.push({
                key,
                range: { gt: value },
            });
        }
    }

    // Handle lessThan
    if (filter.lessThan) {
        qdrantFilter.must = qdrantFilter.must || [];
        for (const [key, value] of Object.entries(filter.lessThan)) {
            qdrantFilter.must.push({
                key,
                range: { lt: value },
            });
        }
    }

    // Handle greaterThanOrEqual
    if (filter.greaterThanOrEqual) {
        qdrantFilter.must = qdrantFilter.must || [];
        for (const [key, value] of Object.entries(filter.greaterThanOrEqual)) {
            qdrantFilter.must.push({
                key,
                range: { gte: value },
            });
        }
    }

    // Handle lessThanOrEqual
    if (filter.lessThanOrEqual) {
        qdrantFilter.must = qdrantFilter.must || [];
        for (const [key, value] of Object.entries(filter.lessThanOrEqual)) {
            qdrantFilter.must.push({
                key,
                range: { lte: value },
            });
        }
    }

    // Handle in
    if (filter.in) {
        qdrantFilter.must = qdrantFilter.must || [];
        for (const [key, values] of Object.entries(filter.in)) {
            // Qdrant doesn't have native "in" operator, use OR of equals
            const conditions: QdrantCondition[] = values.map((value) => ({
                key,
                match: { value },
            }));

            if (conditions.length === 1) {
                qdrantFilter.must.push(conditions[0]);
            } else {
                qdrantFilter.must.push({ should: conditions });
            }
        }
    }

    // Handle AND
    if (filter.and && filter.and.length > 0) {
        qdrantFilter.must = qdrantFilter.must || [];
        for (const subFilter of filter.and) {
            const converted = toQdrantFilter(subFilter);
            qdrantFilter.must.push(converted);
        }
    }

    // Handle OR
    if (filter.or && filter.or.length > 0) {
        qdrantFilter.should = qdrantFilter.should || [];
        for (const subFilter of filter.or) {
            const converted = toQdrantFilter(subFilter);
            qdrantFilter.should.push(converted);
        }
    }

    // Handle NOT
    if (filter.not) {
        qdrantFilter.must_not = qdrantFilter.must_not || [];
        const converted = toQdrantFilter(filter.not);
        qdrantFilter.must_not.push(converted);
    }

    return qdrantFilter;
}
