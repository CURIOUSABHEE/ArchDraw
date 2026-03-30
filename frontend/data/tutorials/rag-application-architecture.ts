import { step, level, tutorial, component, edge, msg } from '@/lib/tutorial/factories';
import {
  buildAction,
  buildFirstStepAction,
  buildOpeningL1,
  buildOpeningL2,
  buildOpeningL3,
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
  unlocks: 'Production Layer',
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
        msg("Press ⌘K and search for \"Web\" and press Enter to add the client to the canvas."),
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
        msg("Press ⌘K and search for \"API Gateway\" and press Enter to add it, then connect Web → API Gateway."),
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
        msg("Press ⌘K and search for \"Load Balancer\" and press Enter to add it, then connect API Gateway → Load Balancer."),
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
        msg("Press ⌘K and search for \"LLM API\" and press Enter to add it, then connect Load Balancer → LLM API."),
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
        msg("PREDICTION: Why can't we just use keyword search (like Elasticsearch)? 🤔"),
        msg("Answer: Keywords fail on synonyms and semantically related concepts. User asks 'phone support' → keyword search finds exact match only. Vector search finds 'customer service', 'help line', 'technical assistance' — all semantically related. This is why embeddings work."),
        msg("Press ⌘K and search for \"RAG Pipeline\" and press Enter to add it, then connect Load Balancer → RAG Pipeline."),
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
        msg("Press ⌘K and search for \"Vector Database\" and press Enter to add it, then connect RAG Pipeline → Vector DB."),
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
        msg("PREDICTION: What's the hardest part of RAG that nobody talks about? 🤔"),
        msg("Answer: CHUNKING. Too small = lose context. Too big = include irrelevant stuff. No overlap = lose cross-chunk context. Good RAG systems spend MORE time on chunking strategy than on model selection. It's the #1 factor in RAG quality."),
        msg("Press ⌘K and search for \"Embedding Service\" and press Enter to add it, then connect Load Balancer → Embedding Service."),
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
        msg("Press ⌘K and search for \"In-Memory Cache\" and press Enter to add it, then connect RAG Pipeline → Document Cache."),
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
        msg("Press ⌘K and search for \"Upload Service\" and press Enter to add it for Document Loading, then connect API Gateway → Document Loader."),
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
        msg("Press ⌘K and search for \"Worker / Background Job\" and press Enter to add it for Text Splitting, then connect Document Loader → Text Splitter."),
      ],
      requiredNodes: ['worker_job'],
      requiredEdges: [edge('upload_service', 'worker_job')],
      successMessage: 'Text Splitter added. You have built a complete RAG system.',
      errorMessage: 'Add a Worker / Background Job (Text Splitter) and connect Document Loader → Text Splitter.',
    }),
  ],
});

