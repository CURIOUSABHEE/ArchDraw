import { step, level, tutorial, component, edge, msg } from '@/lib/tutorial/factories';
import {
  buildAction,
  buildFirstStepAction,
  buildOpeningL1,
  buildCelebration,
} from '@/lib/tutorial/defaults';
import type { Tutorial } from '@/lib/tutorial/types';

const l1 = level({
  level: 1,
  title: 'Production RAG System',
  subtitle: 'Build a RAG system in 10 steps',
  description:
    'Build a production RAG (Retrieval-Augmented Generation) system. Learn document ingestion, chunking strategies, vector embeddings, semantic search, reranking, and LLM synthesis at scale.',
  estimatedTime: '~25 mins',
  unlocks: undefined,
  contextMessage:
    "Let's build a production RAG system from scratch. RAG combines your private data with LLMs — the system retrieves relevant documents and feeds them to the LLM as context. This is how ChatGPT Enterprise, Claude for Work, and Perplexity answer questions about your specific data.",
  steps: [
    step({
      id: 1,
      title: 'Start with the Client',
      explanation:
        "The client is a chat interface — web app, API, or Slack bot. Users ask questions in natural language. The RAG system retrieves relevant documents and synthesizes an answer.",
      action: buildFirstStepAction('Web'),
      why: "The client defines the experience. For RAG, the client is a question-answering interface. All the complexity — retrieval, reranking, synthesis — happens invisibly to provide a natural Q&A experience.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'RAG',
        'Chat Interface',
        'accept natural language questions from users and return synthesized answers backed by retrieved documents',
        "The client is a Q&A interface. Users ask questions, the RAG system retrieves relevant documents, and the LLM synthesizes an answer. This is how ChatGPT Enterprise and Perplexity work with your private data.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "The client is a simple Q&A interface. All the complexity — document ingestion, chunking, embedding, retrieval, reranking, and LLM synthesis — happens invisibly to provide a natural chat experience.",
        'API Gateway'
      ),
      messages: [
        msg("Welcome to the RAG Application tutorial. RAG combines your private data with LLMs for accurate, grounded answers."),
        msg("The client is a question-answering interface. Users ask questions in natural language. The RAG system retrieves relevant documents and synthesizes an answer. This is how ChatGPT Enterprise and Perplexity work with your private data."),
        msg('Press ⌘K and search for "Web" to add the client to the canvas.'),
      ],
      requiredNodes: ['client_web'],
      requiredEdges: [],
      successMessage: 'Client added. Now the entry layer.',
      errorMessage: 'Add a Web Client node using ⌘K → search "Web".',
    }),
    step({
      id: 2,
      title: 'Add the API Gateway',
      explanation:
        "All requests flow through the API Gateway — both the Q&A flow (user question → LLM answer) and the ingestion flow (documents → chunks → embeddings). Rate limiting and auth are enforced here.",
      action: buildAction(
        'API Gateway',
        'Web',
        'API Gateway',
        'both the Q&A flow (question → answer) and ingestion flow (documents → embeddings) being routed and rate-limited'
      ),
      why: "The API Gateway handles two flows: query routing and document ingestion. Both need auth and rate limiting, but at very different scales — ingestion is bursty, queries are constant.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'RAG',
        'API Gateway',
        'route both query requests and document ingestion, enforcing auth and rate limits on both flows',
        "The API Gateway handles two very different flows: queries (continuous, low latency) and ingestion (bursty, high throughput). Both need authentication and rate limiting, but at different scales and SLAs.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "The API Gateway routes two flows: queries to the RAG pipeline and documents to the ingestion pipeline. Auth and rate limiting are enforced on both. Query traffic is continuous and latency-sensitive; ingestion is bursty.",
        'Load Balancer'
      ),
      messages: [
        msg("The API Gateway handles two flows: querying (user asks a question) and ingestion (documents are added to the knowledge base)."),
        msg("Both flows go through the API Gateway. It handles authentication, rate limiting, and routing. Query traffic is continuous and latency-sensitive (needs fast responses). Ingestion traffic is bursty and throughput-sensitive (needs to handle large document uploads)."),
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added and connected. Now the load balancer.',
      errorMessage: 'Add an API Gateway and connect Web → API Gateway.',
    }),
    step({
      id: 3,
      title: 'Add Load Balancer',
      explanation:
        "The Load Balancer distributes both query and ingestion requests across application servers. For a RAG system, query latency is critical — consistent hashing keeps hot embeddings in cache.",
      action: buildAction(
        'Load Balancer',
        'API Gateway',
        'Load Balancer',
        'query and ingestion traffic being distributed across servers with consistent hashing for cache efficiency on hot embeddings'
      ),
      why: "RAG systems are read-heavy on the query side and write-heavy on the ingestion side. The load balancer enables horizontal scaling for both flows while consistent hashing keeps frequently queried embeddings in cache.",
      component: component('load_balancer', 'Load Balancer'),
      openingMessage: buildOpeningL1(
        'RAG',
        'Load Balancer',
        'distribute query and ingestion traffic across servers with consistent hashing for cache-efficient embedding retrieval',
        "RAG systems are read-heavy on queries (latency-critical) and write-heavy on ingestion (throughput-critical). Consistent hashing keeps frequently queried embeddings hot in cache — essential for fast Q&A responses.",
        'Load Balancer'
      ),
      celebrationMessage: buildCelebration(
        'Load Balancer',
        'API Gateway',
        "The Load Balancer distributes query and ingestion traffic. Consistent hashing keeps frequently queried embeddings hot in cache — critical for sub-second Q&A responses. Horizontal scaling handles both flows independently.",
        'LLM API'
      ),
      messages: [
        msg("The Load Balancer distributes requests across application servers for both query and ingestion flows."),
        msg("RAG systems are read-heavy on queries and write-heavy on ingestion. Consistent hashing keeps frequently queried embeddings cached on the same servers — reducing vector database lookups and achieving sub-second Q&A responses."),
        msg('Press ⌘K, search for "Load Balancer", add it, then connect API Gateway → Load Balancer.'),
      ],
      requiredNodes: ['load_balancer'],
      requiredEdges: [edge('api_gateway', 'load_balancer')],
      successMessage: 'Load Balancer added and connected. Now the LLM layer.',
      errorMessage: 'Add a Load Balancer and connect API Gateway → Load Balancer.',
    }),
    step({
      id: 4,
      title: 'Add LLM API',
      explanation:
        "The LLM API (GPT-4, Claude, Gemini) synthesizes the final answer. Given a user question and retrieved context chunks, it generates a grounded, accurate response with citations.",
      action: buildAction(
        'LLM API',
        'Load Balancer',
        'LLM API',
        'user questions being synthesized with retrieved document context into grounded, cited answers'
      ),
      why: "The LLM is the synthesis engine. Without RAG, LLMs hallucinate. With RAG, the LLM uses retrieved documents as context — making answers accurate, up-to-date, and grounded in your actual data.",
      component: component('llm_api', 'LLM'),
      openingMessage: buildOpeningL1(
        'RAG',
        'LLM API',
        'synthesize user questions with retrieved document context into accurate, grounded answers with citations',
        "Without RAG, LLMs hallucinate — they generate plausible-sounding but wrong answers. With RAG, the LLM receives relevant documents as context, making answers accurate, up-to-date, and specific to your data.",
        'LLM API'
      ),
      celebrationMessage: buildCelebration(
        'LLM API',
        'Load Balancer',
        "The LLM synthesizes answers using retrieved documents as context — this is what makes RAG accurate. The LLM receives: the user's question + relevant document chunks + instructions to cite sources. No hallucinations.",
        'RAG Pipeline'
      ),
      messages: [
        msg("The LLM synthesizes the final answer using retrieved document context."),
        msg("Without RAG, LLMs hallucinate — plausible-sounding but wrong answers. With RAG, the LLM receives retrieved documents as context. It answers the user's question using only the provided documents, citing the sources. This is what makes RAG accurate."),
        msg('Press ⌘K, search for "LLM API", add it, then connect Load Balancer → LLM API.'),
      ],
      requiredNodes: ['llm_api'],
      requiredEdges: [edge('load_balancer', 'llm_api')],
      successMessage: 'LLM API added. Now the RAG retrieval pipeline.',
      errorMessage: 'Add an LLM API and connect Load Balancer → LLM API.',
    }),
    step({
      id: 5,
      title: 'Add RAG Pipeline',
      explanation:
        "The RAG Pipeline is the retrieval engine — given a user question, it searches the vector database, fetches relevant chunks, and passes them to the LLM. This is the core of any RAG system.",
      action: buildAction(
        'RAG Pipeline',
        'Load Balancer',
        'RAG Pipeline',
        'user questions being converted to embeddings, used to search the vector database, and relevant chunks being retrieved for the LLM'
      ),
      why: "The RAG Pipeline is what makes 'retrieval-augmented' work. It converts questions to vectors, searches for semantic similarity, and returns the most relevant document chunks. Without it, there's no retrieval.",
      component: component('rag_pipeline', 'RAG'),
      openingMessage: buildOpeningL1(
        'RAG',
        'RAG Pipeline',
        'convert user questions to embeddings, search the vector database for semantically similar chunks, and return the top results to the LLM',
        "The RAG Pipeline is the retrieval engine: convert question to embedding → search vector DB for similar chunks → return top-k results. Semantic search means it finds 'car insurance' when the user asks 'auto coverage' — keyword search would miss this.",
        'RAG Pipeline'
      ),
      celebrationMessage: buildCelebration(
        'RAG Pipeline',
        'Load Balancer',
        "The RAG Pipeline converts questions to embeddings and searches the vector database for semantically similar chunks. Semantic search finds 'car insurance' when the user asks 'auto coverage' — keyword search would miss this. The pipeline returns top-k chunks to the LLM.",
        'Vector DB'
      ),
      messages: [
        msg("The RAG Pipeline is the retrieval engine — the 'R' in RAG."),
        msg("Given a user question: 1) Convert to embedding vector. 2) Search vector DB for semantically similar chunks. 3) Return top-k results. Semantic search means finding 'car insurance' when the user asks 'auto coverage' — keyword search would completely miss this."),
        msg('Press ⌘K, search for "RAG Pipeline", add it, then connect Load Balancer → RAG Pipeline.'),
      ],
      requiredNodes: ['rag_pipeline'],
      requiredEdges: [edge('load_balancer', 'rag_pipeline')],
      successMessage: 'RAG Pipeline added. Now the vector database.',
      errorMessage: 'Add a RAG Pipeline and connect Load Balancer → RAG Pipeline.',
    }),
    step({
      id: 6,
      title: 'Add Vector Database',
      explanation:
        "The Vector Database stores document embeddings — dense numerical representations of text. Given an embedding, it finds the most similar documents using cosine similarity or dot product. This enables semantic search.",
      action: buildAction(
        'Vector DB',
        'RAG Pipeline',
        'Vector DB',
        'document embeddings being stored and searched for semantic similarity using cosine similarity or dot product'
      ),
      why: "Vector databases are the foundation of semantic search. Without them, you can't do similarity search at scale. Pinecone, Weaviate, and pgvector all specialize in efficient vector storage and nearest-neighbor search.",
      component: component('vector_db', 'Vector'),
      openingMessage: buildOpeningL1(
        'RAG',
        'Vector Database',
        'store document embeddings and find the most similar chunks using cosine similarity — enabling semantic search at scale',
        "Vector databases store embeddings: dense numerical representations of text. Searching for 'car insurance' finds 'auto coverage' because their embeddings are semantically similar — even if the words are completely different. This is the magic of semantic search.",
        'Vector DB'
      ),
      celebrationMessage: buildCelebration(
        'Vector DB',
        'RAG Pipeline',
        "The Vector Database stores embeddings and searches for nearest neighbors. Semantic search means 'car insurance' finds 'auto coverage' — even though the words differ completely. Vector similarity is what makes RAG intelligent.",
        'Embedding Service'
      ),
      messages: [
        msg("The Vector Database stores document embeddings and enables similarity search."),
        msg("Embeddings are dense numerical representations of text. 'Car insurance' and 'auto coverage' have similar embeddings even though the words are different. The Vector DB finds nearest neighbors using cosine similarity — this is semantic search."),
        msg('Press ⌘K, search for "Vector Database", add it, then connect RAG Pipeline → Vector DB.'),
      ],
      requiredNodes: ['vector_db'],
      requiredEdges: [edge('rag_pipeline', 'vector_db')],
      successMessage: 'Vector Database added. Now the embedding service.',
      errorMessage: 'Add a Vector Database and connect RAG Pipeline → Vector DB.',
    }),
    step({
      id: 7,
      title: 'Add Embedding Service',
      explanation:
        "The Embedding Service converts raw text into vector embeddings using models like OpenAI's text-embedding-3 or Sentence Transformers. It runs during ingestion and at query time.",
      action: buildAction(
        'Embedding Service',
        'Load Balancer',
        'Embedding Service',
        'text chunks being converted to dense vector embeddings during both ingestion and query time'
      ),
      why: "Embedding models turn text into numbers. The quality of embeddings determines RAG accuracy — a poor embedding model produces irrelevant results. Embedding-as-a-service (OpenAI, Cohere) or self-hosted models (Sentence Transformers) both work.",
      component: component('embedding_service', 'Embedding'),
      openingMessage: buildOpeningL1(
        'RAG',
        'Embedding Service',
        'convert text chunks to dense vector embeddings using models like text-embedding-3 or Sentence Transformers',
        "Embedding models turn text into numbers. 'The car needs auto insurance' and 'Vehicle coverage policy' → similar vectors. The quality of embeddings determines RAG accuracy — a poor embedding model produces irrelevant search results.",
        'Embedding Service'
      ),
      celebrationMessage: buildCelebration(
        'Embedding Service',
        'Load Balancer',
        "The Embedding Service converts text to vectors using models like text-embedding-3 or Sentence Transformers. Embedding quality determines RAG accuracy — better embeddings mean more relevant retrieval. It runs at ingestion time (batch) and query time (real-time).",
        'In-Memory Cache'
      ),
      messages: [
        msg("The Embedding Service converts text to vector embeddings — the foundation of semantic search."),
        msg("Embedding models turn text into dense numerical vectors. 'The car needs auto insurance' and 'Vehicle coverage policy' → similar vectors. The Embedding Service runs during ingestion (batch) and at query time (real-time). OpenAI text-embedding-3 or Sentence Transformers are common choices."),
        msg('Press ⌘K, search for "Embedding Service", add it, then connect Load Balancer → Embedding Service.'),
      ],
      requiredNodes: ['embedding_service'],
      requiredEdges: [edge('load_balancer', 'embedding_service')],
      successMessage: 'Embedding Service added. Now the document cache.',
      errorMessage: 'Add an Embedding Service and connect Load Balancer → Embedding Service.',
    }),
    step({
      id: 8,
      title: 'Add Document Cache',
      explanation:
        "The In-Memory Cache stores recent query embeddings and their top-k results. RAG queries are expensive — embedding + vector search + LLM synthesis. Caching avoids re-running the same questions.",
      action: buildAction(
        'In-Memory Cache',
        'RAG Pipeline',
        'Document Cache',
        'recent query embeddings and their top-k results being cached to avoid re-embedding and re-searching identical questions'
      ),
      why: "RAG pipelines are expensive — embedding generation, vector search, and LLM synthesis all cost money and latency. Semantic caching of recent queries can save 30-60% of compute on common questions.",
      component: component('in_memory_cache', 'Cache'),
      openingMessage: buildOpeningL1(
        'RAG',
        'Document Cache',
        'cache recent query embeddings and top-k results to avoid re-embedding and re-searching identical questions',
        "RAG pipelines are expensive: embedding generation + vector search + LLM synthesis each cost money and add latency. Semantic caching of recent questions — even slightly rephrased versions — can save 30-60% of compute on common questions.",
        'Cache'
      ),
      celebrationMessage: buildCelebration(
        'Document Cache',
        'RAG Pipeline',
        "RAG pipelines are expensive: embedding + vector search + LLM synthesis. Semantic caching of recent queries saves 30-60% of compute on common questions. Even slightly rephrased questions hit the cache if the semantic similarity is high enough.",
        'Ingestion Pipeline'
      ),
      messages: [
        msg("RAG queries are expensive. Cache recent results to avoid re-computation."),
        msg("Each RAG query runs: embed question → vector search → LLM synthesis. Each step costs money and adds latency. Semantic caching stores recent query embeddings and their results. Similar questions hit the cache — saving 30-60% of compute on common questions."),
        msg('Press ⌘K, search for "In-Memory Cache", add it, then connect RAG Pipeline → Document Cache.'),
      ],
      requiredNodes: ['in_memory_cache'],
      requiredEdges: [edge('rag_pipeline', 'in_memory_cache')],
      successMessage: 'Document Cache added. Now the ingestion pipeline.',
      errorMessage: 'Add an In-Memory Cache and connect RAG Pipeline → Document Cache.',
    }),
    step({
      id: 9,
      title: 'Add Document Loader',
      explanation:
        "Documents enter the system through the Document Loader — PDFs, web pages, Notion exports, Confluence, Slack messages. Each format needs a specialized parser to extract clean text.",
      action: buildAction(
        'API Gateway',
        'Load Balancer',
        'Document Loader',
        'PDFs, web pages, Notion, Confluence, and Slack messages being parsed and extracted as clean text for chunking'
      ),
      why: "Real-world data comes in dozens of formats. The Document Loader is the ingestion entry point — it normalizes everything to plain text before chunking. Without it, dirty input produces dirty output.",
      component: component('upload_service', 'Upload'),
      openingMessage: buildOpeningL1(
        'RAG',
        'Document Loader',
        'parse PDFs, web pages, Notion, Confluence, and Slack messages into clean text for chunking',
        "Real-world data comes in dozens of formats: PDFs, Confluence, Notion, Slack, web pages. Each format needs a specialized parser to extract clean text. Without a Document Loader, dirty input produces dirty output — garbled chunks that confuse the LLM.",
        'Upload'
      ),
      celebrationMessage: buildCelebration(
        'Document Loader',
        'API Gateway',
        "The Document Loader parses multiple formats — PDFs, web pages, Notion, Confluence, Slack — into clean text. Each format has a specialized parser. Without clean text input, chunking and embedding produce garbage — the whole RAG pipeline depends on good document parsing.",
        'Text Splitter'
      ),
      messages: [
        msg("Documents enter the RAG system through the Document Loader — PDFs, web pages, Notion, Confluence, Slack."),
        msg("Each format needs a specialized parser: PDF extractors for documents, web scrapers for URLs, Notion API clients for pages, Slack message exporters for conversations. The output is always clean, structured text — ready for chunking."),
        msg('Press ⌘K, search for "Upload Service", add it for Document Loading, then connect API Gateway → Document Loader.'),
      ],
      requiredNodes: ['upload_service'],
      requiredEdges: [edge('api_gateway', 'upload_service')],
      successMessage: 'Document Loader added. Now the text splitter.',
      errorMessage: 'Add an Upload Service (Document Loader) and connect API Gateway → Document Loader.',
    }),
    step({
      id: 10,
      title: 'Add Text Splitter',
      explanation:
        "Documents are split into chunks — typically 512-1024 tokens each. Chunking strategy matters enormously: too large loses granularity, too small loses context. Overlapping chunks (25% overlap) preserve continuity.",
      action: buildAction(
        'Worker',
        'Upload Service',
        'Text Splitter',
        'long documents being split into 512-1024 token chunks with 25% overlap to preserve continuity between chunks'
      ),
      why: "Chunking is where most RAG systems fail. Poor chunking — wrong size, no overlap, ignoring semantic boundaries — produces irrelevant retrieval results. Getting chunking right is 80% of production RAG engineering.",
      component: component('worker_job', 'Worker'),
      openingMessage: buildOpeningL1(
        'RAG',
        'Text Splitter',
        'split documents into 512-1024 token chunks with 25% overlap to preserve semantic continuity while maintaining granular retrieval',
        "Chunking is where most RAG systems fail. Wrong chunk size: too large loses granularity, too small loses context. No overlap: boundaries split relevant sentences. Semantic chunking (splitting at natural boundaries) outperforms fixed-size chunking. This is 80% of production RAG engineering.",
        'Worker'
      ),
      celebrationMessage: buildCelebration(
        'Text Splitter',
        'Document Loader',
        "Chunking strategy determines RAG quality. 512-1024 tokens per chunk with 25% overlap. Semantic chunking (splitting at natural boundaries) beats fixed-size. After chunking: Embedding Service converts each chunk to a vector, then each vector + chunk is stored in the Vector Database. You have built a RAG system.",
        'nothing — you have built a RAG system'
      ),
      messages: [
        msg("Documents are split into chunks — typically 512-1024 tokens. Chunking strategy matters enormously."),
        msg("Too large: chunks lose granularity, retrieval returns irrelevant context. Too small: chunks lack enough context for the LLM to answer. 25% overlap preserves continuity across chunk boundaries. Semantic chunking (splitting at natural sentence/paragraph boundaries) outperforms fixed-size chunking."),
        msg('Press ⌘K, search for "Worker / Background Job", add it for Text Splitting, then connect Document Loader → Text Splitter.'),
      ],
      requiredNodes: ['worker_job'],
      requiredEdges: [edge('upload_service', 'worker_job')],
      successMessage: 'Text Splitter added. You have built a complete RAG system.',
      errorMessage: 'Add a Worker / Background Job (Text Splitter) and connect Document Loader → Text Splitter.',
    }),
  ],
});

export const ragTutorial: Tutorial = tutorial({
  id: 'rag-application',
  title: 'How to Design a RAG Application',
  description:
    'Build a production RAG (Retrieval-Augmented Generation) system. Learn document ingestion, chunking strategies, vector embeddings, semantic search, and LLM synthesis at scale.',
  difficulty: 'Intermediate',
  category: 'AI Systems',
  isLive: false,
  icon: 'Brain',
  color: '#ec4899',
  tags: ['Vector DB', 'Embeddings', 'LLM', 'Retrieval'],
  estimatedTime: '~25 mins',
  levels: [l1],
});
