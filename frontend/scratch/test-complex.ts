import { runMermaidPipeline } from '../lib/mermaid/pipeline';

const ecommerceCode = `graph LR
  subgraph CLIENTS["Client Devices"]
    web_app["Desktop React SPA"]
    mobile_app["React Native iOS/Android"]
  end

  subgraph ROUTING["Edge Routing"]
    cdn["Cloudflare CDN"]
    api_gateway["Kong API Gateway"]
  end

  subgraph SERVICES["Business Logic Tier"]
    auth_service["Auth Service"]
    cart_service["Cart Service"]
    order_service["Order Service"]
    inventory_service["Inventory Service"]
  end

  subgraph BUS["Async Event Broker"]
    kafka["Kafka Event Broker"]
    order_processor["Order Processing Worker"]
  end

  subgraph DATA["Storage Tier"]
    postgres_db[("PostgreSQL User DB")]
    redis_cache[("Redis Session Cache")]
    mongo_db[("MongoDB Catalog DB")]
  end

  subgraph THIRD_PARTY["External Gateways"]
    stripe["Stripe Payment Gateway"]
    sendgrid["SendGrid Notification API"]
  end

  web_app -->|"HTTPS"| cdn
  mobile_app -->|"HTTPS"| cdn
  cdn -->|"Forward"| api_gateway
  api_gateway -->|"Verify Token"| auth_service
  api_gateway -->|"Manage Items"| cart_service
  api_gateway -->|"Create Order"| order_service
  api_gateway -->|"Check Stock"| inventory_service
  auth_service -->|"Read Credentials"| postgres_db
  cart_service -->|"Cache Sessions"| redis_cache
  inventory_service -->|"Query Products"| mongo_db
  order_service -->|"Publish Order Event"| kafka
  kafka -.->|"Subscribe & Consume"| order_processor
  order_processor -->|"Charge Cards"| stripe
  order_processor -->|"Send Invoices"| sendgrid
`;

const videoCode = `graph TD
  subgraph CLIENTS["Playback Clients"]
    browser["Web Browser Player"]
    smart_tv["Smart TV App"]
  end

  subgraph INGEST["Ingestion & Transcoding"]
    upload_client["Video Upload Client"]
    s3_raw[("S3 Raw Uploads")]
    transcoder["FFmpeg Transcoder"]
    s3_processed[("S3 HLS/DASH Assets")]
    cdn["CloudFront CDN origin"]
  end

  subgraph CHAT["Real-time Live Chat"]
    ws_gateway["WebSocket Gateway"]
    redis_pubsub[("Redis PubSub Broker")]
    chat_service["Live Chat Service"]
    mongo_chat[("MongoDB Messages")]
  end

  upload_client -->|"Upload Video"| s3_raw
  s3_raw -->|"Trigger Job"| transcoder
  transcoder -->|"Save Transcoded"| s3_processed
  s3_processed -->|"Pull Stream"| cdn
  cdn -->|"Stream Video"| browser
  cdn -->|"Stream Video"| smart_tv
  browser <-->|"WebSocket WS"| ws_gateway
  ws_gateway -->|"Dispatch Event"| redis_pubsub
  redis_pubsub -->|"Route Event"| chat_service
  chat_service -->|"Persist History"| mongo_chat
`;

function printLayout(title: string, mermaidCode: string) {
  console.log(`\n=================== ${title} ===================`);
  const result = runMermaidPipeline(mermaidCode);
  console.log("Success:", result.success);
  console.log("Warnings:", result.warnings);
  
  result.nodes.forEach(n => {
    if (n.type !== 'groupNode') {
      console.log(`Node [${n.id}] parent: "${n.parentNode || ''}", relative: (${n.position.x.toFixed(1)}, ${n.position.y.toFixed(1)}), size: ${n.width}x${n.height}`);
    } else {
      console.log(`Group Node [${n.id}] position: (${n.position.x.toFixed(1)}, ${n.position.y.toFixed(1)}), size: ${n.style?.width}x${n.style?.height}`);
    }
  });
}

printLayout("E-Commerce", ecommerceCode);
printLayout("Video Streaming", videoCode);
