# Contributing to LiteRAG.js

Thank you for your interest in contributing to LiteRAG.js! 🎉

## Good First Issues

We've labeled some issues as "good first issue" to help you get started:

### 1. Add New Vector DB Connectors
- Implement Pinecone connector
- Implement Weaviate connector
- Implement Milvus connector

### 2. Enhance Chunking Strategies
- Semantic chunking (sentence-based)
- Markdown-aware chunking
- Code-aware chunking (for documentation)

### 3. Add Real Embedding Models
- OpenAI embeddings integration
- HuggingFace transformers integration
- Cohere embeddings support

### 4. Improve Re-ranking
- Cross-encoder re-ranker
- BM25 hybrid search
- Custom scoring functions

### 5. Add Redis Cache
- Implement Redis adapter for distributed caching
- Add cache invalidation strategies

### 6. Write Benchmarks
- Compare with LangChain
- Compare with LlamaIndex
- Memory usage profiling

### 7. Documentation
- Add more examples (PDF ingestion, hybrid search, etc.)
- Create video tutorials
- Write blog posts

## Development Setup

```bash
# Clone the repo
git clone https://github.com/dinesh0666/literag.git
cd literag

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run examples
npx ts-node examples/basic.ts
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Code Style

- Use TypeScript
- Follow the existing code style
- Run `npm run lint` and `npm run format` before committing
- Add JSDoc comments for public APIs

## Testing

- Write unit tests for new features
- Ensure test coverage doesn't decrease
- Test with multiple vector stores (Qdrant, OpenSearch)

## Questions?

Feel free to open an issue or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
