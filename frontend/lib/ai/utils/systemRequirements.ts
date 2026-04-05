export interface SystemComponentRequirements {
  requiredGroups: string[];
  requiredLeafNodes: string[];
  optionalNodes: string[];
  requiredEdges: string[][];
  description: string;
}

export const SYSTEM_COMPONENT_REQUIREMENTS: Record<string, SystemComponentRequirements> = {
  'Streaming Platform': {
    requiredGroups: [
      'CLIENT_APPLICATIONS',
      'EDGE_DELIVERY',
      'API_GATEWAY',
      'CONTENT_SERVICES',
      'MEDIA_PROCESSING',
      'RECOMMENDATION_ENGINE',
      'DATA_LAYER',
      'MESSAGING',
      'ANALYTICS',
      'EXTERNAL_SERVICES'
    ],
    requiredLeafNodes: [
      // Client Layer
      'Web Browser Client',
      'Mobile iOS App',
      'Mobile Android App',
      'Smart TV App',
      
      // Edge Layer
      'CloudFront CDN',
      'Edge Locations',
      'DDOS Protection',
      
      // Gateway
      'API Gateway',
      'Authentication Service',
      'Rate Limiter',
      
      // Content Services
      'Video Upload Service',
      'Content Ingestion API',
      'Metadata Service',
      'Content Catalog Service',
      'Entitlement Service',
      
      // Media Processing
      'Transcoding Service',
      'Encoding Pipeline',
      'Video Segmentation',
      'Thumbnail Generator',
      'DRM Service',
      
      // Recommendation
      'Recommendation Engine',
      'Personalization Service',
      'A/B Testing Service',
      'View History Service',
      
      // Data Layer
      'User Profile Database',
      'Content Metadata DB',
      'View History DB',
      'Redis Session Cache',
      'Redis Content Cache',
      'Object Storage (S3)',
      'Video Blob Storage',
      
      // Messaging
      'Kafka Cluster',
      'Event Stream Processor',
      
      // Analytics
      'Clickstream Analytics',
      'Metrics Collector',
      'Alerting Service',
      'Logging Pipeline'
    ],
    optionalNodes: [
      'Multi-Region Router',
      'Geo-DNS Service',
      'CDN Config Service',
      'Video Quality Monitor',
      'Fraud Detection',
      'Content Moderation'
    ],
    requiredEdges: [
      ['Web Browser Client', 'CloudFront CDN'],
      ['Mobile iOS App', 'CloudFront CDN'],
      ['CloudFront CDN', 'API Gateway'],
      ['API Gateway', 'Authentication Service'],
      ['Authentication Service', 'User Profile Database'],
      ['Video Upload Service', 'Content Ingestion API'],
      ['Content Ingestion API', 'Kafka Cluster'],
      ['Kafka Cluster', 'Transcoding Service'],
      ['Transcoding Service', 'Encoding Pipeline'],
      ['Encoding Pipeline', 'Object Storage (S3)'],
      ['Object Storage (S3)', 'CloudFront CDN'],
      ['CloudFront CDN', 'Playback Service'],
      ['Playback Service', 'Redis Content Cache'],
      ['Redis Content Cache', 'Content Metadata DB'],
      ['Metadata Service', 'Content Metadata DB'],
      ['Recommendation Engine', 'View History Service'],
      ['View History Service', 'View History DB'],
      ['Personalization Service', 'Redis Session Cache'],
      ['Clickstream Analytics', 'Kafka Cluster']
    ],
    description: 'Netflix-like video streaming platform with content delivery, transcoding, DRM, recommendations, and multi-layer caching'
  },
  'E-commerce Platform': {
    requiredGroups: [
      'CLIENT_APPLICATIONS',
      'EDGE_LAYER',
      'API_GATEWAY',
      'CORE_SERVICES',
      'ORDER_PROCESSING',
      'INVENTORY_MANAGEMENT',
      'PAYMENT_PROCESSING',
      'SEARCH_CATALOG',
      'DATA_LAYER',
      'MESSAGING',
      'ANALYTICS',
      'EXTERNAL_SERVICES'
    ],
    requiredLeafNodes: [
      // Client
      'Web Storefront',
      'Mobile iOS App',
      'Mobile Android App',
      'Admin Dashboard',
      
      // Edge
      'CloudFront CDN',
      'WAF Security',
      'Load Balancer',
      
      // Gateway
      'API Gateway',
      'Auth Service',
      'Token Service',
      
      // Core Services
      'User Service',
      'Account Service',
      'Address Service',
      
      // Catalog/Search
      'Product Catalog Service',
      'Search Service',
      'Elasticsearch Cluster',
      'Recommendation Service',
      'Pricing Service',
      'Inventory Service',
      
      // Order Processing
      'Cart Service',
      'Checkout Service',
      'Order Service',
      'Fraud Detection',
      'Coupon Service',
      
      // Payment
      'Payment Gateway',
      'Stripe Integration',
      'PayPal Integration',
      'Billing Service',
      
      // Data Layer
      'User Database',
      'Product Database',
      'Order Database',
      'Redis Session Cache',
      'Redis Product Cache',
      'MongoDB Document Store',
      
      // Messaging
      'RabbitMQ',
      'Order Event Processor',
      
      // Analytics
      'Clickstream Analytics',
      'Customer Analytics',
      'Inventory Analytics'
    ],
    optionalNodes: [
      'Wishlist Service',
      'Review Service',
      'Notification Service',
      'Email Service',
      'SMS Service',
      'Return Processing'
    ],
    requiredEdges: [
      ['Web Storefront', 'CloudFront CDN'],
      ['Mobile iOS App', 'CloudFront CDN'],
      ['CloudFront CDN', 'Load Balancer'],
      ['Load Balancer', 'API Gateway'],
      ['API Gateway', 'Auth Service'],
      ['Auth Service', 'Token Service'],
      ['Token Service', 'Redis Session Cache'],
      ['Product Catalog Service', 'Search Service'],
      ['Search Service', 'Elasticsearch Cluster'],
      ['Redis Product Cache', 'Product Database'],
      ['Cart Service', 'Checkout Service'],
      ['Checkout Service', 'Fraud Detection'],
      ['Fraud Detection', 'Payment Gateway'],
      ['Payment Gateway', 'Order Service'],
      ['Order Service', 'RabbitMQ'],
      ['RabbitMQ', 'Inventory Service'],
      ['Inventory Service', 'Product Database'],
      ['Clickstream Analytics', 'Customer Analytics']
    ],
    description: 'Full e-commerce platform with product catalog, cart, checkout, payments, fraud detection, and analytics'
  },
  'Ride-sharing Platform': {
    requiredGroups: [
      'CLIENT_APPLICATIONS',
      'API_GATEWAY',
      'CORE_SERVICES',
      'MATCHING_ENGINE',
      'TRACKING',
      'PRICING_BILLING',
      'DRIVER_MANAGEMENT',
      'DATA_LAYER',
      'MESSAGING',
      'NOTIFICATIONS',
      'ANALYTICS'
    ],
    requiredLeafNodes: [
      // Clients
      'Rider Mobile App',
      'Driver Mobile App',
      'Admin Dashboard',
      
      // Gateway
      'API Gateway',
      'Auth Service',
      'Rate Limiter',
      
      // Core
      'User Service',
      'Session Service',
      'Location Service',
      
      // Matching
      'Ride Request Service',
      'Matching Engine',
      'Driver Dispatch Service',
      'Ride Allocation Service',
      
      // Tracking
      'Trip Tracking Service',
      'Real-time Location Tracker',
      'GPS Data Processor',
      'Route Optimization Service',
      
      // Pricing
      'Dynamic Pricing Engine',
      'Surge Pricing Service',
      'Billing Service',
      'Invoice Generator',
      
      // Driver
      'Driver Onboarding Service',
      'Driver Status Service',
      'Driver Rating Service',
      'Driver Earnings Service',
      
      // Data
      'User Database',
      'Trip History Database',
      'Driver Database',
      'Pricing Database',
      'Redis Session Cache',
      'Redis Geospatial Cache',
      'PostgreSQL Transaction DB',
      
      // Messaging
      'Kafka Event Bus',
      'Location Event Stream',
      'Trip Event Processor',
      
      // Notifications
      'Push Notification Service',
      'SMS Notification Service',
      'Email Notification Service',
      
      // Analytics
      'Analytics Pipeline',
      'Revenue Analytics',
      'Driver Performance Metrics'
    ],
    optionalNodes: [
      'Safety Monitoring Service',
      'Incident Response Service',
      'Support Ticket System',
      'Insurance Verification',
      'Multi-region Router'
    ],
    requiredEdges: [
      ['Rider Mobile App', 'API Gateway'],
      ['Driver Mobile App', 'API Gateway'],
      ['API Gateway', 'Auth Service'],
      ['Auth Service', 'User Service'],
      ['Ride Request Service', 'Matching Engine'],
      ['Matching Engine', 'Driver Dispatch Service'],
      ['Driver Dispatch Service', 'Driver Status Service'],
      ['Real-time Location Tracker', 'Redis Geospatial Cache'],
      ['Redis Geospatial Cache', 'Trip History Database'],
      ['Trip Tracking Service', 'Route Optimization Service'],
      ['Dynamic Pricing Engine', 'Surge Pricing Service'],
      ['Surge Pricing Service', 'Billing Service'],
      ['Billing Service', 'Invoice Generator'],
      ['Invoice Generator', 'Payment Service'],
      ['Kafka Event Bus', 'Trip Event Processor'],
      ['Analytics Pipeline', 'Revenue Analytics']
    ],
    description: 'Uber-like ride-sharing with real-time matching, driver management, dynamic pricing, and tracking'
  },
  'Real-time Messaging': {
    requiredGroups: [
      'CLIENT_APPLICATIONS',
      'API_GATEWAY',
      'WEBSOCKET_LAYER',
      'MESSAGING_CORE',
      'PRESENCE',
      'NOTIFICATIONS',
      'DATA_LAYER',
      'MESSAGING_QUEUE',
      'SEARCH',
      'ANALYTICS'
    ],
    requiredLeafNodes: [
      // Clients
      'Web Chat Client',
      'Mobile iOS Client',
      'Mobile Android Client',
      'Desktop App',
      
      // Gateway
      'API Gateway',
      'Auth Service',
      
      // WebSocket
      'WebSocket Gateway',
      'WebSocket Manager',
      'Connection Pool',
      'Heartbeat Service',
      
      // Core Messaging
      'Message Router',
      'Channel Service',
      'Conversation Service',
      'Message Processor',
      'Message Database (Cassandra)',
      
      // Presence
      'Presence Service',
      'Online Status Tracker',
      'Typing Indicator Service',
      'Read Receipt Service',
      
      // Notifications
      'Push Notification Service',
      'FCM Integration',
      'APNS Integration',
      
      // Data
      'User Database',
      'Channel Database',
      'Message Archive',
      'Redis Session Cache',
      'Redis Pub/Sub',
      
      // Queue
      'RabbitMQ',
      'Message Queue Worker',
      'Delivery Confirmation Worker',
      
      // Search
      'Message Search Service',
      'Elasticsearch',
      
      // Analytics
      'Analytics Collector',
      'User Engagement Metrics'
    ],
    optionalNodes: [
      'Group Management Service',
      'Media Upload Service',
      'Message Translation Service',
      'Bot Integration Service',
      'Message Reactions Service'
    ],
    requiredEdges: [
      ['Web Chat Client', 'WebSocket Gateway'],
      ['Mobile iOS Client', 'WebSocket Gateway'],
      ['WebSocket Gateway', 'WebSocket Manager'],
      ['WebSocket Manager', 'Message Router'],
      ['Message Router', 'Channel Service'],
      ['Channel Service', 'Message Processor'],
      ['Message Processor', 'Message Database (Cassandra)'],
      ['Presence Service', 'Redis Pub/Sub'],
      ['Redis Pub/Sub', 'Online Status Tracker'],
      ['Push Notification Service', 'FCM Integration'],
      ['Message Search Service', 'Elasticsearch'],
      ['Analytics Collector', 'User Engagement Metrics']
    ],
    description: 'Slack/Discord-like real-time messaging with WebSocket, presence, channels, and notifications'
  },
  'IoT Platform': {
    requiredGroups: [
      'DEVICES',
      'EDGE_GATEWAY',
      'INGESTION',
      'STREAM_PROCESSING',
      'REAL_TIME_ANALYTICS',
      'BATCH_PROCESSING',
      'STORAGE',
      'ML_INFERENCE',
      'ALERTING',
      'DEVICE_MANAGEMENT'
    ],
    requiredLeafNodes: [
      // Devices
      'IoT Sensors',
      'Smart Devices',
      'Gateways',
      'Edge Controllers',
      
      // Edge
      'MQTT Broker',
      'Edge Computing Node',
      'Local Cache',
      'Protocol Bridge',
      
      // Ingestion
      'Device Ingestion Service',
      'Device Registry',
      'Device Provisioning Service',
      'Certificate Manager',
      
      // Stream Processing
      'Kafka Streams',
      'Stream Processor',
      'Window Aggregation',
      'Anomaly Detection',
      
      // Real-time Analytics
      'Real-time Dashboard',
      'Time-series Aggregator',
      'Metric Calculator',
      
      // Batch
      'Spark Batch Jobs',
      'Data Lake Ingestion',
      'ETL Pipeline',
      
      // Storage
      'Time-series Database',
      'Object Storage',
      'Redis Hot Storage',
      'InfluxDB',
      
      // ML
      'ML Inference Service',
      'Model Registry',
      'Prediction Worker',
      
      // Alerting
      'Alert Manager',
      'Notification Gateway',
      'PagerDuty Integration',
      
      // Management
      'Device Firmware Service',
      'OTA Update Service',
      'Device Monitoring'
    ],
    optionalNodes: [
      'Digital Twin Service',
      'Simulation Engine',
      'Geospatial Processor',
      'Rule Engine',
      'Device Shadow Service'
    ],
    requiredEdges: [
      ['IoT Sensors', 'MQTT Broker'],
      ['Gateways', 'Edge Computing Node'],
      ['Edge Computing Node', 'Protocol Bridge'],
      ['Protocol Bridge', 'Device Ingestion Service'],
      ['Device Ingestion Service', 'Kafka Streams'],
      ['Kafka Streams', 'Stream Processor'],
      ['Stream Processor', 'Anomaly Detection'],
      ['Anomaly Detection', 'Alert Manager'],
      ['Real-time Dashboard', 'Time-series Database'],
      ['Time-series Database', 'InfluxDB'],
      ['Spark Batch Jobs', 'Data Lake Ingestion'],
      ['ML Inference Service', 'Model Registry']
    ],
    description: 'Industrial IoT platform with device management, stream processing, time-series storage, and ML inference'
  },
  'ML/AI Platform': {
    requiredGroups: [
      'CLIENT_APPLICATIONS',
      'API_GATEWAY',
      'INFERENCE_LAYER',
      'FEATURE_ENGINEERING',
      'TRAINING_PIPELINE',
      'MODEL_MANAGEMENT',
      'DATA_LAYER',
      'ORCHESTRATION',
      'MONITORING'
    ],
    requiredLeafNodes: [
      // Clients
      'Web Application',
      'Mobile App',
      'API Consumers',
      
      // Gateway
      'API Gateway',
      'Auth Service',
      'Rate Limiter',
      
      // Inference
      'Inference API',
      'Model Serving',
      'Batch Inference',
      'A/B Testing Router',
      'Traffic Splitter',
      
      // Feature Engineering
      'Feature Store',
      'Feature Pipeline',
      'Feature Registry',
      'Data Validator',
      
      // Training
      'Training Pipeline',
      'Hyperparameter Tuning',
      'Experiment Tracker',
      'Training Data Pipeline',
      'Distributed Training',
      
      // Model Management
      'Model Registry',
      'Model Versioning',
      'Model Metadata Store',
      'Model Validator',
      
      // Data
      'Training Data Lake',
      'Model Storage',
      'Feature Cache',
      'PostgreSQL Metadata',
      'Redis Cache',
      
      // Orchestration
      'Airflow Scheduler',
      'Step Functions',
      'Pipeline Manager',
      
      // Monitoring
      'Model Monitor',
      'Data Drift Detector',
      'Performance Metrics',
      'Alerting Service'
    ],
    optionalNodes: [
      'AutoML Service',
      'Data Labeling Service',
      'Model Explainability',
      'Bias Detector',
      'Notebook Environment'
    ],
    requiredEdges: [
      ['Web Application', 'API Gateway'],
      ['API Gateway', 'Inference API'],
      ['Inference API', 'Model Serving'],
      ['Model Serving', 'Feature Store'],
      ['Feature Store', 'Feature Pipeline'],
      ['Feature Pipeline', 'Training Data Lake'],
      ['Training Pipeline', 'Experiment Tracker'],
      ['Experiment Tracker', 'Model Registry'],
      ['Model Registry', 'Model Serving'],
      ['Model Monitor', 'Data Drift Detector'],
      ['Data Drift Detector', 'Alerting Service']
    ],
    description: 'End-to-end ML platform with training, serving, feature store, and experiment tracking'
  },
  'Microservices Architecture': {
    requiredGroups: [
      'CLIENT_LAYER',
      'EDGE_LAYER',
      'GATEWAY_LAYER',
      'SERVICE_LAYER',
      'DATA_LAYER',
      'MESSAGE_LAYER',
      'OBSERVABILITY'
    ],
    requiredLeafNodes: [
      // Client
      'Web Application',
      'Mobile Application',
      
      // Edge
      'CDN',
      'Load Balancer',
      
      // Gateway
      'API Gateway',
      'Auth Service',
      
      // Services
      'Service A',
      'Service B',
      'Service C',
      'Service D',
      
      // Data
      'Primary Database',
      'Read Replica',
      'Cache Layer',
      'Search Index',
      
      // Messaging
      'Message Queue',
      'Event Bus',
      
      // Observability
      'Logging Service',
      'Metrics Collector',
      'Tracing Service',
      'Health Check'
    ],
    optionalNodes: [
      'Service Mesh',
      'Circuit Breaker',
      'Rate Limiter',
      'Config Server'
    ],
    requiredEdges: [
      ['Web Application', 'Load Balancer'],
      ['Mobile Application', 'Load Balancer'],
      ['Load Balancer', 'API Gateway'],
      ['API Gateway', 'Auth Service'],
      ['Auth Service', 'Service A'],
      ['Service A', 'Service B'],
      ['Service B', 'Cache Layer'],
      ['Cache Layer', 'Primary Database'],
      ['Service C', 'Message Queue'],
      ['Message Queue', 'Service D'],
      ['Logging Service', 'Metrics Collector']
    ],
    description: 'Generic microservices architecture with services, caching, messaging, and observability'
  }
};

export function getSystemRequirements(systemType: string): SystemComponentRequirements {
  return SYSTEM_COMPONENT_REQUIREMENTS[systemType] ?? SYSTEM_COMPONENT_REQUIREMENTS['Microservices Architecture'];
}