const l2 = level({
  level: 2,
  title: "RAG at Scale",
  subtitle: "Stream document ingestion with embedding pipeline monitoring",
  description:
    "Add Kafka event streaming, Redis caching for frequent queries, CDC pipelines, and quality SLO tracking. Handle thousands of concurrent users and monitor retrieval precision alongside latency.",
  estimatedTime: "~28 mins",
  unlocks: undefined,
  contextMessage:
    "Let's scale the RAG system. Thousands of concurrent users, millions of vector embeddings, and retrieval quality that must be monitored like any production service. This requires Kafka for ingestion streaming, Redis for query caching, and quality-grade observability.",
  steps: [
    step({
      id: 1,
      title: "Add Kafka Streaming",
      explanation:
        "RAG's Event Bus streams document ingestion events, embedding generation tasks, and query events. Every new document uploaded triggers an embedding pipeline that streams through Kafka.",
      action: buildAction(
        "Kafka Streaming",
        "API Gateway",
        "Kafka Streaming",
        "document ingestion events, embedding generation tasks, and query events being streamed for async processing"
      ),
      why: "Kafka decouples document ingestion from embedding generation and query processing. Each component scales independently — ingestion bursts don't block query latency.",
      component: component("kafka_streaming", "Kafka"),
      openingMessage: buildOpeningL2(
        "RAG",
        "Kafka Streaming",
        "stream document ingestion events, embedding generation tasks, and query events through an event bus",
        "RAG's Event Bus streams document ingestion events, embedding generation tasks, and query events. Every new document uploaded triggers an embedding pipeline that streams through Kafka.",
        "Kafka Streaming"
      ),
      celebrationMessage: buildCelebration(
        "Kafka Streaming",
        "API Gateway",
        "Kafka decouples document ingestion from embedding generation and query processing. Each component scales independently — ingestion bursts don't block query latency.",
        "Notification Worker"
      ),
      messages: [
        msg("Kafka is the event bus for RAG's ingestion pipeline."),
        msg("Every document uploaded triggers embedding generation tasks that stream through Kafka. Query events also stream through for async processing."),
        msg("Press ⌘K and search for \"Kafka Streaming\" and press Enter to add it, then connect API Gateway → Kafka Streaming."),
      ],
      requiredNodes: ["kafka_streaming"],
      requiredEdges: [edge("api_gateway", "kafka_streaming")],
      successMessage: "Kafka streaming added. Now the notification worker.",
      errorMessage: "Add a Kafka Streaming node and connect API Gateway → Kafka Streaming.",
    }),
    step({
      id: 2,
      title: "Add Notification Worker",
      explanation:
        "RAG's Notification Worker sends alerts when document ingestion completes, embedding generation finishes, or query results are ready. Users need to know when their knowledge base is updated.",
      action: buildAction(
        "Worker",
        "Kafka Streaming",
        "Notification Worker",
        "alerts being sent when document ingestion completes, embedding generation finishes, or query results are ready"
      ),
      why: "Asynchronous processing means users don't wait for ingestion to complete. Notification workers keep users informed — trust requires transparency in RAG systems.",
      component: component("worker_job", "Worker"),
      openingMessage: buildOpeningL2(
        "RAG",
        "Notification Worker",
        "send alerts when document ingestion completes, embedding generation finishes, or query results are ready",
        "RAG's Notification Worker sends alerts when document ingestion completes, embedding generation finishes, or query results are ready. Users need to know when their knowledge base is updated.",
        "Worker"
      ),
      celebrationMessage: buildCelebration(
        "Notification Worker",
        "Kafka Streaming",
        "Asynchronous processing means users don't wait for ingestion. Notification workers keep users informed — trust requires transparency in RAG systems.",
        "In-Memory Cache"
      ),
      messages: [
        msg("Notification workers keep users informed about RAG system state."),
        msg("When document ingestion completes, embeddings finish generating, or query results are ready — users receive notifications. Trust requires transparency in RAG systems."),
        msg("Press ⌘K and search for \"Worker / Background Job\" and press Enter to add it for Notification Worker, then connect Kafka Streaming → Notification Worker."),
      ],
      requiredNodes: ["worker_job"],
      requiredEdges: [edge("kafka_streaming", "worker_job")],
      successMessage: "Notification worker added. Now the Redis cache.",
      errorMessage: "Add a Worker for Notification and connect Kafka Streaming → Notification Worker.",
    }),
    step({
      id: 3,
      title: "Add Redis Cache",
      explanation:
        "RAG's Redis Cache stores active query results and embedding caches. Frequently asked questions get cached embedding results — avoiding expensive vector search for repeated queries.",
      action: buildAction(
        "In-Memory Cache",
        "RAG Pipeline",
        "Redis Cache",
        "active query results and embedding caches being stored in Redis for fast retrieval"
      ),
      why: "RAG queries are expensive — embedding + vector search + LLM synthesis. Redis caching avoids re-running the same questions, saving 30-60% of compute on common queries.",
      component: component("in_memory_cache", "Redis"),
      openingMessage: buildOpeningL2(
        "RAG",
        "In-Memory Cache",
        "store active query results and embedding caches in Redis to avoid expensive re-computation",
        "RAG's Redis Cache stores active query results and embedding caches. Frequently asked questions get cached embedding results — avoiding expensive vector search for repeated queries.",
        "Redis Cache"
      ),
      celebrationMessage: buildCelebration(
        "Redis Cache",
        "RAG Pipeline",
        "RAG queries are expensive: embedding + vector search + LLM synthesis. Redis caching avoids re-running the same questions, saving 30-60% of compute on common queries.",
        "CDC Connector"
      ),
      messages: [
        msg("Redis caches query results and embeddings."),
        msg("Frequently asked questions get cached embedding results — avoiding expensive vector search for repeated queries. This saves significant compute on common RAG queries."),
        msg("Press ⌘K and search for \"In-Memory Cache\" and press Enter to add it, then connect RAG Pipeline → Redis Cache."),
      ],
      requiredNodes: ["in_memory_cache"],
      requiredEdges: [edge("rag_pipeline", "in_memory_cache")],
      successMessage: "Redis cache added. Now the CDC connector.",
      errorMessage: "Add an In-Memory Cache and connect RAG Pipeline → Redis Cache.",
    }),
    step({
      id: 4,
      title: "Add CDC Connector",
      explanation:
        "RAG's CDC Connector mirrors ingestion metadata to the analytics platform. Document usage, query patterns, and relevance feedback stream to the data warehouse for continuous improvement.",
      action: buildAction(
        "CDC Connector",
        "SQL Database",
        "CDC Connector",
        "ingestion metadata being mirrored to the analytics platform for query patterns and feedback analysis"
      ),
      why: "CDC enables analytics without querying the production database. Document usage, query patterns, and relevance feedback stream to the data warehouse — data drives RAG improvement.",
      component: component("cdc_connector", "CDC"),
      openingMessage: buildOpeningL2(
        "RAG",
        "CDC Connector",
        "mirror ingestion metadata to the analytics platform for continuous improvement and feedback analysis",
        "RAG's CDC Connector mirrors ingestion metadata to the analytics platform. Document usage, query patterns, and relevance feedback stream to the data warehouse for continuous improvement.",
        "CDC Connector"
      ),
      celebrationMessage: buildCelebration(
        "CDC Connector",
        "SQL Database",
        "CDC enables analytics without querying production. Document usage and relevance feedback stream to the data warehouse — data drives RAG improvement.",
        "SQL Database"
      ),
      messages: [
        msg("CDC Connector mirrors ingestion metadata to analytics."),
        msg("Document usage, query patterns, and relevance feedback stream to the data warehouse. This data drives continuous improvement of chunking and retrieval strategies."),
        msg("Press ⌘K and search for \"CDC Connector\" and press Enter to add it, then connect SQL Database → CDC Connector."),
      ],
      requiredNodes: ["cdc_connector"],
      requiredEdges: [edge("sql_db", "cdc_connector")],
      successMessage: "CDC connector added. Now the SQL database.",
      errorMessage: "Add a CDC Connector and connect SQL Database → CDC Connector.",
    }),
    step({
      id: 5,
      title: "Add SQL Database",
      explanation:
        "RAG's PostgreSQL stores user accounts, document metadata, and chunk mappings. Chunk-to-document mappings are stored alongside metadata — enabling source tracing for generated answers.",
      action: buildAction(
        "SQL Database",
        "API Gateway",
        "PostgreSQL",
        "user accounts, document metadata, and chunk-to-document mappings being stored for source tracing"
      ),
      why: "SQL provides ACID guarantees for user data and document metadata. Chunk-to-document mappings enable citation — the core value proposition of RAG.",
      component: component("sql_db", "PostgreSQL"),
      openingMessage: buildOpeningL2(
        "RAG",
        "SQL Database",
        "store user accounts, document metadata, and chunk-to-document mappings for source tracing in answers",
        "RAG's PostgreSQL stores user accounts, document metadata, and chunk mappings. Chunk-to-document mappings are stored alongside metadata — enabling source tracing for generated answers.",
        "SQL Database"
      ),
      celebrationMessage: buildCelebration(
        "PostgreSQL",
        "API Gateway",
        "SQL provides ACID guarantees for user data and document metadata. Chunk-to-document mappings enable citation — the core value proposition of RAG.",
        "Structured Logger"
      ),
      messages: [
        msg("PostgreSQL stores user accounts, document metadata, and chunk mappings."),
        msg("Chunk-to-document mappings enable source tracing for generated answers — the core value proposition of RAG. Users can verify which documents informed the answer."),
        msg("Press ⌘K and search for \"SQL Database\" and press Enter to add it, then connect API Gateway → PostgreSQL."),
      ],
      requiredNodes: ["sql_db"],
      requiredEdges: [edge("api_gateway", "sql_db")],
      successMessage: "SQL database added. Now the structured logger.",
      errorMessage: "Add a SQL Database and connect API Gateway → PostgreSQL.",
    }),
    step({
      id: 6,
      title: "Add Structured Logger",
      explanation:
        "RAG's Structured Logger captures query latency, embedding generation time, and retrieval quality metrics. Logs flow to the observability platform — RAG quality depends on understanding retrieval performance.",
      action: buildAction(
        "Logger",
        "RAG Pipeline",
        "Structured Logger",
        "query latency, embedding generation time, and retrieval quality metrics being captured for observability"
      ),
      why: "RAG quality depends on understanding retrieval performance. Structured logs with query latency, embedding time, and retrieval precision enable debugging and optimization.",
      component: component("structured_logger", "Logger"),
      openingMessage: buildOpeningL2(
        "RAG",
        "Structured Logger",
        "capture query latency, embedding generation time, and retrieval quality metrics for observability",
        "RAG's Structured Logger captures query latency, embedding generation time, and retrieval quality metrics. Logs flow to the observability platform — RAG quality depends on understanding retrieval performance.",
        "Structured Logger"
      ),
      celebrationMessage: buildCelebration(
        "Structured Logger",
        "RAG Pipeline",
        "RAG quality depends on understanding retrieval performance. Structured logs with query latency, embedding time, and retrieval precision enable debugging.",
        "SLO Tracker"
      ),
      messages: [
        msg("Structured Logger captures RAG system metrics."),
        msg("Query latency, embedding generation time, and retrieval quality metrics flow to the observability platform. Understanding retrieval performance is essential for RAG quality."),
        msg("Press ⌘K and search for \"Logger\" and press Enter to add it, then connect RAG Pipeline → Structured Logger."),
      ],
      requiredNodes: ["structured_logger"],
      requiredEdges: [edge("rag_pipeline", "structured_logger")],
      successMessage: "Structured logger added. Now the SLO tracker.",
      errorMessage: "Add a Logger and connect RAG Pipeline → Structured Logger.",
    }),
    step({
      id: 7,
      title: "Add SLO Tracker",
      explanation:
        "RAG's SLO Tracker monitors query latency, retrieval precision, and answer quality. Query latency must complete in <3 seconds — tracked alongside quality metrics like retrieval precision@k.",
      action: buildAction(
        "Metrics Collector",
        "Structured Logger",
        "SLO Tracker",
        "query latency, retrieval precision, and answer quality being monitored against SLO targets"
      ),
      why: "SLOs define what's acceptable performance. Query latency <3s with retrieval precision@k tracked — degrading quality triggers alerts before users notice.",
      component: component("slo_tracker", "SLO"),
      openingMessage: buildOpeningL2(
        "RAG",
        "SLO Tracker",
        "monitor query latency, retrieval precision, and answer quality against SLO targets like <3s latency",
        "RAG's SLO Tracker monitors query latency, retrieval precision, and answer quality. Query latency must complete in <3 seconds — tracked alongside quality metrics like retrieval precision@k.",
        "SLO Tracker"
      ),
      celebrationMessage: buildCelebration(
        "SLO Tracker",
        "Structured Logger",
        "SLOs define acceptable performance. Query latency <3s with retrieval precision@k tracked — degrading quality triggers alerts before users notice.",
        "Error Budget Alert"
      ),
      messages: [
        msg("SLO Tracker monitors query latency and retrieval quality."),
        msg("Query latency must complete in <3 seconds. Retrieval precision@k is tracked alongside latency — quality matters as much as speed."),
        msg("Press ⌘K and search for \"Metrics Collector\" and press Enter to add it for SLO Tracker, then connect Structured Logger → SLO Tracker."),
      ],
      requiredNodes: ["slo_tracker"],
      requiredEdges: [edge("structured_logger", "slo_tracker")],
      successMessage: "SLO tracker added. Now the error budget monitor.",
      errorMessage: "Add a Metrics Collector and connect Structured Logger → SLO Tracker.",
    }),
    step({
      id: 8,
      title: "Add Error Budget Alert",
      explanation:
        "RAG's Error Budget Monitor tracks answer quality SLO. When retrieval precision drops (e.g., after a bad embedding model update), the error budget alerts the team before serving degraded answers to users.",
      action: buildAction(
        "Alert Manager",
        "SLO Tracker",
        "Error Budget Alert",
        "answer quality SLO being monitored with alerts triggering when precision drops below threshold"
      ),
      why: "Error budgets quantify acceptable degradation. When precision drops after an embedding model update, the error budget alerts the team before degraded answers reach users.",
      component: component("error_budget_alert", "Alert"),
      openingMessage: buildOpeningL2(
        "RAG",
        "Error Budget Alert",
        "track answer quality SLO with alerts triggering when retrieval precision drops below threshold",
        "RAG's Error Budget Monitor tracks answer quality SLO. When retrieval precision drops (e.g., after a bad embedding model update), the error budget alerts the team before serving degraded answers to users.",
        "Error Budget Alert"
      ),
      celebrationMessage: buildCelebration(
        "Error Budget Alert",
        "SLO Tracker",
        "Error budgets quantify acceptable degradation. When precision drops after an embedding update, the error budget alerts the team before degraded answers reach users.",
        "completion"
      ),
      messages: [
        msg("Error Budget Monitor tracks answer quality SLO."),
        msg("When retrieval precision drops (e.g., after a bad embedding model update), the error budget alerts the team before degraded answers reach users."),
        msg("Press ⌘K and search for \"Alert Manager\" and press Enter to add it, then connect SLO Tracker → Error Budget Alert. This completes the RAG at Scale architecture!"),
      ],
      requiredNodes: ["error_budget_alert"],
      requiredEdges: [edge("slo_tracker", "error_budget_alert")],
      successMessage: "Error budget added. RAG at Scale is complete!",
      errorMessage: "Add an Alert Manager and connect SLO Tracker → Error Budget Alert.",
    }),
  ],
});

