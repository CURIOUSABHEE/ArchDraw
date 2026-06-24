import { runMermaidPipeline } from '../lib/mermaid/pipeline';

const mermaidCode = `graph TD

  subgraph ClientContainer["Client Container"]
    Client["Client<br>[React]"]
  end

  subgraph EdgeLayer["Edge Layer"]
    ApiGateway["API Gateway<br>[Nginx]"]
    Cdn["CDN<br>[Cloudflare]"]
  end

  subgraph ApplicationServer["Application Server"]
    TranscodingWorker["Transcoding Worker<br>[FFmpeg]"]
    ObjectStorage[("S3<br>[S3]")]
    Database[("PostgreSQL<br>[PostgreSQL]")]
    RecommendationEngine["Recommendation Engine<br>[Python]"]
    AnalyticsEventStream["Analytics Event Stream<br>[Kafka]"]
    SearchService["Search Service<br>[Elasticsearch]"]
    UserProfileService["User Profile Service<br>[Go]"]
    MusicLibraryService["Music Library Service<br>[Java]"]
    NotificationService["Notification Service<br>[Go]"]
  end

  subgraph CacheLayer["Cache Layer"]
    Cache[("Redis<br>[Redis]")]
  end

  Client -->|"HTTPS REST"| ApiGateway
  ApiGateway -->|"REST API"| UserProfileService
  ApiGateway -->|"REST API"| MusicLibraryService
  ApiGateway -->|"HTTP request"| Cdn
  Cdn -->|"Origin Pull"| ObjectStorage
  Client -->|"HTTPS request"| TranscodingWorker
  ApiGateway -->|"gRPC request"| RecommendationEngine
  MusicLibraryService -.->|"Kafka event"| AnalyticsEventStream
  ApiGateway -->|"REST API"| SearchService
  UserProfileService -->|"SQL Query"| Database
  UserProfileService -->|"Read/Write"| Cache
  MusicLibraryService -->|"SQL Query"| Database
  MusicLibraryService -->|"Read/Write"| Cache
  TranscodingWorker -->|"Read/Write"| ObjectStorage
  AnalyticsEventStream -.->|"consume events"| RecommendationEngine
`;

console.log("Running layout pipeline...");
const result = runMermaidPipeline(mermaidCode);

console.log("Success:", result.success);
console.log("Warnings:", result.warnings);

console.log("\n================ NODES ================");
result.nodes.forEach(n => {
  if (n.type !== 'groupNode') {
    console.log(`Node [${n.id}] parent: "${n.parentNode || ''}", position: (${n.position.x.toFixed(1)}, ${n.position.y.toFixed(1)}), size: ${n.width}x${n.height}, absolute: (${(n.position.x + (n.parentNode ? 0 : 0)).toFixed(1)})`);
  } else {
    console.log(`Group Node [${n.id}] position: (${n.position.x.toFixed(1)}, ${n.position.y.toFixed(1)}), size: ${n.style?.width}x${n.style?.height}`);
  }
});
