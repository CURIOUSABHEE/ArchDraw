/**
 * Icon registry — maps every component/technology id to a lucide icon + brand color.
 * All AWS entries use lucide semantic icons (official SVGs were removed from public/).
 */

export type IconEntry = {
    kind: 'lucide';
    icon: string;
    color: string;
    description: string;
};

export const iconRegistry: Record<string, IconEntry> = {
    // ── AWS Compute ────────────────────────────────────────────────────────────
    'aws-ec2': { kind: 'lucide', icon: 'Server', color: '#FF9900', description: 'Virtual servers in the cloud' },
    'aws-lambda': { kind: 'lucide', icon: 'Zap', color: '#FF9900', description: 'Run code without provisioning servers' },
    'aws-ecs': { kind: 'lucide', icon: 'Boxes', color: '#FF9900', description: 'Run containerized applications' },
    'aws-eks': { kind: 'lucide', icon: 'CircleDot', color: '#FF9900', description: 'Managed Kubernetes service' },
    'aws-fargate': { kind: 'lucide', icon: 'Box', color: '#FF9900', description: 'Serverless compute for containers' },
    'aws-beanstalk': { kind: 'lucide', icon: 'Sprout', color: '#FF9900', description: 'Deploy and scale web applications' },

    // ── AWS Storage ────────────────────────────────────────────────────────────
    'aws-s3': { kind: 'lucide', icon: 'HardDrive', color: '#3F8624', description: 'Scalable object storage' },
    'aws-ebs': { kind: 'lucide', icon: 'Disc', color: '#3F8624', description: 'Block storage for EC2 instances' },
    'aws-efs': { kind: 'lucide', icon: 'FolderOpen', color: '#3F8624', description: 'Elastic file system for Linux workloads' },
    'aws-glacier': { kind: 'lucide', icon: 'Archive', color: '#3F8624', description: 'Low-cost archival storage' },

    // ── AWS Database ───────────────────────────────────────────────────────────
    'aws-rds': { kind: 'lucide', icon: 'Database', color: '#3B48CC', description: 'Managed relational database service' },
    'aws-dynamodb': { kind: 'lucide', icon: 'Layers', color: '#3B48CC', description: 'Serverless NoSQL key-value database' },
    'aws-elasticache': { kind: 'lucide', icon: 'Gauge', color: '#3B48CC', description: 'In-memory caching with Redis or Memcached' },
    'aws-aurora': { kind: 'lucide', icon: 'Sparkles', color: '#3B48CC', description: 'MySQL/PostgreSQL-compatible cloud database' },
    'aws-redshift': { kind: 'lucide', icon: 'BarChart2', color: '#3B48CC', description: 'Cloud data warehouse for analytics' },
    'aws-documentdb': { kind: 'lucide', icon: 'FileText', color: '#3B48CC', description: 'MongoDB-compatible document database' },

    // ── AWS Networking ─────────────────────────────────────────────────────────
    'aws-api-gateway': { kind: 'lucide', icon: 'Webhook', color: '#A020F0', description: 'Create, publish, and secure APIs at scale' },
    'aws-cloudfront': { kind: 'lucide', icon: 'RadioTower', color: '#A020F0', description: 'Global CDN and content delivery' },
    'aws-route53': { kind: 'lucide', icon: 'Globe', color: '#A020F0', description: 'Scalable DNS and domain registration' },
    'aws-vpc': { kind: 'lucide', icon: 'Network', color: '#A020F0', description: 'Isolated virtual network in AWS' },
    'aws-elb': { kind: 'lucide', icon: 'Scale', color: '#A020F0', description: 'Classic load balancer for EC2' },
    'aws-alb': { kind: 'lucide', icon: 'Shuffle', color: '#A020F0', description: 'Application load balancer (Layer 7)' },

    // ── AWS Messaging ──────────────────────────────────────────────────────────
    'aws-sqs': { kind: 'lucide', icon: 'MessageSquare', color: '#FF9900', description: 'Fully managed message queuing service' },
    'aws-sns': { kind: 'lucide', icon: 'Bell', color: '#FF9900', description: 'Pub/sub messaging and mobile notifications' },
    'aws-eventbridge': { kind: 'lucide', icon: 'Radio', color: '#FF9900', description: 'Serverless event bus for SaaS and AWS services' },
    'aws-kinesis': { kind: 'lucide', icon: 'Activity', color: '#FF9900', description: 'Real-time data streaming at scale' },

    // ── AWS Auth & Security ────────────────────────────────────────────────────
    'aws-cognito': { kind: 'lucide', icon: 'Users', color: '#DD344C', description: 'User sign-up, sign-in, and access control' },
    'aws-iam': { kind: 'lucide', icon: 'KeyRound', color: '#DD344C', description: 'Manage access to AWS services and resources' },
    'aws-secrets-manager': { kind: 'lucide', icon: 'Lock', color: '#DD344C', description: 'Rotate, manage, and retrieve secrets' },
    'aws-waf': { kind: 'lucide', icon: 'ShieldAlert', color: '#DD344C', description: 'Web application firewall' },
    'aws-shield': { kind: 'lucide', icon: 'Shield', color: '#DD344C', description: 'DDoS protection for AWS resources' },

    // ── AWS Observability ──────────────────────────────────────────────────────
    'aws-cloudwatch': { kind: 'lucide', icon: 'LayoutDashboard', color: '#E7157B', description: 'Monitor AWS resources and applications' },
    'aws-xray': { kind: 'lucide', icon: 'GitBranch', color: '#E7157B', description: 'Distributed tracing for AWS applications' },
    'aws-cloudtrail': { kind: 'lucide', icon: 'ScrollText', color: '#E7157B', description: 'Audit log of all AWS API calls' },

    // ── AWS DevOps ─────────────────────────────────────────────────────────────
    'aws-codepipeline': { kind: 'lucide', icon: 'GitPullRequest', color: '#3F8624', description: 'Continuous delivery pipeline service' },
    'aws-codebuild': { kind: 'lucide', icon: 'Hammer', color: '#3F8624', description: 'Fully managed build service' },
    'aws-ecr': { kind: 'lucide', icon: 'Package', color: '#3F8624', description: 'Docker container image registry' },
    'aws-cloudformation': { kind: 'lucide', icon: 'Settings', color: '#3F8624', description: 'Infrastructure as code for AWS' },

    // ── Databases ──────────────────────────────────────────────────────────────
    'mongodb': { kind: 'lucide', icon: 'Leaf', color: '#47A248', description: 'Document-oriented NoSQL database' },
    'postgresql': { kind: 'lucide', icon: 'Database', color: '#336791', description: 'Advanced open-source relational database' },
    'mysql': { kind: 'lucide', icon: 'Database', color: '#4479A1', description: "World's most popular open-source database" },
    'sqlite': { kind: 'lucide', icon: 'Database', color: '#003B57', description: 'Lightweight embedded relational database' },
    'redis': { kind: 'lucide', icon: 'Gauge', color: '#DC382D', description: 'In-memory data structure store and cache' },
    'cassandra': { kind: 'lucide', icon: 'Layers', color: '#1287B1', description: 'Distributed wide-column NoSQL database' },
    'cockroachdb': { kind: 'lucide', icon: 'Bug', color: '#6933FF', description: 'Distributed SQL database for global apps' },
    'supabase': { kind: 'lucide', icon: 'Database', color: '#3ECF8E', description: 'Open-source Firebase alternative with Postgres' },
    'planetscale': { kind: 'lucide', icon: 'Database', color: '#000000', description: 'Serverless MySQL platform with branching' },
    'fauna': { kind: 'lucide', icon: 'Leaf', color: '#3A1AB6', description: 'Distributed document-relational database' },
    'firestore': { kind: 'lucide', icon: 'Flame', color: '#FFCA28', description: 'Flexible, scalable NoSQL cloud database' },

    // ── ORMs & Query Tools ─────────────────────────────────────────────────────
    'prisma': { kind: 'lucide', icon: 'Triangle', color: '#2D3748', description: 'Next-generation ORM for Node.js and TypeScript' },
    'drizzle': { kind: 'lucide', icon: 'Droplets', color: '#C5F74F', description: 'Lightweight TypeScript ORM with SQL-like syntax' },
    'typeorm': { kind: 'lucide', icon: 'Code2', color: '#E83524', description: 'ORM for TypeScript and JavaScript' },
    'sequelize': { kind: 'lucide', icon: 'Code2', color: '#52B0E7', description: 'Promise-based Node.js ORM for SQL databases' },

    // ── Auth ───────────────────────────────────────────────────────────────────
    'auth0': { kind: 'lucide', icon: 'ShieldCheck', color: '#EB5424', description: 'Identity platform for app builders' },
    'clerk': { kind: 'lucide', icon: 'UserCheck', color: '#6C47FF', description: 'Complete user management and authentication' },
    'nextauth': { kind: 'lucide', icon: 'KeyRound', color: '#000000', description: 'Authentication for Next.js applications' },
    'firebase-auth': { kind: 'lucide', icon: 'Flame', color: '#FFCA28', description: "Google's authentication service" },
    'supabase-auth': { kind: 'lucide', icon: 'UserCheck', color: '#3ECF8E', description: 'Row-level security and JWT auth via Supabase' },

    // ── Search ─────────────────────────────────────────────────────────────────
    'elasticsearch': { kind: 'lucide', icon: 'Search', color: '#FEC514', description: 'Distributed search and analytics engine' },
    'algolia': { kind: 'lucide', icon: 'Search', color: '#003DFF', description: 'Hosted search API for fast results' },
    'typesense': { kind: 'lucide', icon: 'Search', color: '#E1341E', description: 'Open-source typo-tolerant search engine' },
    'meilisearch': { kind: 'lucide', icon: 'Search', color: '#FF5CAA', description: 'Lightning-fast open-source search engine' },

    // ── Messaging ──────────────────────────────────────────────────────────────
    'kafka': { kind: 'lucide', icon: 'Activity', color: '#231F20', description: 'Distributed event streaming platform' },
    'rabbitmq': { kind: 'lucide', icon: 'MessageSquare', color: '#FF6600', description: 'Open-source message broker' },
    'upstash': { kind: 'lucide', icon: 'Zap', color: '#00E9A3', description: 'Serverless Redis and Kafka for the edge' },

    // ── Monitoring ─────────────────────────────────────────────────────────────
    'datadog': { kind: 'lucide', icon: 'BarChart2', color: '#632CA6', description: 'Cloud monitoring and security platform' },
    'sentry': { kind: 'lucide', icon: 'AlertTriangle', color: '#362D59', description: 'Application error tracking and performance' },
    'newrelic': { kind: 'lucide', icon: 'LayoutDashboard', color: '#1CE783', description: 'Full-stack observability platform' },
    'grafana': { kind: 'lucide', icon: 'LayoutDashboard', color: '#F46800', description: 'Open-source analytics and monitoring' },
    'prometheus': { kind: 'lucide', icon: 'Activity', color: '#E6522C', description: 'Open-source metrics and alerting toolkit' },

    // ── AI ─────────────────────────────────────────────────────────────────────
    'openai': { kind: 'lucide', icon: 'Brain', color: '#412991', description: 'GPT models and AI APIs' },
    'anthropic': { kind: 'lucide', icon: 'Brain', color: '#D4A27F', description: 'Claude AI models for safe, helpful AI' },
    'pinecone': { kind: 'lucide', icon: 'Cpu', color: '#1C17FF', description: 'Vector database for ML applications' },
    'weaviate': { kind: 'lucide', icon: 'Cpu', color: '#FA0050', description: 'Open-source vector search engine' },
    'langchain': { kind: 'lucide', icon: 'Link', color: '#1C3C3C', description: 'Framework for LLM-powered applications' },
    'huggingface': { kind: 'lucide', icon: 'Bot', color: '#FFD21E', description: 'Open-source ML models and datasets' },

    // ── DevOps ─────────────────────────────────────────────────────────────────
    'docker': { kind: 'lucide', icon: 'Box', color: '#2496ED', description: 'Build, ship, and run containerized apps' },
    'kubernetes': { kind: 'lucide', icon: 'CircleDot', color: '#326CE5', description: 'Container orchestration at scale' },
    'vercel': { kind: 'lucide', icon: 'Triangle', color: '#000000', description: 'Frontend cloud for web deployment' },
    'railway': { kind: 'lucide', icon: 'Train', color: '#0B0D0E', description: 'Infrastructure platform for any language' },
    'render': { kind: 'lucide', icon: 'Cloud', color: '#46E3B7', description: 'Unified cloud for apps and databases' },
    'flyio': { kind: 'lucide', icon: 'Plane', color: '#7B3FE4', description: 'Run full-stack apps close to users' },
    'github-actions': { kind: 'lucide', icon: 'GitPullRequest', color: '#2088FF', description: 'CI/CD automation built into GitHub' },

    // ── Azure Compute ─────────────────────────────────────────────────────────────
    'azure-vm': { kind: 'lucide', icon: 'Server', color: '#0078D4', description: 'Azure Virtual Machines' },
    'azure-functions': { kind: 'lucide', icon: 'Zap', color: '#0078D4', description: 'Azure Functions serverless compute' },
    'azure-appservice': { kind: 'lucide', icon: 'Globe', color: '#0078D4', description: 'Azure App Service web hosting' },
    'azure-aks': { kind: 'lucide', icon: 'CircleDot', color: '#0078D4', description: 'Azure Kubernetes Service' },
    'azure-container-instance': { kind: 'lucide', icon: 'Box', color: '#0078D4', description: 'Azure Container Instances' },

    // ── Azure Storage & Databases ────────────────────────────────────────────────
    'azure-storage': { kind: 'lucide', icon: 'HardDrive', color: '#0078D4', description: 'Azure Blob Storage' },
    'azure-sql': { kind: 'lucide', icon: 'Database', color: '#0078D4', description: 'Azure SQL Database' },
    'azure-cosmosdb': { kind: 'lucide', icon: 'Layers', color: '#0078D4', description: 'Azure Cosmos DB NoSQL database' },
    'azure-redis': { kind: 'lucide', icon: 'Gauge', color: '#0078D4', description: 'Azure Cache for Redis' },

    // ── Azure Networking ──────────────────────────────────────────────────────────
    'azure-api-management': { kind: 'lucide', icon: 'Webhook', color: '#0078D4', description: 'Azure API Management' },
    'azure-cdn': { kind: 'lucide', icon: 'RadioTower', color: '#0078D4', description: 'Azure Content Delivery Network' },
    'azure-vnet': { kind: 'lucide', icon: 'Network', color: '#0078D4', description: 'Azure Virtual Network' },
    'azure-lb': { kind: 'lucide', icon: 'Scale', color: '#0078D4', description: 'Azure Load Balancer' },
    'azure-app-gateway': { kind: 'lucide', icon: 'Shuffle', color: '#0078D4', description: 'Azure Application Gateway' },

    // ── Azure Messaging ────────────────────────────────────────────────────────────
    'azure-servicebus': { kind: 'lucide', icon: 'MessageSquare', color: '#0078D4', description: 'Azure Service Bus messaging' },
    'azure-eventhub': { kind: 'lucide', icon: 'Activity', color: '#0078D4', description: 'Azure Event Hubs' },
    'azure-event-grid': { kind: 'lucide', icon: 'Radio', color: '#0078D4', description: 'Azure Event Grid' },

    // ── Azure Security ─────────────────────────────────────────────────────────────
    'azure-ad': { kind: 'lucide', icon: 'Users', color: '#0078D4', description: 'Azure Active Directory' },
    'azure-keyvault': { kind: 'lucide', icon: 'Lock', color: '#0078D4', description: 'Azure Key Vault secrets management' },

    // ── Azure Observability ───────────────────────────────────────────────────────
    'azure-monitor': { kind: 'lucide', icon: 'LayoutDashboard', color: '#0078D4', description: 'Azure Monitor' },
    'azure-application-insights': { kind: 'lucide', icon: 'GitBranch', color: '#0078D4', description: 'Azure Application Insights' },

    // ── GCP Compute ────────────────────────────────────────────────────────────────
    'gcp-compute-engine': { kind: 'lucide', icon: 'Server', color: '#4285F4', description: 'GCP Compute Engine VMs' },
    'gcp-cloud-functions': { kind: 'lucide', icon: 'Zap', color: '#4285F4', description: 'GCP Cloud Functions' },
    'gcp-run': { kind: 'lucide', icon: 'Plane', color: '#4285F4', description: 'GCP Cloud Run serverless containers' },
    'gcp-gke': { kind: 'lucide', icon: 'CircleDot', color: '#4285F4', description: 'GCP Kubernetes Engine' },

    // ── GCP Storage & Databases ───────────────────────────────────────────────────
    'gcp-storage': { kind: 'lucide', icon: 'HardDrive', color: '#4285F4', description: 'GCP Cloud Storage' },
    'gcp-sql': { kind: 'lucide', icon: 'Database', color: '#4285F4', description: 'GCP Cloud SQL' },
    'gcp-firestore': { kind: 'lucide', icon: 'Layers', color: '#4285F4', description: 'GCP Firestore NoSQL database' },
    'gcp-bigtable': { kind: 'lucide', icon: 'Gauge', color: '#4285F4', description: 'GCP Bigtable wide-column database' },
    'gcp-spanner': { kind: 'lucide', icon: 'Database', color: '#4285F4', description: 'GCP Cloud Spanner global SQL database' },

    // ── GCP Networking ─────────────────────────────────────────────────────────────
    'gcp-api-gateway': { kind: 'lucide', icon: 'Webhook', color: '#4285F4', description: 'GCP API Gateway' },
    'gcp-cloud-cdn': { kind: 'lucide', icon: 'RadioTower', color: '#4285F4', description: 'GCP Cloud CDN' },
    'gcp-vpc': { kind: 'lucide', icon: 'Network', color: '#4285F4', description: 'GCP Virtual Private Cloud' },
    'gcp-lb': { kind: 'lucide', icon: 'Scale', color: '#4285F4', description: 'GCP Cloud Load Balancing' },

    // ── Generic Service Types ──────────────────────────────────────────────────────
    'generic-api': { kind: 'lucide', icon: 'Webhook', color: '#6B7280', description: 'Generic API service' },
    'generic-database': { kind: 'lucide', icon: 'Database', color: '#6B7280', description: 'Generic database service' },
    'generic-storage': { kind: 'lucide', icon: 'HardDrive', color: '#6B7280', description: 'Generic storage service' },
    'generic-queue': { kind: 'lucide', icon: 'MessageSquare', color: '#6B7280', description: 'Generic message queue' },
    'generic-cache': { kind: 'lucide', icon: 'Gauge', color: '#6B7280', description: 'Generic cache service' },
    'generic-auth': { kind: 'lucide', icon: 'ShieldCheck', color: '#6B7280', description: 'Generic authentication service' },
    'generic-search': { kind: 'lucide', icon: 'Search', color: '#6B7280', description: 'Generic search service' },
    'generic-compute': { kind: 'lucide', icon: 'Cpu', color: '#6B7280', description: 'Generic compute service' },
    'generic-container': { kind: 'lucide', icon: 'Box', color: '#6B7280', description: 'Generic container service' },
    'generic-server': { kind: 'lucide', icon: 'Server', color: '#6B7280', description: 'Generic server/service' },
    'generic-client': { kind: 'lucide', icon: 'Monitor', color: '#6B7280', description: 'Generic client/application' },
    'generic-cdn': { kind: 'lucide', icon: 'RadioTower', color: '#6B7280', description: 'Generic CDN service' },
    'generic-dns': { kind: 'lucide', icon: 'Globe', color: '#6B7280', description: 'Generic DNS service' },
    'generic-monitoring': { kind: 'lucide', icon: 'LayoutDashboard', color: '#6B7280', description: 'Generic monitoring service' },
    'generic-logging': { kind: 'lucide', icon: 'ScrollText', color: '#6B7280', description: 'Generic logging service' },
};