const l3 = level({
  level: 3,
  title: "RAG Enterprise",
  subtitle: "Add zero-trust AI pipelines, quality tracing, and audit logging",
  description:
    "Implement zero-trust networking for LLM APIs, distributed tracing for hallucination debugging, and audit logging for compliance. RAG Enterprise serves enterprises with data governance and answer quality requirements.",
  estimatedTime: "~29 mins",
  unlocks: undefined,
  contextMessage:
    "Let's make RAG enterprise-grade. Zero-trust AI pipelines, distributed tracing for hallucination debugging, and immutable audit logs. RAG Enterprise serves enterprises with data governance requirements that drive every architectural decision.",
  steps: [
    step({
      id: 1,
      title: "Add Service Mesh",
      explanation:
        "RAG's Service Mesh (Envoy) handles mTLS between the query pipeline, embedding service, and vector database. Zero-trust networking ensures LLM API keys and document content are protected in transit.",
      action: buildAction(
        "Service Mesh",
        "Load Balancer",
        "Service Mesh",
        "mTLS being enforced between query pipeline, embedding service, and vector database for zero-trust security"
      ),
      why: "Service mesh provides zero-trust networking. LLM API keys and document content are protected in transit — essential for enterprise compliance.",
      component: component("service_mesh", "Service Mesh"),
      openingMessage: buildOpeningL3(
        "RAG",
        "Service Mesh (Envoy)",
        "enforce mTLS between services for zero-trust networking, protecting LLM API keys and document content",
        "RAG's Service Mesh (Envoy) handles mTLS between the query pipeline, embedding service, and vector database. Zero-trust networking ensures LLM API keys and document content are protected in transit.",
        "Service Mesh"
      ),
      celebrationMessage: buildCelebration(
        "Service Mesh",
        "Load Balancer",
        "Service mesh provides zero-trust networking. LLM API keys and document content are protected in transit — essential for enterprise compliance.",
        "BFF Gateway"
      ),
      messages: [
        msg("Service Mesh handles mTLS between services."),
        msg("Zero-trust networking ensures LLM API keys and document content are protected in transit. Envoy-based service mesh is the standard for enterprise RAG."),
        msg("Press ⌘K and search for \"Service Mesh\" and press Enter to add it, then connect Load Balancer → Service Mesh."),
      ],
      requiredNodes: ["service_mesh"],
      requiredEdges: [edge("load_balancer", "service_mesh")],
      successMessage: "Service mesh added. Now the BFF gateway.",
      errorMessage: "Add a Service Mesh and connect Load Balancer → Service Mesh.",
    }),
    step({
      id: 2,
      title: "Add BFF Gateway",
      explanation:
        "RAG's BFF Gateway serves the client with optimized query APIs. The BFF handles query preprocessing, result ranking, and citation formatting — aggregating multiple retrieval results into a coherent response.",
      action: buildAction(
        "API Gateway",
        "Service Mesh",
        "BFF Gateway",
        "query preprocessing, result ranking, and citation formatting being handled for optimized client responses"
      ),
      why: "BFF (Backend for Frontend) optimizes API for client needs. Query preprocessing, ranking, and citation formatting — clients receive coherent responses.",
      component: component("bff_gateway", "BFF"),
      openingMessage: buildOpeningL3(
        "RAG",
        "BFF Gateway",
        "serve optimized query APIs with preprocessing, result ranking, and citation formatting for clients",
        "RAG's BFF Gateway serves the client with optimized query APIs. The BFF handles query preprocessing, result ranking, and citation formatting — aggregating multiple retrieval results into a coherent response.",
        "BFF Gateway"
      ),
      celebrationMessage: buildCelebration(
        "BFF Gateway",
        "Service Mesh",
        "BFF optimizes API for client needs. Query preprocessing, ranking, and citation formatting — clients receive coherent responses.",
        "Token Bucket Limiter"
      ),
      messages: [
        msg("BFF Gateway optimizes API for client needs."),
        msg("The BFF handles query preprocessing, result ranking, and citation formatting — aggregating multiple retrieval results into a coherent response for the client."),
        msg("Press ⌘K and search for \"API Gateway\" and press Enter to add it for BFF, then connect Service Mesh → BFF Gateway."),
      ],
      requiredNodes: ["bff_gateway"],
      requiredEdges: [edge("service_mesh", "bff_gateway")],
      successMessage: "BFF gateway added. Now the rate limiter.",
      errorMessage: "Add an API Gateway and connect Service Mesh → BFF Gateway.",
    }),
    step({
      id: 3,
      title: "Add Token Bucket Rate Limiter",
      explanation:
        "RAG's Rate Limiter uses token buckets per API key: free tier (10 queries/min), pro tier (100/min), enterprise (unlimited). Token buckets prevent expensive embedding generation from being abused.",
      action: buildAction(
        "Rate Limiter",
        "BFF Gateway",
        "Token Bucket Limiter",
        "queries being rate-limited per API key with token buckets: free (10/min), pro (100/min), enterprise (unlimited)"
      ),
      why: "Token buckets prevent abuse of expensive embedding generation. Different tiers have different limits — free tier caps costs, enterprise tier enables unlimited usage.",
      component: component("token_bucket_limiter", "Rate Limiter"),
      openingMessage: buildOpeningL3(
        "RAG",
        "Token Bucket Rate Limiter",
        "enforce per-API-key rate limits with token buckets: free tier (10/min), pro tier (100/min), enterprise (unlimited)",
        "RAG's Rate Limiter uses token buckets per API key: free tier (10 queries/min), pro tier (100/min), enterprise (unlimited). Token buckets prevent expensive embedding generation from being abused.",
        "Token Bucket Limiter"
      ),
      celebrationMessage: buildCelebration(
        "Token Bucket Limiter",
        "BFF Gateway",
        "Token buckets prevent abuse of expensive embedding generation. Different tiers have different limits — free tier caps costs, enterprise tier enables unlimited.",
        "OpenTelemetry Collector"
      ),
      messages: [
        msg("Token Bucket Rate Limiter enforces tier-based limits."),
        msg("Free tier: 10 queries/min, Pro tier: 100/min, Enterprise: unlimited. Token buckets prevent expensive embedding generation abuse."),
        msg("Press ⌘K and search for \"Rate Limiter\" and press Enter to add it, then connect BFF Gateway → Token Bucket Limiter."),
      ],
      requiredNodes: ["token_bucket_limiter"],
      requiredEdges: [edge("bff_gateway", "token_bucket_limiter")],
      successMessage: "Rate limiter added. Now the OTel collector.",
      errorMessage: "Add a Rate Limiter and connect BFF Gateway → Token Bucket Limiter.",
    }),
    step({
      id: 4,
      title: "Add OpenTelemetry Collector",
      explanation:
        "RAG's OTel Collector traces queries through embedding lookup, vector search, reranking, and LLM synthesis. A single query touches 10+ services — tracing is essential for debugging hallucinated answers.",
      action: buildAction(
        "Metrics Collector",
        "RAG Pipeline",
        "OpenTelemetry Collector",
        "queries being traced through embedding lookup, vector search, reranking, and LLM synthesis for debugging"
      ),
      why: "A single RAG query touches 10+ services. Distributed tracing through OTel is essential for debugging hallucinated answers — you must trace the entire retrieval pipeline.",
      component: component("otel_collector", "OTel"),
      openingMessage: buildOpeningL3(
        "RAG",
        "OpenTelemetry Collector",
        "trace queries through embedding lookup, vector search, reranking, and LLM synthesis for debugging",
        "RAG's OTel Collector traces queries through embedding lookup, vector search, reranking, and LLM synthesis. A single query touches 10+ services — tracing is essential for debugging hallucinated answers.",
        "OpenTelemetry Collector"
      ),
      celebrationMessage: buildCelebration(
        "OpenTelemetry Collector",
        "RAG Pipeline",
        "A single RAG query touches 10+ services. Distributed tracing through OTel is essential for debugging hallucinated answers.",
        "Correlation ID Handler"
      ),
      messages: [
        msg("OpenTelemetry Collector traces queries end-to-end."),
        msg("A single RAG query touches embedding lookup, vector search, reranking, and LLM synthesis — 10+ services. Tracing is essential for debugging hallucinated answers."),
        msg("Press ⌘K and search for \"Metrics Collector\" and press Enter to add it for OTel, then connect RAG Pipeline → OpenTelemetry Collector."),
      ],
      requiredNodes: ["otel_collector"],
      requiredEdges: [edge("rag_pipeline", "otel_collector")],
      successMessage: "OTel collector added. Now the correlation ID handler.",
      errorMessage: "Add a Metrics Collector and connect RAG Pipeline → OpenTelemetry Collector.",
    }),
    step({
      id: 5,
      title: "Add Correlation ID Handler",
      explanation:
        "RAG's Correlation ID links a query to every step: embedding lookup, vector search, reranking, LLM call, and citation generation. Debugging a hallucinated answer requires tracing the entire retrieval pipeline.",
      action: buildAction(
        "Trace Context",
        "BFF Gateway",
        "Correlation ID Handler",
        "correlation IDs linking a query to embedding lookup, vector search, reranking, LLM call, and citation generation"
      ),
      why: "Correlation IDs enable end-to-end tracing. A hallucinated answer requires tracing the entire retrieval pipeline — correlation IDs link every step.",
      component: component("correlation_id_handler", "Correlation ID"),
      openingMessage: buildOpeningL3(
        "RAG",
        "Correlation ID Handler",
        "link queries to every step: embedding lookup, vector search, reranking, LLM call, and citation generation",
        "RAG's Correlation ID links a query to every step: embedding lookup, vector search, reranking, LLM call, and citation generation. Debugging a hallucinated answer requires tracing the entire retrieval pipeline.",
        "Correlation ID Handler"
      ),
      celebrationMessage: buildCelebration(
        "Correlation ID Handler",
        "BFF Gateway",
        "Correlation IDs enable end-to-end tracing. A hallucinated answer requires tracing the entire retrieval pipeline.",
        "mTLS Certificate Authority"
      ),
      messages: [
        msg("Correlation ID Handler links queries to every step."),
        msg("Embedding lookup, vector search, reranking, LLM call, and citation generation — all linked by correlation ID for complete traceability."),
        msg("Press ⌘K and search for \"Trace Context\" and press Enter to add it, then connect BFF Gateway → Correlation ID Handler."),
      ],
      requiredNodes: ["correlation_id_handler"],
      requiredEdges: [edge("bff_gateway", "correlation_id_handler")],
      successMessage: "Correlation ID handler added. Now the mTLS CA.",
      errorMessage: "Add a Trace Context and connect BFF Gateway → Correlation ID Handler.",
    }),
    step({
      id: 6,
      title: "Add mTLS Certificate Authority",
      explanation:
        "RAG's SPIFFE CA issues certificates to every service. LLM API keys are stored in secrets management — services authenticate with mTLS before retrieving API keys.",
      action: buildAction(
        "Certificate Authority",
        "Service Mesh",
        "mTLS Certificate Authority",
        "SPIFFE certificates being issued to every service with secrets management for LLM API keys"
      ),
      why: "SPIFFE CA provides identity for zero-trust. Services authenticate with mTLS before retrieving LLM API keys from secrets management.",
      component: component("mtls_certificate_authority", "SPIFFE CA"),
      openingMessage: buildOpeningL3(
        "RAG",
        "mTLS Certificate Authority",
        "issue SPIFFE certificates to every service with secrets management for LLM API key retrieval",
        "RAG's SPIFFE CA issues certificates to every service. LLM API keys are stored in secrets management — services authenticate with mTLS before retrieving API keys.",
        "mTLS Certificate Authority"
      ),
      celebrationMessage: buildCelebration(
        "mTLS Certificate Authority",
        "Service Mesh",
        "SPIFFE CA provides identity for zero-trust. Services authenticate with mTLS before retrieving LLM API keys from secrets management.",
        "Cache Stampede Guard"
      ),
      messages: [
        msg("mTLS Certificate Authority issues SPIFFE certificates."),
        msg("Every service authenticates with mTLS before retrieving LLM API keys from secrets management. This is zero-trust security."),
        msg("Press ⌘K and search for \"Certificate Authority\" and press Enter to add it, then connect Service Mesh → mTLS Certificate Authority."),
      ],
      requiredNodes: ["mtls_certificate_authority"],
      requiredEdges: [edge("service_mesh", "mtls_certificate_authority")],
      successMessage: "mTLS CA added. Now the cache stampede guard.",
      errorMessage: "Add a Certificate Authority and connect Service Mesh → mTLS Certificate Authority.",
    }),
    step({
      id: 7,
      title: "Add Cache Stampede Guard",
      explanation:
        "RAG's Cache Stampede Guard prevents embedding cache stampedes when a popular document's embeddings expire. Lock-assisted refresh ensures only one worker regenerates expensive embeddings.",
      action: buildAction(
        "Cache Stampede Prevention",
        "In-Memory Cache",
        "Cache Stampede Guard",
        "embedding cache stampedes being prevented with lock-assisted refresh when popular document embeddings expire"
      ),
      why: "When cache expires for popular documents, thousands of requests could regenerate embeddings simultaneously. Lock-assisted refresh ensures only one worker regenerates.",
      component: component("cache_stampede_guard", "Cache Stampede"),
      openingMessage: buildOpeningL3(
        "RAG",
        "Cache Stampede Guard",
        "prevent embedding cache stampedes with lock-assisted refresh when popular document embeddings expire",
        "RAG's Cache Stampede Guard prevents embedding cache stampedes when a popular document's embeddings expire. Lock-assisted refresh ensures only one worker regenerates expensive embeddings.",
        "Cache Stampede Guard"
      ),
      celebrationMessage: buildCelebration(
        "Cache Stampede Guard",
        "In-Memory Cache",
        "When cache expires for popular documents, thousands of requests could regenerate embeddings simultaneously. Lock-assisted refresh ensures only one worker regenerates.",
        "Change Data Cache"
      ),
      messages: [
        msg("Cache Stampede Guard prevents thundering herd."),
        msg("When a popular document's embeddings expire, lock-assisted refresh ensures only one worker regenerates expensive embeddings — not thousands."),
        msg("Press ⌘K and search for \"Cache Stampede Prevention\" and press Enter to add it, then connect In-Memory Cache → Cache Stampede Guard."),
      ],
      requiredNodes: ["cache_stampede_guard"],
      requiredEdges: [edge("in_memory_cache", "cache_stampede_guard")],
      successMessage: "Cache stampede guard added. Now the CDC cache.",
      errorMessage: "Add a Cache Stampede Prevention and connect In-Memory Cache → Cache Stampede Guard.",
    }),
    step({
      id: 8,
      title: "Add Change Data Cache",
      explanation:
        "RAG's CDC pipeline precomputes query result caches and frequently accessed document embeddings. These are materialized in Redis for sub-10ms retrieval during query time.",
      action: buildAction(
        "Change Data Cache",
        "CDC Connector",
        "Change Data Cache",
        "query result caches and document embeddings being precomputed and materialized in Redis for fast retrieval"
      ),
      why: "CDC captures data changes and precomputes caches. Materialized in Redis for sub-10ms retrieval — query time doesn't pay the compute cost.",
      component: component("change_data_cache", "CDC Cache"),
      openingMessage: buildOpeningL3(
        "RAG",
        "Change Data Cache",
        "precompute query result caches and document embeddings in Redis for sub-10ms retrieval at query time",
        "RAG's CDC pipeline precomputes query result caches and frequently accessed document embeddings. These are materialized in Redis for sub-10ms retrieval during query time.",
        "Change Data Cache"
      ),
      celebrationMessage: buildCelebration(
        "Change Data Cache",
        "CDC Connector",
        "CDC captures data changes and precomputes caches. Materialized in Redis for sub-10ms retrieval — query time doesn't pay the compute cost.",
        "Data Warehouse"
      ),
      messages: [
        msg("Change Data Cache precomputes caches from CDC."),
        msg("Query result caches and frequently accessed document embeddings are materialized in Redis for sub-10ms retrieval. Query time doesn't pay the compute cost."),
        msg("Press ⌘K and search for \"Change Data Cache\" and press Enter to add it, then connect CDC Connector → Change Data Cache."),
      ],
      requiredNodes: ["change_data_cache"],
      requiredEdges: [edge("cdc_connector", "change_data_cache")],
      successMessage: "CDC cache added. Now the data warehouse.",
      errorMessage: "Add a Change Data Cache and connect CDC Connector → Change Data Cache.",
    }),
    step({
      id: 9,
      title: "Add Data Warehouse",
      explanation:
        "RAG's Data Warehouse (ClickHouse) stores query logs, retrieval quality metrics, and user feedback. This data trains reranking models, improves chunking strategies, and identifies knowledge gaps.",
      action: buildAction(
        "Data Warehouse",
        "Kafka Streaming",
        "ClickHouse",
        "query logs, retrieval quality metrics, and user feedback being stored for training reranking models"
      ),
      why: "Data warehouse stores query logs and quality metrics. This data trains reranking models, improves chunking strategies, and identifies knowledge gaps.",
      component: component("data_warehouse", "ClickHouse"),
      openingMessage: buildOpeningL3(
        "RAG",
        "Data Warehouse",
        "store query logs, retrieval quality metrics, and user feedback for reranking model training and improvement",
        "RAG's Data Warehouse (ClickHouse) stores query logs, retrieval quality metrics, and user feedback. This data trains reranking models, improves chunking strategies, and identifies knowledge gaps.",
        "Data Warehouse"
      ),
      celebrationMessage: buildCelebration(
        "Data Warehouse",
        "Kafka Streaming",
        "Data warehouse stores query logs and quality metrics. This data trains reranking models, improves chunking, and identifies knowledge gaps.",
        "Event Store"
      ),
      messages: [
        msg("Data Warehouse stores query logs and quality metrics."),
        msg("Query logs, retrieval quality metrics, and user feedback train reranking models, improve chunking strategies, and identify knowledge gaps."),
        msg("Press ⌘K and search for \"Data Warehouse\" and press Enter to add it, then connect Kafka Streaming → Data Warehouse."),
      ],
      requiredNodes: ["data_warehouse"],
      requiredEdges: [edge("kafka_streaming", "data_warehouse")],
      successMessage: "Data warehouse added. Now the event store.",
      errorMessage: "Add a Data Warehouse and connect Kafka Streaming → Data Warehouse.",
    }),
    step({
      id: 10,
      title: "Add Event Store",
      explanation:
        "RAG's Event Store stores every document ingestion event and query event. Immutable event logs enable audit trails for compliance — critical for enterprise RAG deployments on sensitive documents.",
      action: buildAction(
        "Event Store",
        "Kafka Streaming",
        "Event Store",
        "every document ingestion event and query event being stored for immutable audit trails"
      ),
      why: "Event store provides immutable audit trails. Enterprise RAG on sensitive documents requires compliance — who accessed what document and when.",
      component: component("event_store", "Event Store"),
      openingMessage: buildOpeningL3(
        "RAG",
        "Event Store",
        "store every document ingestion and query event for immutable audit trails critical for compliance",
        "RAG's Event Store stores every document ingestion event and query event. Immutable event logs enable audit trails for compliance — critical for enterprise RAG deployments on sensitive documents.",
        "Event Store"
      ),
      celebrationMessage: buildCelebration(
        "Event Store",
        "Kafka Streaming",
        "Event store provides immutable audit trails. Enterprise RAG on sensitive documents requires compliance — who accessed what document and when.",
        "Prefetch Cache"
      ),
      messages: [
        msg("Event Store maintains immutable audit logs."),
        msg("Every document ingestion event and query event is stored. Immutable logs enable audit trails for compliance — critical for enterprise RAG on sensitive documents."),
        msg("Press ⌘K and search for \"Event Store\" and press Enter to add it, then connect Kafka Streaming → Event Store."),
      ],
      requiredNodes: ["event_store"],
      requiredEdges: [edge("kafka_streaming", "event_store")],
      successMessage: "Event store added. Now the prefetch cache.",
      errorMessage: "Add an Event Store and connect Kafka Streaming → Event Store.",
    }),
    step({
      id: 11,
      title: "Add Prefetch Cache",
      explanation:
        "RAG's Prefetch Cache anticipates queries based on document similarity. When a user queries about a document, embeddings for semantically similar documents are preloaded into cache.",
      action: buildAction(
        "Prefetch Cache",
        "Vector DB",
        "Prefetch Cache",
        "semantically similar document embeddings being preloaded into cache based on document similarity"
      ),
      why: "Prefetching based on document similarity reduces query latency. When a user queries about a document, similar documents are pre-cached for fast retrieval.",
      component: component("prefetch_cache", "Prefetch"),
      openingMessage: buildOpeningL3(
        "RAG",
        "Prefetch Cache",
        "preload semantically similar document embeddings into cache based on document similarity for faster retrieval",
        "RAG's Prefetch Cache anticipates queries based on document similarity. When a user queries about a document, embeddings for semantically similar documents are preloaded into cache.",
        "Prefetch Cache"
      ),
      celebrationMessage: buildCelebration(
        "Prefetch Cache",
        "Vector DB",
        "Prefetching based on document similarity reduces query latency. When a user queries about a document, similar documents are pre-cached.",
        "completion"
      ),
      messages: [
        msg("Prefetch Cache anticipates queries."),
        msg("Based on document similarity, embeddings for semantically similar documents are preloaded into cache. This reduces query latency for related topics."),
        msg("Press ⌘K and search for \"Prefetch Cache\" and press Enter to add it, then connect Vector DB → Prefetch Cache. This completes the RAG Enterprise architecture!"),
      ],
      requiredNodes: ["prefetch_cache"],
      requiredEdges: [edge("vector_db", "prefetch_cache")],
      successMessage: "Prefetch cache added. RAG Enterprise is complete!",
      errorMessage: "Add a Prefetch Cache and connect Vector DB → Prefetch Cache.",
    }),
  ],
});

export const ragTutorial: Tutorial = tutorial({
  id: 'rag-application-architecture',
  title: 'How to Design a RAG Application',
  description:
    'Build a production RAG (Retrieval-Augmented Generation) system. Learn document ingestion, chunking strategies, vector embeddings, semantic search, and LLM synthesis at scale.',
  difficulty: 'Intermediate',
  category: 'AI Systems',
  isLive: false,
  icon: 'Brain',
  color: '#ec4899',
  tags: ['Vector DB', 'Embeddings', 'LLM', 'Retrieval'],
  estimatedTime: '~87 mins',
  levels: [l1, l2, l3],
});
