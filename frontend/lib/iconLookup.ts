export interface IconEntry {
  url: string;
  provider: 'aws' | 'azure' | 'gcp' | 'custom';
}

const AWS_ICONS: Record<string, IconEntry> = {
  s3: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-S3.png', provider: 'aws' },
  lambda: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_AWS-Lambda.png', provider: 'aws' },
  ec2: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-EC2_InstanceStorage.png', provider: 'aws' },
  dynamodb: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-DynamoDB.png', provider: 'aws' },
  rds: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-RDS.png', provider: 'aws' },
  sqs: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-SQS.png', provider: 'aws' },
  sns: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-SNS.png', provider: 'aws' },
  api_gateway: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-API-Gateway.png', provider: 'aws' },
  cloudfront: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-CloudFront.png', provider: 'aws' },
  route53: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-Route-53.png', provider: 'aws' },
  cognito: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-Cognito.png', provider: 'aws' },
  iam: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-IAM.png', provider: 'aws' },
  kinesis: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-Kinesis.png', provider: 'aws' },
  elasticache: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-ElastiCache.png', provider: 'aws' },
  cloudwatch: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-CloudWatch.png', provider: 'aws' },
  step_functions: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_AWS-Step-Functions.png', provider: 'aws' },
  ecs: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-ECS.png', provider: 'aws' },
  eks: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-EKS.png', provider: 'aws' },
  fargate: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_AWS-Fargate.png', provider: 'aws' },
  bedrock: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-Bedrock.png', provider: 'aws' },
  sagemaker: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-SageMaker.png', provider: 'aws' },
  opensearch: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-OpenSearch-Service.png', provider: 'aws' },
  eventbridge: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-EventBridge.png', provider: 'aws' },
  appsync: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_AWS-AppSync.png', provider: 'aws' },
  aurora: { url: 'https://cdn.jsdelivr.net/gh/aws-samples/aws-service-logos/的主流/Architecture-Service-Icons_01312022/Resized/PNG/51_Amazon-Aurora.png', provider: 'aws' },
};

const AZURE_ICONS: Record<string, IconEntry> = {
  blob_storage: { url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/_images/reference-architecture-icons/azure-storage.svg', provider: 'azure' },
  functions: { url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/_images/reference-architecture-icons/azure-functions.svg', provider: 'azure' },
  app_service: { url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/_images/reference-architecture-icons/azure-app-service.svg', provider: 'azure' },
  cosmos_db: { url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/_images/reference-architecture-icons/azure-cosmos-db.svg', provider: 'azure' },
  sql_database: { url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/_images/reference-architecture-icons/azure-sql-database.svg', provider: 'azure' },
  service_bus: { url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/_images/reference-architecture-icons/azure-service-bus.svg', provider: 'azure' },
  event_hub: { url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/_images/reference-architecture-icons/azure-event-hubs.svg', provider: 'azure' },
  api_management: { url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/_images/reference-architecture-icons/azure-api-management.svg', provider: 'azure' },
  cdn: { url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/_images/reference-architecture-icons/azure-cdn.svg', provider: 'azure' },
  traffic_manager: { url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/_images/reference-architecture-icons/azure-traffic-manager.svg', provider: 'azure' },
  ad: { url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/_images/reference-architecture-icons/azure-active-directory.svg', provider: 'azure' },
  aks: { url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/_images/reference-architecture-icons/azure-kubernetes-service.svg', provider: 'azure' },
  application_insights: { url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/_images/reference-architecture-icons/azure-application-insights.svg', provider: 'azure' },
  logic_apps: { url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/_images/reference-architecture-icons/azure-logic-apps.svg', provider: 'azure' },
};

const GCP_ICONS: Record<string, IconEntry> = {
  cloud_storage: { url: 'https://cloud.google.com/icons/_includes/icons/product/cloud-storage.svg', provider: 'gcp' },
  cloud_functions: { url: 'https://cloud.google.com/icons/_includes/icons/product/cloud-functions.svg', provider: 'gcp' },
  compute_engine: { url: 'https://cloud.google.com/icons/_includes/icons/product/compute-engine.svg', provider: 'gcp' },
  cloud_firestore: { url: 'https://cloud.google.com/icons/_includes/icons/product/cloud-firestore.svg', provider: 'gcp' },
  cloud_sql: { url: 'https://cloud.google.com/icons/_includes/icons/product/cloud-sql.svg', provider: 'gcp' },
  pubsub: { url: 'https://cloud.google.com/icons/_includes/icons/product/cloud-pubsub.svg', provider: 'gcp' },
  apigee: { url: 'https://cloud.google.com/icons/_includes/icons/product/apigee.svg', provider: 'gcp' },
  cloud_cdn: { url: 'https://cloud.google.com/icons/_includes/icons/product/cloud-cdn.svg', provider: 'gcp' },
  cloud_run: { url: 'https://cloud.google.com/icons/_includes/icons/product/cloud-run.svg', provider: 'gcp' },
  gke: { url: 'https://cloud.google.com/icons/_includes/icons/product/kubernetes-engine.svg', provider: 'gcp' },
  bigquery: { url: 'https://cloud.google.com/icons/_includes/icons/product/bigquery.svg', provider: 'gcp' },
  vertex_ai: { url: 'https://cloud.google.com/icons/_includes/icons/product/vertex-ai.svg', provider: 'gcp' },
};

export function getIconUrl(serviceKey: string): string | undefined {
  const normalizedKey = serviceKey.toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
  
  if (AWS_ICONS[normalizedKey]) return AWS_ICONS[normalizedKey].url;
  if (AZURE_ICONS[normalizedKey]) return AZURE_ICONS[normalizedKey].url;
  if (GCP_ICONS[normalizedKey]) return GCP_ICONS[normalizedKey].url;
  
  return undefined;
}

export function getIconFromTechStack(tech: string): string | undefined {
  const normalized = tech.toLowerCase();
  
  if (normalized.includes('s3') || normalized.includes('storage')) return getIconUrl('s3');
  if (normalized.includes('lambda')) return getIconUrl('lambda');
  if (normalized.includes('ec2') || normalized.includes('compute')) return getIconUrl('ec2');
  if (normalized.includes('dynamodb') || normalized.includes('dynamo')) return getIconUrl('dynamodb');
  if (normalized.includes('rds') || normalized.includes('postgres') || normalized.includes('mysql') || normalized.includes('aurora')) return getIconUrl('rds');
  if (normalized.includes('sqs') || normalized.includes('queue')) return getIconUrl('sqs');
  if (normalized.includes('sns') || normalized.includes('notification')) return getIconUrl('sns');
  if (normalized.includes('api gateway') || normalized.includes('apigateway')) return getIconUrl('api_gateway');
  if (normalized.includes('cloudfront') || normalized.includes('cdn')) return getIconUrl('cloudfront');
  if (normalized.includes('route53') || normalized.includes('dns')) return getIconUrl('route53');
  if (normalized.includes('cognito') || normalized.includes('auth')) return getIconUrl('cognito');
  if (normalized.includes('kinesis')) return getIconUrl('kinesis');
  if (normalized.includes('redis') || normalized.includes('elasticache') || normalized.includes('cache')) return getIconUrl('elasticache');
  if (normalized.includes('cloudwatch') || normalized.includes('monitoring')) return getIconUrl('cloudwatch');
  if (normalized.includes('step function')) return getIconUrl('step_functions');
  if (normalized.includes('ecs') || normalized.includes('container')) return getIconUrl('ecs');
  if (normalized.includes('eks') || normalized.includes('kubernetes')) return getIconUrl('eks');
  if (normalized.includes('fargate')) return getIconUrl('fargate');
  if (normalized.includes('bedrock') || normalized.includes('ai') && normalized.includes('amazon')) return getIconUrl('bedrock');
  if (normalized.includes('sagemaker') || normalized.includes('ml')) return getIconUrl('sagemaker');
  if (normalized.includes('opensearch') || normalized.includes('search')) return getIconUrl('opensearch');
  if (normalized.includes('eventbridge') || normalized.includes('event')) return getIconUrl('eventbridge');
  if (normalized.includes('appsync') || normalized.includes('graphql')) return getIconUrl('appsync');
  if (normalized.includes('blob') || normalized.includes('azure storage')) return getIconUrl('blob_storage');
  if (normalized.includes('azure function')) return getIconUrl('functions');
  if (normalized.includes('app service')) return getIconUrl('app_service');
  if (normalized.includes('cosmos') || normalized.includes('nosql')) return getIconUrl('cosmos_db');
  if (normalized.includes('sql database') || normalized.includes('sql')) return getIconUrl('sql_database');
  if (normalized.includes('service bus')) return getIconUrl('service_bus');
  if (normalized.includes('event hub')) return getIconUrl('event_hub');
  if (normalized.includes('api management')) return getIconUrl('api_management');
  if (normalized.includes('azure cdn')) return getIconUrl('cdn');
  if (normalized.includes('traffic manager')) return getIconUrl('traffic_manager');
  if (normalized.includes('ad ') || normalized.includes('active directory') || normalized.includes('entra')) return getIconUrl('ad');
  if (normalized.includes('aks') || normalized.includes('kubernetes')) return getIconUrl('aks');
  if (normalized.includes('application insights')) return getIconUrl('application_insights');
  if (normalized.includes('logic apps')) return getIconUrl('logic_apps');
  if (normalized.includes('gcp storage') || normalized.includes('cloud storage')) return getIconUrl('cloud_storage');
  if (normalized.includes('cloud function')) return getIconUrl('cloud_functions');
  if (normalized.includes('compute engine')) return getIconUrl('compute_engine');
  if (normalized.includes('firestore')) return getIconUrl('cloud_firestore');
  if (normalized.includes('cloud sql')) return getIconUrl('cloud_sql');
  if (normalized.includes('pubsub')) return getIconUrl('pubsub');
  if (normalized.includes('apigee')) return getIconUrl('apigee');
  if (normalized.includes('gcp cdn')) return getIconUrl('cloud_cdn');
  if (normalized.includes('cloud run')) return getIconUrl('cloud_run');
  if (normalized.includes('gke')) return getIconUrl('gke');
  if (normalized.includes('bigquery')) return getIconUrl('bigquery');
  if (normalized.includes('vertex') || normalized.includes('ai')) return getIconUrl('vertex_ai');
  
  return undefined;
}
