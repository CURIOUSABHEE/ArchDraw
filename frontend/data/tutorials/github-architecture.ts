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
  title: 'Code Hosting Platform',
  subtitle: 'Build a code hosting platform in 12 steps',
  description:
    'Build a code hosting platform for 100 million developers with 420 million repositories. Learn Git object storage, pull request workflows, CI/CD pipelines, code search, and webhook delivery at scale.',
  estimatedTime: '~30 mins',
  unlocks: 'Production Layer',
  contextMessage:
    "Let's build GitHub from scratch. 100 million developers, 420 million repositories, and a push that triggers CI/CD pipelines, notifies collaborators, and updates integrations — all within seconds. GitHub's scale of Git storage alone is staggering.",
  steps: [
    step({
      id: 1,
      title: 'Add the Web Client',
      explanation:
        "GitHub's web client is where developers browse code, review pull requests, and manage issues. It renders syntax-highlighted code, diffs, and markdown — all server-side rendered for fast initial loads.",
      action: buildFirstStepAction('Web'),
      why: "GitHub's web client must render code diffs with syntax highlighting for 100+ programming languages. Server-side rendering ensures fast initial page loads even for large files.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'GitHub',
        'Web Client',
        'render syntax-highlighted code, diffs, and markdown with server-side rendering for fast loads',
        "GitHub's scale of Git storage alone is staggering. Every commit, every file, every version of every file across 420 million repositories. Git's content-addressable storage is what makes this possible.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "GitHub's web client renders syntax-highlighted code, diffs, and markdown for 100+ programming languages. Server-side rendering ensures fast initial page loads even for large files. 100 million developers use this to browse code every day.",
        'API Gateway'
      ),
      messages: [
        msg(
          "Welcome to the GitHub Architecture tutorial. 100 million developers, 420 million repositories, and a push that triggers CI/CD pipelines, notifies collaborators, and updates integrations — all within seconds."
        ),
        msg(
          "GitHub's scale of Git storage alone is staggering. Every commit, every file, every version of every file across 420 million repositories. Git's content-addressable storage is what makes this possible."
        ),
        msg("Press ⌘K and search for \"Web\" and press Enter to add the client to the canvas."),
      ],
      requiredNodes: ['client_web'],
      requiredEdges: [],
      successMessage: 'Web Client added. Now the API layer.',
      errorMessage: 'Add a Web Client node to the canvas first.',
    }),
    step({
      id: 2,
      title: 'Add the API Gateway',
      explanation:
        "GitHub's API Gateway handles REST API v3, GraphQL API v4, and Git protocol requests. The GraphQL API lets clients fetch exactly the data they need — a PR review page can fetch PR details, comments, and CI status in a single query.",
      action: buildAction('API Gateway', 'Web', 'API Gateway', 'REST and GraphQL API requests being routed with per-client rate limiting'),
      why: "GitHub's GraphQL API was a major architectural improvement over REST. A single GraphQL query can replace 10 REST calls — critical for GitHub's complex data relationships (PRs, reviews, checks, comments).",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'GitHub',
        'API Gateway',
        'handle REST, GraphQL, and Git protocol with per-client rate limiting',
        "Loading a pull request page used to require 10+ REST API calls: get PR details, get commits, get reviews, get comments, get CI status, get labels... GraphQL lets the client specify exactly what it needs in one request. GitHub's own web app uses the GraphQL API internally.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "GitHub offers both REST and GraphQL APIs. The GraphQL API replaced dozens of REST calls with a single query. Loading a PR page required 10+ REST calls before GraphQL — now the client specifies exactly what it needs in one request.",
        'Load Balancer'
      ),
      messages: [
        msg(
          "GitHub offers both REST and GraphQL APIs. The GraphQL API replaced dozens of REST calls with a single query."
        ),
        msg(
          "Loading a pull request page used to require 10+ REST API calls: get PR details, get commits, get reviews, get comments, get CI status, get labels... GraphQL lets the client specify exactly what it needs in one request. GitHub's own web app uses the GraphQL API internally."
        ),
        msg("Press ⌘K and search for \"API Gateway\" and press Enter to add it, then connect Web → API Gateway."),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added and connected. Now distribute the load.',
      errorMessage: 'Add an API Gateway and connect it from the Client.',
    }),
    step({
      id: 3,
      title: 'Add Load Balancer',
      explanation:
        "GitHub's Load Balancer distributes traffic across service instances. GitHub uses HAProxy for its load balancer — one of the highest-traffic HAProxy deployments in the world.",
      action: buildAction('Load Balancer', 'API Gateway', 'Load Balancer', 'traffic being distributed across Git servers with stateless Git operation routing'),
      why: "GitHub's traffic is highly variable — a viral repository can get millions of clone requests in hours. The load balancer must handle sudden spikes without dropping Git operations.",
      component: component('load_balancer', 'Load Balancer'),
      openingMessage: buildOpeningL1(
        'GitHub',
        'Load Balancer',
        'distribute Git operations and API requests across thousands of servers for viral repository spikes',
        "When a popular open-source project releases a new version, thousands of CI systems clone the repository simultaneously. The load balancer distributes these clone requests across Git server instances. Git operations are stateless, so any server can handle any clone request.",
        'Load Balancer'
      ),
      celebrationMessage: buildCelebration(
        'Load Balancer',
        'API Gateway',
        "GitHub uses HAProxy as its load balancer — handling millions of Git operations and API requests per day. When a popular open-source project releases a new version, thousands of CI systems clone simultaneously. Git operations are stateless, so any server handles any clone.",
        'Auth Service'
      ),
      messages: [
        msg(
          "GitHub uses HAProxy as its load balancer — handling millions of Git operations and API requests per day."
        ),
        msg(
          "When a popular open-source project releases a new version, thousands of CI systems clone the repository simultaneously. The load balancer distributes these clone requests across Git server instances. Git operations are stateless, so any server can handle any clone request."
        ),
        msg("Press ⌘K and search for \"Load Balancer\" and press Enter to add it, then connect API Gateway → Load Balancer."),
      ],
      requiredNodes: ['load_balancer'],
      requiredEdges: [edge('api_gateway', 'load_balancer')],
      successMessage: 'Load Balancer added and connected. Now authentication.',
      errorMessage: 'Add a Load Balancer and connect it from the API Gateway.',
    }),
    step({
      id: 4,
      title: 'Add Auth Service',
      explanation:
        "GitHub's Auth Service handles personal access tokens, OAuth apps, GitHub Apps, and SSH key authentication. GitHub Apps are the modern way to integrate with GitHub — they have fine-grained permissions and can act as themselves, not as a user.",
      action: buildAction('Auth Service', 'Load Balancer', 'Auth Service', 'multiple credential types with fine-grained repository-level permissions'),
      why: "GitHub Apps replaced OAuth Apps because they have repository-level permissions. An OAuth App gets access to all your repos; a GitHub App can be granted access to only specific repos.",
      component: component('auth_service', 'Auth'),
      openingMessage: buildOpeningL1(
        'GitHub',
        'Auth Service',
        'handle tokens, OAuth, GitHub Apps, and SSH keys with repository-level permissions',
        "GitHub Apps are the modern integration model. Instead of 'this app has access to all your repos', GitHub Apps request specific permissions on specific repos. A CI app only needs read access to your code repo — not your private repos. The Auth Service validates GitHub App JWTs and enforces fine-grained permissions.",
        'Auth Service'
      ),
      celebrationMessage: buildCelebration(
        'Auth Service',
        'Load Balancer',
        "GitHub's auth handles multiple credential types: passwords, tokens, SSH keys, and GitHub App JWTs. GitHub Apps have repository-level permissions — a CI app only gets read access to your code repo, not your private repos. The Auth Service enforces these distinctions on every request.",
        'Repository Service'
      ),
      messages: [
        msg(
          "GitHub's auth handles multiple credential types: passwords, tokens, SSH keys, and GitHub App JWTs."
        ),
        msg(
          "GitHub Apps are the modern integration model. Instead of 'this app has access to all your repos', GitHub Apps request specific permissions on specific repos. A CI app only needs read access to your code repo — not your private repos. The Auth Service validates GitHub App JWTs and enforces these fine-grained permissions."
        ),
        msg("Press ⌘K and search for \"Auth Service\" and press Enter to add it, then connect Load Balancer → Auth Service."),
      ],
      requiredNodes: ['auth_service'],
      requiredEdges: [edge('load_balancer', 'auth_service')],
      successMessage: 'Auth Service added and connected. Now the core — Git storage.',
      errorMessage: 'Add an Auth Service and connect it from the Load Balancer.',
    }),
    step({
      id: 5,
      title: 'Add Repository Service',
      explanation:
        "GitHub's Repository Service handles repository creation, metadata, and access control. It's the service that knows which users have access to which repositories and manages repository settings.",
      action: buildAction('Microservice', 'Auth', 'Repository Service', 'repository metadata and access control being managed separately from Git objects'),
      why: "Repository metadata (name, description, visibility, collaborators) is separate from Git object storage. The Repository Service manages metadata while Git Object Storage manages the actual code.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'GitHub',
        'Repository Service',
        'manage repository metadata, access control, and settings separately from Git object storage',
        "When you create a repository, the Repository Service creates the metadata record and provisions storage. When you add a collaborator, it updates the access control list. When you make a repo private, it updates visibility. The actual Git objects (commits, trees, blobs) are stored separately in Git Object Storage.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Repository Service',
        'Auth Service',
        "The Repository Service manages metadata — who owns the repo, who has access, what the settings are. When you create a repository, it creates the metadata record and provisions storage. Git object storage is separate — commits, trees, and blobs are stored separately from repository settings.",
        'Git Object Storage'
      ),
      messages: [
        msg(
          "The Repository Service manages metadata — who owns the repo, who has access, what the settings are."
        ),
        msg(
          "When you create a repository, the Repository Service creates the metadata record and provisions storage. When you add a collaborator, it updates the access control list. When you make a repo private, it updates visibility. The actual Git objects (commits, trees, blobs) are stored separately in Git Object Storage."
        ),
        msg("Press ⌘K and search for \"Microservice\" and press Enter to add it, then connect Auth Service → Repository Service."),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('auth_service', 'microservice')],
      successMessage: 'Repository Service added and connected. Now Git object storage.',
      errorMessage: 'Add a Microservice (Repository Service) and connect it from the Auth Service.',
    }),
    step({
      id: 6,
      title: 'Add Git Object Storage',
      explanation:
        "Git Object Storage stores all Git objects: blobs (file contents), trees (directory structures), commits, and tags. Git uses content-addressable storage — every object is identified by its SHA-1 hash. Identical files across repositories share the same blob.",
      action: buildAction('Git Object Storage', 'Microservice', 'Git Object Storage', 'Git objects being stored with automatic deduplication via content-addressable storage'),
      why: "Content-addressable storage means deduplication is automatic. If 1 million repositories all contain the same popular library file, GitHub stores it once. The SHA-1 hash is the same regardless of which repo it's in.",
      component: component('git_storage', 'Git'),
      openingMessage: buildOpeningL1(
        'GitHub',
        'Git Object Storage',
        'store Git objects with automatic deduplication across 420 million repositories',
        "Every file in Git is stored as a blob identified by its SHA-1 hash. If the same file exists in 1 million repositories (like a popular library), GitHub stores it once. When you push a commit, GitHub checks if each blob already exists before storing it.",
        'Git Object Storage'
      ),
      celebrationMessage: buildCelebration(
        'Git Object Storage',
        'Repository Service',
        "Git's content-addressable storage is GitHub's secret weapon for storage efficiency. If the same file exists in 1 million repositories, GitHub stores it once. Every file is identified by its SHA-1 hash — deduplication is automatic and saves petabytes of storage.",
        'Code Review Service'
      ),
      messages: [
        msg(
          "Git's content-addressable storage is GitHub's secret weapon for storage efficiency."
        ),
        msg(
          "Every file in Git is stored as a blob identified by its SHA-1 hash. If the same file exists in 1 million repositories (like a popular library), GitHub stores it once. When you push a commit, GitHub checks if each blob already exists before storing it. This deduplication saves petabytes of storage."
        ),
        msg("Press ⌘K and search for \"Git Object Storage\" and press Enter to add it, then connect Repository Service → Git Object Storage."),
      ],
      requiredNodes: ['git_storage'],
      requiredEdges: [edge('microservice', 'git_storage')],
      successMessage: 'Git Object Storage added and connected. Now code review.',
      errorMessage: 'Add a Git Object Storage and connect it from the Repository Service.',
    }),
    step({
      id: 7,
      title: 'Add Code Review Service',
      explanation:
        "The Code Review Service manages pull requests, reviews, and comments. It stores PR metadata, review states, and inline comments. It also computes diffs between branches for display.",
      action: buildAction('Code Review Service', 'Microservice', 'Code Review Service', 'pull request metadata, diffs, reviews, and inline comments being managed'),
      why: "Pull requests are GitHub's core product. The Code Review Service must compute diffs between any two commits in real-time, store review states, and notify reviewers — all while handling millions of active PRs.",
      component: component('code_review_service', 'Code'),
      openingMessage: buildOpeningL1(
        'GitHub',
        'Code Review Service',
        'manage pull requests, reviews, comments, and diff computation across millions of active PRs',
        "When you open a PR, the Code Review Service computes the diff between your branch and the base branch. It stores inline comments with their position in the diff. When the base branch changes, it re-computes which comments are still relevant. This diff computation is expensive — GitHub caches diffs aggressively.",
        'Code Review Service'
      ),
      celebrationMessage: buildCelebration(
        'Code Review Service',
        'Repository Service',
        "Pull requests are GitHub's core product. The Code Review Service computes diffs between any two commits in real-time, stores review states, and manages inline comments. When the base branch changes, it re-computes which comments are still relevant.",
        'CI Runner'
      ),
      messages: [
        msg(
          "Pull requests are GitHub's most important feature. The Code Review Service manages the entire PR lifecycle."
        ),
        msg(
          "When you open a PR, the Code Review Service computes the diff between your branch and the base branch. It stores inline comments with their position in the diff. When the base branch changes, it re-computes which comments are still relevant. This diff computation is expensive — GitHub caches diffs aggressively."
        ),
        msg("Press ⌘K and search for \"Code Review Service\" and press Enter to add it, then connect Repository Service → Code Review Service."),
      ],
      requiredNodes: ['code_review_service'],
      requiredEdges: [edge('microservice', 'code_review_service')],
      successMessage: 'Code Review Service added and connected. Now CI/CD.',
      errorMessage: 'Add a Code Review Service and connect it from the Repository Service.',
    }),
    step({
      id: 8,
      title: 'Add CI Runner',
      explanation:
        "GitHub Actions CI Runners execute workflow jobs. Runners are ephemeral VMs that spin up, run the job, and terminate. GitHub provides hosted runners (Ubuntu, Windows, macOS) and supports self-hosted runners.",
      action: buildAction('CI Runner', 'Code', 'CI Runner', 'workflow jobs being executed in ephemeral VMs with clean environments'),
      why: "CI runners must be ephemeral — each job gets a clean environment. Shared state between jobs would cause flaky tests. Ephemeral VMs guarantee isolation but require fast provisioning (under 30 seconds).",
      component: component('ci_runner', 'CI'),
      openingMessage: buildOpeningL1(
        'GitHub',
        'CI Runner',
        'execute workflow jobs in ephemeral VMs with clean environments that are destroyed after each job',
        "When a push triggers a workflow, GitHub provisions a new VM, clones the repository, runs the job steps, and destroys the VM. This takes under 30 seconds for hosted runners. The ephemeral model prevents test pollution between jobs. GitHub runs millions of CI jobs per day.",
        'CI Runner'
      ),
      celebrationMessage: buildCelebration(
        'CI Runner',
        'Code Review Service',
        "GitHub Actions runners are ephemeral VMs — each job gets a fresh environment, then the VM is destroyed. This prevents test pollution between jobs. GitHub provisions a new VM, runs the job steps, and destroys the VM — all in under 30 seconds. Millions of CI jobs per day.",
        'Webhook Dispatcher'
      ),
      messages: [
        msg(
          "GitHub Actions runners are ephemeral VMs — each job gets a fresh environment, then the VM is destroyed."
        ),
        msg(
          "When a push triggers a workflow, GitHub provisions a new VM, clones the repository, runs the job steps, and destroys the VM. This takes under 30 seconds for hosted runners. The ephemeral model prevents test pollution between jobs. GitHub runs millions of CI jobs per day across their runner fleet."
        ),
        msg("Press ⌘K and search for \"CI Runner\" and press Enter to add it, then connect Code Review Service → CI Runner."),
      ],
      requiredNodes: ['ci_runner'],
      requiredEdges: [edge('code_review_service', 'ci_runner')],
      successMessage: 'CI Runner added and connected. Now webhook delivery.',
      errorMessage: 'Add a CI Runner and connect it from the Code Review Service.',
    }),
    step({
      id: 9,
      title: 'Add Webhook Dispatcher',
      explanation:
        "The Webhook Dispatcher delivers events to external services when things happen on GitHub: push, PR opened, issue created, CI completed. It handles retries, delivery guarantees, and rate limiting per endpoint.",
      action: buildAction('Webhook Dispatcher', 'Microservice', 'Webhook Dispatcher', 'webhook events being delivered to external services with retries and exponential backoff'),
      why: "GitHub delivers billions of webhook events per day to millions of endpoints. The Webhook Dispatcher must handle slow endpoints (with timeouts), failed deliveries (with retries), and endpoints that go down (with exponential backoff).",
      component: component('webhook_dispatcher', 'Webhook'),
      openingMessage: buildOpeningL1(
        'GitHub',
        'Webhook Dispatcher',
        'deliver webhook events to millions of endpoints with retries and exponential backoff',
        "When a push happens, GitHub sends a webhook to every registered endpoint. If an endpoint is slow (>10 seconds), the request times out. If it fails, GitHub retries with exponential backoff: 5s, 30s, 5m, 30m, 2h. After 3 days of failures, the webhook is disabled.",
        'Webhook Dispatcher'
      ),
      celebrationMessage: buildCelebration(
        'Webhook Dispatcher',
        'Repository Service',
        "GitHub delivers billions of webhook events per day to millions of endpoints. Slow endpoints timeout after 10 seconds. Failed deliveries are retried with exponential backoff: 5s, 30s, 5m, 30m, 2h. After 3 days of failures, the webhook is disabled to protect GitHub's queue.",
        'Search Service'
      ),
      messages: [
        msg(
          "GitHub delivers billions of webhook events per day. The Webhook Dispatcher handles retries and slow endpoints."
        ),
        msg(
          "When a push happens, GitHub sends a webhook to every registered endpoint. If an endpoint is slow (>10 seconds), the request times out. If it fails, GitHub retries with exponential backoff: 5s, 30s, 5m, 30m, 2h. After 3 days of failures, the webhook is disabled. This protects GitHub from slow endpoints blocking the delivery queue."
        ),
        msg("Press ⌘K and search for \"Webhook Dispatcher\" and press Enter to add it, then connect Repository Service → Webhook Dispatcher."),
      ],
      requiredNodes: ['webhook_dispatcher'],
      requiredEdges: [edge('microservice', 'webhook_dispatcher')],
      successMessage: 'Webhook Dispatcher added and connected. Now code search.',
      errorMessage: 'Add a Webhook Dispatcher and connect it from the Repository Service.',
    }),
    step({
      id: 10,
      title: 'Add Search Service',
      explanation:
        "GitHub's Search Service indexes all public code — 200 billion lines of code across 420 million repositories. It powers code search, repository search, and the new AI-powered code search that understands natural language queries.",
      action: buildAction('Search Engine', 'Microservice', 'Search Service', '200 billion lines of code being indexed and searched with language-aware tokenization'),
      why: "Indexing 200 billion lines of code requires a custom search engine. GitHub built their own code search infrastructure (Blackbird) because general-purpose search engines like Elasticsearch couldn't handle code-specific queries efficiently.",
      component: component('search_engine', 'Search'),
      openingMessage: buildOpeningL1(
        'GitHub',
        'Search Service',
        'index 200 billion lines of code with language-aware tokenization and natural language queries',
        "Code search has unique requirements: exact symbol matching, regex support, language-aware tokenization (a dot in Python means something different than in English). GitHub's Blackbird engine handles these requirements. The new AI-powered search also understands natural language queries.",
        'Search Engine'
      ),
      celebrationMessage: buildCelebration(
        'Search Service',
        'Repository Service',
        "GitHub indexes 200 billion lines of code across 420 million repositories. They built a custom search engine called Blackbird for code-specific queries. The AI-powered search also understands natural language: 'how does authentication work in this repo'.",
        'NoSQL Database'
      ),
      messages: [
        msg(
          "GitHub indexes 200 billion lines of code. They built a custom search engine called Blackbird for this."
        ),
        msg(
          "Code search has unique requirements: exact symbol matching, regex support, language-aware tokenization (a dot in Python means something different than in English). GitHub's Blackbird engine handles these requirements. The new AI-powered search also understands natural language: 'how does authentication work in this repo'."
        ),
        msg("Press ⌘K and search for \"Search Engine\" and press Enter to add it, then connect Repository Service → Search Service."),
      ],
      requiredNodes: ['search_engine'],
      requiredEdges: [edge('microservice', 'search_engine')],
      successMessage: 'Search Service added and connected. Final step — the NoSQL database.',
      errorMessage: 'Add a Search Service and connect it from the Repository Service.',
    }),
    step({
      id: 11,
      title: 'Add NoSQL Database',
      explanation:
        "GitHub stores issue metadata, PR data, user activity, and notification state in NoSQL databases. Issues and PRs have flexible schemas — different issue types have different fields, and custom fields vary per repository.",
      action: buildAction('NoSQL Database', 'Code', 'NoSQL Database', 'issues, PRs, and user activity being stored with flexible schemas per repository'),
      why: "GitHub Projects (the project management feature) lets teams add custom fields to issues. NoSQL's flexible schema handles arbitrary custom fields without schema migrations.",
      component: component('nosql_db', 'NoSQL'),
      openingMessage: buildOpeningL1(
        'GitHub',
        'NoSQL Database',
        'store issues and PRs with custom fields per repository for GitHub Projects',
        "GitHub Projects lets teams add custom fields: priority, sprint, story points, custom labels. Each team has different fields. In a relational DB, you'd need a separate table per custom field type. NoSQL stores each issue as a document with whatever fields the team has configured.",
        'NoSQL Database'
      ),
      celebrationMessage: buildCelebration(
        'NoSQL Database',
        'Code Review Service',
        "GitHub stores issues and PRs in NoSQL — custom fields and flexible schemas make relational storage impractical. GitHub Projects lets teams add custom fields: priority, sprint, story points. NoSQL stores each issue as a document with whatever fields the team has configured.",
        'Object Storage'
      ),
      messages: [
        msg(
          "GitHub stores issues and PRs in NoSQL — custom fields and flexible schemas make relational storage impractical."
        ),
        msg(
          "GitHub Projects lets teams add custom fields: priority, sprint, story points, custom labels. Each team has different fields. In a relational DB, you'd need a separate table per custom field type. NoSQL stores each issue as a document with whatever fields the team has configured."
        ),
        msg("Press ⌘K and search for \"NoSQL Database\" and press Enter to add it, then connect Code Review Service → NoSQL Database."),
      ],
      requiredNodes: ['nosql_db'],
      requiredEdges: [edge('code_review_service', 'nosql_db')],
      successMessage: 'NoSQL Database added and connected. Final step — object storage.',
      errorMessage: 'Add a NoSQL Database and connect it from the Code Review Service.',
    }),
    step({
      id: 12,
      title: 'Add Object Storage',
      explanation:
        "GitHub stores release artifacts, LFS (Large File Storage) objects, and CI artifacts in Object Storage. Git LFS lets developers store large binary files (videos, datasets, models) outside the Git repository.",
      action: buildAction('Object Storage', 'CI', 'Object Storage', 'large files, release artifacts, and CI outputs being stored with Git LFS'),
      why: "Git is terrible at large binary files — they bloat the repository history. Git LFS stores large files in Object Storage and replaces them with pointer files in the Git repository. The actual binary is downloaded on demand.",
      component: component('object_storage', 'Object'),
      openingMessage: buildOpeningL1(
        'GitHub',
        'Object Storage',
        'store large files with Git LFS and CI artifacts with automatic expiration',
        "Without LFS, a 1GB video file would be stored in every clone of the repository forever. With LFS, the Git repo contains a 200-byte pointer file. The actual video is in Object Storage and downloaded only when needed. GitHub Actions CI artifacts are also stored here and expire after 90 days.",
        'Object Storage'
      ),
      celebrationMessage: buildCelebration(
        'Object Storage',
        'CI Runner',
        "Git LFS stores large binary files in Object Storage instead of the Git repository. A 1GB video becomes a 200-byte pointer in Git, with the actual file downloaded on demand. CI artifacts are also stored here and expire after 90 days. You have built GitHub.",
        'nothing — you have built GitHub'
      ),
      messages: [
        msg(
          "Git LFS stores large binary files in Object Storage instead of the Git repository."
        ),
        msg(
          "Without LFS, a 1GB video file would be stored in every clone of the repository forever. With LFS, the Git repo contains a 200-byte pointer file. The actual video is in Object Storage and downloaded only when needed. GitHub Actions CI artifacts (build outputs, test reports) are also stored here and expire after 90 days."
        ),
        msg("Press ⌘K and search for \"Object Storage\" and press Enter to add it, then connect CI Runner → Object Storage."),
      ],
      requiredNodes: ['object_storage'],
      requiredEdges: [edge('ci_runner', 'object_storage')],
      successMessage: 'Tutorial complete! You have built GitHub.',
      errorMessage: 'Add an Object Storage and connect it from the CI Runner.',
    }),
  ],
});

const l2 = level({
  level: 2,
  title: "GitHub at Scale",
  subtitle: "Scale GitHub to handle billions of events and petabytes of Git storage",
  description:
    "Add event streaming, real-time notifications, CDC pipelines, and observability to GitHub's core architecture. Handle billions of webhook events, track SLOs with error budgets, and mirror data to analytics.",
  estimatedTime: "~28 mins",
  unlocks: undefined,
  contextMessage:
    "Let's scale GitHub. Billions of events per day, petabytes of Git storage, and 99.99% uptime for the world's code. This requires event streaming, change data capture, and enterprise-grade observability.",
  steps: [
    step({
      id: 1,
      title: "Add Kafka Streaming",
      explanation:
        "GitHub's Event Bus handles billions of events daily: push events, PR events, CI completion events. Kafka handles peak throughput during popular repository releases.",
      action: buildAction(
        "Kafka / Streaming",
        "Load Balancer",
        "Kafka Streaming",
        "Git operations and API events being streamed to notification and analytics consumers in real time"
      ),
      why: "Without Kafka, every webhook delivery would be synchronous — slowing down push operations. Kafka decouples event producers from consumers.",
      component: component("kafka_streaming", "Kafka / Streaming"),
      openingMessage: buildOpeningL2(
        "GitHub",
        "Kafka",
        "stream push events, PR events, and CI completion to notification and analytics consumers in real time",
        "Without Kafka, every webhook delivery would be synchronous — slowing down push operations.",
        "Kafka / Streaming"
      ),
      celebrationMessage: buildCelebration(
        "Kafka Streaming",
        "Load Balancer",
        "GitHub's Kafka handles billions of events daily — push events, PR events, CI completion events. Peak throughput during popular open-source releases is handled gracefully.",
        "Notification Worker"
      ),
      messages: [
        msg(
          "Level 2 — GitHub at Scale. Kafka handles billions of events daily: push events, PR events, CI completion events."
        ),
        msg(
          "When a popular open-source project releases a new version, thousands of CI systems and integrations consume webhook events simultaneously. Kafka handles this peak throughput without slowing down push operations."
        ),
        msg(
          'Press ⌘K and search for "Kafka / Streaming" and press Enter to add it, then connect Load Balancer → Kafka Streaming.'
        ),
      ],
      requiredNodes: ["kafka_streaming"],
      requiredEdges: [edge("load_balancer", "kafka_streaming")],
      successMessage: "Events streaming. Now notifications.",
      errorMessage: "Add Kafka Streaming connected from the Load Balancer.",
    }),
    step({
      id: 2,
      title: "Add Notification Worker",
      explanation:
        "GitHub's Notification Worker processes email, push, and in-app notifications. When you push code, it notifies all watchers, mentioned users, and CI subscribers.",
      action: buildAction(
        "Worker",
        "Kafka",
        "Notification Worker",
        "notifications being sent for watch updates, @mentions, and CI completion — batched for viral repository spikes"
      ),
      why: "If every push notified all watchers synchronously, push operations would be slow. The notification worker handles this asynchronously.",
      component: component("worker_job", "Worker"),
      openingMessage: buildOpeningL2(
        "GitHub",
        "Notification Worker",
        "process email, push, and in-app notifications asynchronously — batching for viral repository spikes",
        "If every push notified all watchers synchronously, push operations would crawl.",
        "Worker"
      ),
      celebrationMessage: buildCelebration(
        "Notification Worker",
        "Kafka Streaming",
        "GitHub's Notification Worker processes email, push, and in-app notifications. When you push code, it notifies all watchers, mentioned users, and CI subscribers. Notifications are batched to prevent notification storms.",
        "CDC Connector"
      ),
      messages: [
        msg(
          "The Notification Worker processes email, push, and in-app notifications asynchronously."
        ),
        msg(
          "When you push code, GitHub notifies all watchers, mentioned users, and CI subscribers. For repositories with millions of watchers, notifications are batched to prevent device overwhelm."
        ),
        msg(
          'Press ⌘K and search for "Worker / Background Job" and press Enter to add it, then connect Kafka Streaming → Notification Worker.'
        ),
      ],
      requiredNodes: ["worker_job"],
      requiredEdges: [edge("kafka_streaming", "worker_job")],
      successMessage: "Notifications added. Now CDC pipelines.",
      errorMessage: "Add a Worker connected from Kafka Streaming.",
    }),
    step({
      id: 3,
      title: "Add CDC Connector",
      explanation:
        "GitHub's CDC Connector mirrors repository data to the Analytics Platform. Every commit, PR, and issue change streams to ClickHouse for real-time analytics.",
      action: buildAction(
        "CDC Connector",
        "Microservice",
        "CDC Connector",
        "every commit, PR, and issue change being mirrored to ClickHouse for real-time analytics"
      ),
      why: "Real-time analytics on Git operations requires streaming data changes. CDC captures every mutation without polling.",
      component: component("cdc_connector", "CDC Connector"),
      openingMessage: buildOpeningL2(
        "GitHub",
        "CDC Connector",
        "stream every commit, PR, and issue change to ClickHouse for real-time analytics",
        "Real-time analytics on Git operations requires streaming data changes — CDC captures every mutation.",
        "CDC Connector"
      ),
      celebrationMessage: buildCelebration(
        "CDC Connector",
        "Repository Service",
        "GitHub's CDC Connector mirrors repository data to ClickHouse. Every commit, PR, and issue change streams in real time for analytics — enabling contributor graphs, commit frequency analysis, and code churn metrics.",
        "SQL Database"
      ),
      messages: [
        msg(
          "The CDC Connector mirrors repository data to the Analytics Platform."
        ),
        msg(
          "Every commit, PR, and issue change streams to ClickHouse for real-time analytics. GitHub Engineering uses this data to understand code churn, contributor patterns, and repository health."
        ),
        msg(
          'Press ⌘K and search for "CDC Connector" and press Enter to add it, then connect Repository Service → CDC Connector.'
        ),
      ],
      requiredNodes: ["cdc_connector"],
      requiredEdges: [edge("microservice", "cdc_connector")],
      successMessage: "CDC pipeline added. Now SQL database.",
      errorMessage: "Add a CDC Connector connected from the Repository Service.",
    }),
    step({
      id: 4,
      title: "Add SQL Database",
      explanation:
        "GitHub's main SQL database (MySQL) stores user accounts, repository metadata, and access control. GitHub famously runs MySQL at scale — all forks share storage with the parent via content-addressable Git storage.",
      action: buildAction(
        "SQL Database",
        "Auth Service",
        "SQL Database",
        "user accounts, repository metadata, and access control being stored with ACID guarantees"
      ),
      why: "GitHub's relational data (users, permissions, billing) requires ACID transactions. Fork storage efficiency comes from Git's content-addressable storage.",
      component: component("sql_db", "SQL Database"),
      openingMessage: buildOpeningL2(
        "GitHub",
        "SQL Database",
        "store user accounts and access control with ACID guarantees — forks share storage via Git's content-addressable storage",
        "GitHub's relational data requires ACID transactions — forks share storage via Git's content-addressable storage.",
        "SQL Database"
      ),
      celebrationMessage: buildCelebration(
        "SQL Database",
        "Auth Service",
        "GitHub's MySQL stores user accounts, repository metadata, and access control. GitHub famously runs MySQL at massive scale — all forks share storage with the parent via content-addressable Git storage.",
        "Structured Logger"
      ),
      messages: [
        msg(
          "GitHub's main SQL database (MySQL) stores user accounts, repository metadata, and access control."
        ),
        msg(
          "GitHub famously runs MySQL at scale — all forks share storage with the parent via content-addressable Git storage. This is why forking a repository is nearly instant."
        ),
        msg(
          'Press ⌘K and search for "SQL Database" and press Enter to add it, then connect Auth Service → SQL Database.'
        ),
      ],
      requiredNodes: ["sql_db"],
      requiredEdges: [edge("auth_service", "sql_db")],
      successMessage: "SQL database added. Now structured logging.",
      errorMessage: "Add a SQL Database connected from the Auth Service.",
    }),
    step({
      id: 5,
      title: "Add Structured Logger",
      explanation:
        "GitHub's Structured Logger captures every API request, Git operation, and system event with JSON logs. Logs flow to Splunk for analysis — GitHub processes billions of log lines daily.",
      action: buildAction(
        "Structured Logger",
        "Load Balancer",
        "Structured Logger",
        "every API request and Git operation being logged with JSON schemas for Splunk analysis"
      ),
      why: "Text logs require regex parsing — structured JSON enables fast aggregation across billions of entries.",
      component: component("structured_logger", "Structured Logger"),
      openingMessage: buildOpeningL2(
        "GitHub",
        "Structured Logger",
        "emit JSON logs with consistent schemas for API requests and Git operations across all services",
        "Text logs require regex parsing — structured JSON enables fast Splunk queries across billions of entries.",
        "Structured Logger"
      ),
      celebrationMessage: buildCelebration(
        "Structured Logger",
        "Load Balancer",
        "GitHub's Structured Logger captures every API request, Git operation, and system event with JSON logs. Logs flow to Splunk for analysis — GitHub processes billions of log lines daily.",
        "SLO/SLI Tracker"
      ),
      messages: [
        msg(
          "Structured Logger captures every API request, Git operation, and system event with JSON logs."
        ),
        msg(
          "Logs flow to Splunk for analysis — GitHub processes billions of log lines daily. Structured JSON enables fast queries across all services."
        ),
        msg(
          'Press ⌘K and search for "Structured Logger" and press Enter to add it, then connect Load Balancer → Structured Logger.'
        ),
      ],
      requiredNodes: ["structured_logger"],
      requiredEdges: [edge("load_balancer", "structured_logger")],
      successMessage: "Structured logging added. Now SLO tracking.",
      errorMessage: "Add a Structured Logger connected from the Load Balancer.",
    }),
    step({
      id: 6,
      title: "Add SLO/SLI Tracker",
      explanation:
        "GitHub's SLO Tracker monitors API availability, Git operation latency, and Actions pipeline completion. GitHub tracks SLOs for hundreds of services with 99.99% targets for critical paths.",
      action: buildAction(
        "SLO/SLI Tracker",
        "Structured Logger",
        "SLO/SLI Tracker",
        "API availability and Git operation latency being tracked against SLO targets — alerting when error budgets burn"
      ),
      why: "Without SLOs, engineering teams argue about what acceptable performance means. GitHub's 99.99% target for critical paths requires precise measurement.",
      component: component("slo_tracker", "SLO/SLI Tracker"),
      openingMessage: buildOpeningL2(
        "GitHub",
        "SLO/SLI Tracker",
        "monitor API availability, Git operation latency, and Actions pipeline completion against defined SLO targets",
        "Without SLOs, engineering teams argue about what acceptable performance means.",
        "SLO/SLI Tracker"
      ),
      celebrationMessage: buildCelebration(
        "SLO/SLI Tracker",
        "Structured Logger",
        "GitHub's SLO Tracker monitors API availability, Git operation latency, and Actions pipeline completion. GitHub tracks SLOs for hundreds of services with 99.99% targets for critical paths.",
        "Error Budget Monitor"
      ),
      messages: [
        msg(
          "The SLO Tracker monitors API availability, Git operation latency, and Actions pipeline completion."
        ),
        msg(
          "GitHub tracks SLOs for hundreds of services with 99.99% targets for critical paths. When latency exceeds SLOs, the on-call team is alerted before users notice."
        ),
        msg(
          'Press ⌘K and search for "SLO/SLI Tracker" and press Enter to add it, then connect Structured Logger → SLO/SLI Tracker.'
        ),
      ],
      requiredNodes: ["slo_tracker"],
      requiredEdges: [edge("structured_logger", "slo_tracker")],
      successMessage: "SLO tracking added. Now error budgets.",
      errorMessage: "Add an SLO/SLI Tracker connected from the Structured Logger.",
    }),
    step({
      id: 7,
      title: "Add Error Budget Monitor",
      explanation:
        "GitHub's Error Budget Monitor tracks how much SLO budget has been consumed. When the budget is depleted, GitHub automatically reduces non-critical deployments to protect service reliability.",
      action: buildAction(
        "Error Budget Monitor",
        "SLO/SLI Tracker",
        "Error Budget Monitor",
        "error budget burn rate being tracked — pausing feature deployments when budget depletes to protect reliability"
      ),
      why: "The error budget is the reliability buffer — when depleted, feature launches pause until reliability improves.",
      component: component("error_budget_alert", "Error Budget Monitor"),
      openingMessage: buildOpeningL2(
        "GitHub",
        "Error Budget Monitor",
        "track error budget burn rate — pausing deployments when budget depletes to protect service reliability",
        "The error budget is the reliability buffer — when depleted, feature launches pause for reliability work.",
        "Error Budget Monitor"
      ),
      celebrationMessage: buildCelebration(
        "Error Budget Monitor",
        "SLO/SLI Tracker",
        "GitHub's Error Budget Monitor tracks how much SLO budget has been consumed. When the budget is depleted, GitHub automatically reduces non-critical deployments to protect service reliability.",
        "In-Memory Cache"
      ),
      messages: [
        msg(
          "The Error Budget Monitor tracks how much SLO budget has been consumed."
        ),
        msg(
          "When the budget is depleted, GitHub automatically reduces non-critical deployments to protect service reliability. This prevents reliability from being sacrificed for velocity."
        ),
        msg(
          'Press ⌘K and search for "Error Budget Monitor" and press Enter to add it, then connect SLO/SLI Tracker → Error Budget Monitor.'
        ),
      ],
      requiredNodes: ["error_budget_alert"],
      requiredEdges: [edge("slo_tracker", "error_budget_alert")],
      successMessage: "Error budget monitoring added. Now caching.",
      errorMessage: "Add an Error Budget Monitor connected from the SLO/SLI Tracker.",
    }),
    step({
      id: 8,
      title: "Add In-Memory Cache",
      explanation:
        "GitHub's Redis Cache serves hot repository metadata and rate limit counters. GitHub's cache hit rate exceeds 95% for repository metadata — reducing MySQL load by orders of magnitude.",
      action: buildAction(
        "In-Memory Cache",
        "Load Balancer",
        "In-Memory Cache",
        "hot repository metadata and rate limit counters being cached for sub-millisecond reads"
      ),
      why: "Querying MySQL for every repository metadata request is slow and expensive. Redis caches hot data — 95% hit rate reduces MySQL load dramatically.",
      component: component("in_memory_cache", "In-Memory Cache"),
      openingMessage: buildOpeningL2(
        "GitHub",
        "Redis (In-Memory Cache)",
        "cache repository metadata and rate limit counters for sub-millisecond reads — reducing MySQL load by orders of magnitude",
        "Querying MySQL for every metadata request is slow — Redis caches hot data with 95%+ hit rate.",
        "In-Memory Cache"
      ),
      celebrationMessage: buildCelebration(
        "In-Memory Cache",
        "Load Balancer",
        "GitHub's Redis Cache serves hot repository metadata and rate limit counters. GitHub's cache hit rate exceeds 95% for repository metadata — reducing MySQL load by orders of magnitude. GitHub is now scaled to handle billions of events.",
        "nothing — GitHub is now scaled"
      ),
      messages: [
        msg(
          "Redis Cache serves hot repository metadata and rate limit counters with 95%+ hit rate."
        ),
        msg(
          "This reduces MySQL load by orders of magnitude. When a popular repository is accessed, metadata is served from Redis instead of MySQL for subsequent requests."
        ),
        msg(
          'Press ⌘K and search for "In-Memory Cache" and press Enter to add it, then connect Load Balancer → In-Memory Cache.'
        ),
      ],
      requiredNodes: ["in_memory_cache"],
      requiredEdges: [edge("load_balancer", "in_memory_cache")],
      successMessage: "In-memory cache added. GitHub is now scaled to handle billions of events.",
      errorMessage: "Add an In-Memory Cache connected from the Load Balancer.",
    }),
  ],
});

const l3 = level({
  level: 3,
  title: "GitHub Enterprise",
  subtitle: "Add enterprise-grade security, observability, and analytics",
  description:
    "Implement zero-trust networking with mTLS, distributed tracing across all Git operations, and petabyte-scale analytics. GitHub Enterprise requires SPIFFE certificates, GraphQL Federation, and change data capture at scale.",
  estimatedTime: "~29 mins",
  unlocks: undefined,
  contextMessage:
    "Let's make GitHub enterprise-grade. Zero-trust networking, petabyte-scale analytics, and sub-millisecond observability. GitHub Enterprise Cloud serves Fortune 500 companies with compliance requirements that shape the architecture.",
  steps: [
    step({
      id: 1,
      title: "Add Service Mesh",
      explanation:
        "GitHub's Service Mesh (Envoy) handles mutual TLS between all services, circuit breaking, and retries. Every internal service call is encrypted and authenticated — zero-trust networking.",
      action: buildAction(
        "Service Mesh (Istio)",
        "Load Balancer",
        "Service Mesh",
        "mTLS, circuit breaking, and retries being enforced at the sidecar proxy level for all service-to-service communication"
      ),
      why: "Without a service mesh, each service implements TLS differently — inconsistent and a security risk. Envoy handles this transparently.",
      component: component("service_mesh", "Service Mesh (Istio)"),
      openingMessage: buildOpeningL3(
        "GitHub",
        "Service Mesh (Envoy)",
        "enforce mTLS, circuit breaking, and retries at the sidecar proxy level — zero-trust networking",
        "Without a service mesh, each service implements TLS differently — inconsistent and a security risk.",
        "Service Mesh (Istio)"
      ),
      celebrationMessage: buildCelebration(
        "Service Mesh",
        "Load Balancer",
        "GitHub's Service Mesh (Envoy) handles mutual TLS between all services. Every internal service call is encrypted and authenticated — zero-trust networking. Circuit breaking prevents cascade failures.",
        "GraphQL Federation Gateway"
      ),
      messages: [
        msg(
          "Level 3 — GitHub Enterprise. The Service Mesh adds sidecar proxies handling mTLS, retries, circuit breaking, and load balancing transparently."
        ),
        msg(
          "Every internal service call is encrypted and authenticated — zero-trust networking. Envoy sidecars handle circuit breaking to prevent cascade failures."
        ),
        msg(
          'Press ⌘K and search for "Service Mesh (Istio)" and press Enter to add it, then connect Load Balancer → Service Mesh.'
        ),
      ],
      requiredNodes: ["service_mesh"],
      requiredEdges: [edge("load_balancer", "service_mesh")],
      successMessage: "Service mesh added. Now GraphQL Federation.",
      errorMessage: "Add a Service Mesh connected from the Load Balancer.",
    }),
    step({
      id: 2,
      title: "Add GraphQL Federation Gateway",
      explanation:
        "GitHub's GraphQL Federation composes the API from multiple services: Repositories, Users, Actions, Packages. Each domain owns its schema, and the gateway composes them into a unified API.",
      action: buildAction(
        "GraphQL Federation Gateway",
        "API Gateway",
        "GraphQL Federation Gateway",
        "API being composed from Repositories, Users, Actions, and Packages services with a unified schema"
      ),
      why: "Without federation, the API Gateway would own all data fetching logic — a monolith. Federation lets each domain own its schema while the gateway composes them.",
      component: component("graphql_federation", "GraphQL Federation Gateway"),
      openingMessage: buildOpeningL3(
        "GitHub",
        "GraphQL Federation Gateway",
        "compose the API from Repositories, Users, Actions, and Packages services — each domain owns its schema",
        "Without federation, the API Gateway would own all data fetching logic — a monolith.",
        "GraphQL Federation Gateway"
      ),
      celebrationMessage: buildCelebration(
        "GraphQL Federation Gateway",
        "API Gateway",
        "GitHub's GraphQL Federation composes the API from multiple services: Repositories, Users, Actions, Packages. Each domain owns its schema — enabling independent deployments and schema evolution.",
        "Token Bucket Rate Limiter"
      ),
      messages: [
        msg(
          "GraphQL Federation composes the API from multiple services."
        ),
        msg(
          "Each domain (Repositories, Users, Actions, Packages) owns its schema. The gateway composes them into a unified API — enabling independent deployments and schema evolution."
        ),
        msg(
          'Press ⌘K and search for "GraphQL Federation Gateway" and press Enter to add it, then connect API Gateway → GraphQL Federation Gateway.'
        ),
      ],
      requiredNodes: ["graphql_federation"],
      requiredEdges: [edge("api_gateway", "graphql_federation")],
      successMessage: "GraphQL Federation added. Now rate limiting.",
      errorMessage: "Add a GraphQL Federation Gateway connected from the API Gateway.",
    }),
    step({
      id: 3,
      title: "Add Token Bucket Rate Limiter",
      explanation:
        "GitHub's Rate Limiter uses token buckets per authenticated user. GitHub's free tier allows 60 requests/hour for unauthenticated, 5,000 for authenticated, and 15,000 for GitHub Apps.",
      action: buildAction(
        "Token Bucket Rate Limiter",
        "API Gateway",
        "Token Bucket Rate Limiter",
        "per-user rate limits being enforced: 60/hour unauthenticated, 5,000/hour authenticated, 15,000/hour for GitHub Apps"
      ),
      why: "Rate limiting protects GitHub's API from abuse while enabling fair access. Token buckets allow burst traffic while enforcing average rate limits.",
      component: component("token_bucket_limiter", "Token Bucket Rate Limiter"),
      openingMessage: buildOpeningL3(
        "GitHub",
        "Token Bucket Rate Limiter",
        "enforce per-user rate limits with token buckets: 60/hour unauthenticated, 5,000/hour authenticated, 15,000/hour GitHub Apps",
        "Rate limiting protects the API from abuse while enabling fair access — token buckets allow bursts.",
        "Token Bucket Rate Limiter"
      ),
      celebrationMessage: buildCelebration(
        "Token Bucket Rate Limiter",
        "API Gateway",
        "GitHub's Rate Limiter uses token buckets per authenticated user. Free tier: 60/hour unauthenticated, 5,000/hour authenticated, 15,000/hour for GitHub Apps. Token buckets allow burst traffic while enforcing average limits.",
        "OpenTelemetry Collector"
      ),
      messages: [
        msg(
          "Rate Limiter uses token buckets per authenticated user."
        ),
        msg(
          "GitHub's free tier: 60 requests/hour for unauthenticated, 5,000 for authenticated, 15,000 for GitHub Apps. Token buckets allow burst traffic while enforcing average rate limits."
        ),
        msg(
          'Press ⌘K and search for "Token Bucket Rate Limiter" and press Enter to add it, then connect API Gateway → Token Bucket Rate Limiter.'
        ),
      ],
      requiredNodes: ["token_bucket_limiter"],
      requiredEdges: [edge("api_gateway", "token_bucket_limiter")],
      successMessage: "Rate limiting added. Now distributed tracing.",
      errorMessage: "Add a Token Bucket Rate Limiter connected from the API Gateway.",
    }),
    step({
      id: 4,
      title: "Add OpenTelemetry Collector",
      explanation:
        "GitHub's OTel Collector aggregates traces from all Git operations and API requests. With 100+ services, distributed tracing is essential to understand latency across the Git operation pipeline.",
      action: buildAction(
        "OpenTelemetry Collector",
        "Structured Logger",
        "OpenTelemetry Collector",
        "traces being aggregated from all Git operations and API requests for distributed tracing"
      ),
      why: "With 100+ services, a single API request spans dozens of services. Distributed tracing links these spans to understand end-to-end latency.",
      component: component("otel_collector", "OpenTelemetry Collector"),
      openingMessage: buildOpeningL3(
        "GitHub",
        "OpenTelemetry Collector",
        "aggregate traces from all Git operations and API requests — understanding latency across the Git operation pipeline",
        "With 100+ services, a single request spans dozens of services — distributed tracing links spans.",
        "OpenTelemetry Collector"
      ),
      celebrationMessage: buildCelebration(
        "OpenTelemetry Collector",
        "Structured Logger",
        "GitHub's OTel Collector aggregates traces from all Git operations and API requests. With 100+ services, distributed tracing is essential to understand latency across the Git operation pipeline.",
        "Correlation ID Handler"
      ),
      messages: [
        msg(
          "OTel Collector aggregates traces from all Git operations and API requests."
        ),
        msg(
          "With 100+ services, a single push spans dozens of services: webhook reception, auth validation, Git object storage, notification dispatch. Distributed tracing links these spans to understand end-to-end latency."
        ),
        msg(
          'Press ⌘K and search for "OpenTelemetry Collector" and press Enter to add it, then connect Structured Logger → OpenTelemetry Collector.'
        ),
      ],
      requiredNodes: ["otel_collector"],
      requiredEdges: [edge("structured_logger", "otel_collector")],
      successMessage: "OTel Collector added. Now correlation IDs.",
      errorMessage: "Add an OpenTelemetry Collector connected from the Structured Logger.",
    }),
    step({
      id: 5,
      title: "Add Correlation ID Handler",
      explanation:
        "GitHub's Correlation ID Injector adds a trace ID to every Git operation and API request. When a push triggers Actions CI, the correlation ID links the webhook delivery, CI trigger, and build logs.",
      action: buildAction(
        "Correlation ID Handler",
        "Load Balancer",
        "Correlation ID Handler",
        "trace IDs being injected into every Git operation and API request — linking webhook delivery, CI triggers, and build logs"
      ),
      why: "Without correlation IDs, debugging a push that triggers a failed CI run requires manually linking webhook logs, CI triggers, and build logs. Correlation IDs automate this.",
      component: component("correlation_id_handler", "Correlation ID Handler"),
      openingMessage: buildOpeningL3(
        "GitHub",
        "Correlation ID Handler",
        "inject trace IDs into every Git operation and API request — linking webhook delivery, CI triggers, and build logs",
        "Without correlation IDs, debugging cross-service issues requires manual log linking.",
        "Correlation ID Handler"
      ),
      celebrationMessage: buildCelebration(
        "Correlation ID Handler",
        "Load Balancer",
        "GitHub's Correlation ID Injector adds a trace ID to every Git operation and API request. When a push triggers Actions CI, the correlation ID links the webhook delivery, CI trigger, and build logs for end-to-end debugging.",
        "mTLS Certificate Authority"
      ),
      messages: [
        msg(
          "Correlation ID Injector adds trace IDs to every Git operation and API request."
        ),
        msg(
          "When a push triggers Actions CI, the correlation ID links webhook delivery, CI trigger, and build logs. Without this, debugging a failed CI run requires manually correlating dozens of log entries."
        ),
        msg(
          'Press ⌘K and search for "Correlation ID Handler" and press Enter to add it, then connect Load Balancer → Correlation ID Handler.'
        ),
      ],
      requiredNodes: ["correlation_id_handler"],
      requiredEdges: [edge("load_balancer", "correlation_id_handler")],
      successMessage: "Correlation IDs added. Now mTLS CA.",
      errorMessage: "Add a Correlation ID Handler connected from the Load Balancer.",
    }),
    step({
      id: 6,
      title: "Add mTLS Certificate Authority",
      explanation:
        "GitHub's SPIFFE/SPIRE CA issues short-lived certificates to every service. Certificates rotate every 24 hours — if a service is compromised, its certificate is revoked within minutes.",
      action: buildAction(
        "mTLS Certificate Authority",
        "Service Mesh",
        "mTLS Certificate Authority",
        "short-lived SPIFFE certificates being issued to every service — rotating every 24 hours with automatic revocation"
      ),
      why: "Long-lived credentials are a security risk — if stolen, they work forever. Short-lived certificates rotate automatically, limiting the blast radius of a compromised service.",
      component: component("mtls_certificate_authority", "mTLS Certificate Authority"),
      openingMessage: buildOpeningL3(
        "GitHub",
        "SPIFFE/SPIRE CA",
        "issue short-lived certificates to every service — rotating every 24 hours with automatic revocation on compromise",
        "Long-lived credentials are a security risk — short-lived certificates rotate automatically.",
        "mTLS Certificate Authority"
      ),
      celebrationMessage: buildCelebration(
        "mTLS Certificate Authority",
        "Service Mesh",
        "GitHub's SPIFFE/SPIRE CA issues short-lived certificates to every service. Certificates rotate every 24 hours — if a service is compromised, its certificate is revoked within minutes. This is zero-trust networking at scale.",
        "Cache Stampede Guard"
      ),
      messages: [
        msg(
          "SPIFFE/SPIRE CA issues short-lived certificates to every service."
        ),
        msg(
          "Certificates rotate every 24 hours. If a service is compromised, its certificate is revoked within minutes — limiting the blast radius of the security incident."
        ),
        msg(
          'Press ⌘K and search for "mTLS Certificate Authority" and press Enter to add it, then connect Service Mesh → mTLS Certificate Authority.'
        ),
      ],
      requiredNodes: ["mtls_certificate_authority"],
      requiredEdges: [edge("service_mesh", "mtls_certificate_authority")],
      successMessage: "mTLS CA added. Now cache stampede protection.",
      errorMessage: "Add an mTLS Certificate Authority connected from the Service Mesh.",
    }),
    step({
      id: 7,
      title: "Add Cache Stampede Guard",
      explanation:
        "GitHub's Cache Stampede Guard prevents thundering herds when a popular repository's cache expires. Lock-assisted cache refresh ensures only one worker refreshes while others serve stale data.",
      action: buildAction(
        "Cache Stampede Guard",
        "In-Memory Cache",
        "Cache Stampede Guard",
        "thundering herd prevention being enforced with lock-assisted cache refresh — only one worker refreshes while others serve stale data"
      ),
      why: "When a cache expires for a popular repository, thousands of requests hit the database simultaneously. Lock-assisted refresh ensures only one worker refreshes — protecting the database.",
      component: component("cache_stampede_guard", "Cache Stampede Guard"),
      openingMessage: buildOpeningL3(
        "GitHub",
        "Cache Stampede Guard",
        "prevent thundering herds when cache expires — lock-assisted refresh ensures only one worker refreshes",
        "When cache expires for a popular repo, thousands of requests hit the database — lock-assisted refresh protects it.",
        "Cache Stampede Guard"
      ),
      celebrationMessage: buildCelebration(
        "Cache Stampede Guard",
        "In-Memory Cache",
        "GitHub's Cache Stampede Guard prevents thundering herds when a popular repository's cache expires. Lock-assisted cache refresh ensures only one worker refreshes while others serve stale data — protecting the database from cascade failures.",
        "Change Data Cache"
      ),
      messages: [
        msg(
          "Cache Stampede Guard prevents thundering herds when popular repository caches expire."
        ),
        msg(
          "When a cache expires for a popular repository, thousands of requests hit the database simultaneously. Lock-assisted refresh ensures only one worker refreshes while others serve stale data."
        ),
        msg(
          'Press ⌘K and search for "Cache Stampede Guard" and press Enter to add it, then connect In-Memory Cache → Cache Stampede Guard.'
        ),
      ],
      requiredNodes: ["cache_stampede_guard"],
      requiredEdges: [edge("in_memory_cache", "cache_stampede_guard")],
      successMessage: "Cache stampede protection added. Now CDC cache.",
      errorMessage: "Add a Cache Stampede Guard connected from the In-Memory Cache.",
    }),
    step({
      id: 8,
      title: "Add Change Data Cache",
      explanation:
        "GitHub's CDC pipeline caches materialized views of the social graph: 'who starred this repo', 'who contributes to this org'. These views are precomputed and cached for sub-10ms queries.",
      action: buildAction(
        "Change Data Cache",
        "CDC Connector",
        "Change Data Cache",
        "materialized views of the social graph being precomputed and cached — 'who starred this repo', 'who contributes to this org'"
      ),
      why: "Social graph queries (who starred this repo) require scanning millions of records. Materialized views precompute these results for sub-10ms queries.",
      component: component("change_data_cache", "Change Data Cache"),
      openingMessage: buildOpeningL3(
        "GitHub",
        "Change Data Cache",
        "cache materialized views of the social graph: 'who starred this repo', 'who contributes to this org' — sub-10ms queries",
        "Social graph queries require scanning millions of records — materialized views precompute results.",
        "Change Data Cache"
      ),
      celebrationMessage: buildCelebration(
        "Change Data Cache",
        "CDC Connector",
        "GitHub's CDC pipeline caches materialized views of the social graph: 'who starred this repo', 'who contributes to this org'. These views are precomputed and cached for sub-10ms queries.",
        "Data Warehouse"
      ),
      messages: [
        msg(
          "CDC pipeline caches materialized views of the social graph."
        ),
        msg(
          "Queries like 'who starred this repo' and 'who contributes to this org' would require scanning millions of records. Materialized views precompute these results for sub-10ms queries."
        ),
        msg(
          'Press ⌘K and search for "Change Data Cache" and press Enter to add it, then connect CDC Connector → Change Data Cache.'
        ),
      ],
      requiredNodes: ["change_data_cache"],
      requiredEdges: [edge("cdc_connector", "change_data_cache")],
      successMessage: "CDC cache added. Now data warehouse.",
      errorMessage: "Add a Change Data Cache connected from the CDC Connector.",
    }),
    step({
      id: 9,
      title: "Add Data Warehouse",
      explanation:
        "GitHub's Data Warehouse (ClickHouse) stores all Git activity for analytics: commit frequency, contributor graphs, and code churn. Petabyte-scale analytics on Git operations inform engineering decisions.",
      action: buildAction(
        "Data Warehouse",
        "CDC Connector",
        "Data Warehouse",
        "all Git activity being stored for analytics: commit frequency, contributor graphs, and code churn at petabyte scale"
      ),
      why: "GitHub's engineering decisions are informed by data: which languages are growing, which repositories have high code churn, where CI times are increasing. The data warehouse enables this analysis.",
      component: component("data_warehouse", "Data Warehouse"),
      openingMessage: buildOpeningL3(
        "GitHub",
        "Data Warehouse (ClickHouse)",
        "store all Git activity for analytics: commit frequency, contributor graphs, and code churn at petabyte scale",
        "GitHub's engineering decisions are informed by data — which languages are growing, where CI times increase.",
        "Data Warehouse"
      ),
      celebrationMessage: buildCelebration(
        "Data Warehouse",
        "CDC Connector",
        "GitHub's Data Warehouse (ClickHouse) stores all Git activity for analytics: commit frequency, contributor graphs, and code churn. Petabyte-scale analytics on Git operations inform engineering decisions.",
        "Event Store"
      ),
      messages: [
        msg(
          "Data Warehouse stores all Git activity for analytics at petabyte scale."
        ),
        msg(
          "Commit frequency, contributor graphs, and code churn inform GitHub's engineering decisions. Which languages are growing? Where are CI times increasing? The data warehouse enables this analysis."
        ),
        msg(
          'Press ⌘K and search for "Data Warehouse" and press Enter to add it, then connect CDC Connector → Data Warehouse.'
        ),
      ],
      requiredNodes: ["data_warehouse"],
      requiredEdges: [edge("cdc_connector", "data_warehouse")],
      successMessage: "Data warehouse added. Now event store.",
      errorMessage: "Add a Data Warehouse connected from the CDC Connector.",
    }),
    step({
      id: 10,
      title: "Add Event Store",
      explanation:
        "GitHub's Event Store stores every audit event: repository creation, access grants, billing changes. Immutable audit logs are critical for enterprise compliance and security investigations.",
      action: buildAction(
        "Event Store",
        "Kafka",
        "Event Store",
        "every audit event being stored immutably: repository creation, access grants, billing changes — for compliance and security"
      ),
      why: "Enterprise customers require immutable audit logs for compliance. When a security incident occurs, auditors need to replay exactly what happened.",
      component: component("event_store", "Event Store"),
      openingMessage: buildOpeningL3(
        "GitHub",
        "Event Store",
        "store every audit event immutably: repository creation, access grants, billing changes — for enterprise compliance",
        "Enterprise customers require immutable audit logs — auditors need to replay exactly what happened.",
        "Event Store"
      ),
      celebrationMessage: buildCelebration(
        "Event Store",
        "Kafka Streaming",
        "GitHub's Event Store stores every audit event immutably: repository creation, access grants, billing changes. Immutable audit logs are critical for enterprise compliance and security investigations.",
        "BFF Gateway"
      ),
      messages: [
        msg(
          "Event Store stores every audit event immutably for enterprise compliance."
        ),
        msg(
          "Repository creation, access grants, billing changes — every action is recorded. When a security incident occurs, auditors can replay exactly what happened."
        ),
        msg(
          'Press ⌘K and search for "Event Store" and press Enter to add it, then connect Kafka Streaming → Event Store.'
        ),
      ],
      requiredNodes: ["event_store"],
      requiredEdges: [edge("kafka_streaming", "event_store")],
      successMessage: "Event store added. Now BFF gateway.",
      errorMessage: "Add an Event Store connected from the Kafka Streaming.",
    }),
    step({
      id: 11,
      title: "Add BFF Gateway",
      explanation:
        "GitHub's BFF Gateway (Node.js) serves the web client with domain-specific APIs. The BFF aggregates data from multiple GraphQL resolvers, handles SSR hydration, and manages OAuth session state.",
      action: buildAction(
        "BFF Gateway",
        "Web",
        "BFF Gateway",
        "web client being served with domain-specific APIs — aggregating GraphQL resolvers, handling SSR hydration, and managing OAuth sessions"
      ),
      why: "The web client has specific needs: server-side rendering hydration, OAuth session management, and optimized API calls. A BFF tailors the API to the client.",
      component: component("bff_gateway", "BFF Gateway"),
      openingMessage: buildOpeningL3(
        "GitHub",
        "BFF Gateway (Node.js)",
        "serve the web client with domain-specific APIs — aggregating GraphQL resolvers, handling SSR hydration, managing OAuth sessions",
        "The web client has specific needs: SSR hydration, OAuth sessions, optimized API calls.",
        "BFF Gateway"
      ),
      celebrationMessage: buildCelebration(
        "BFF Gateway",
        "Web Client",
        "GitHub's BFF Gateway (Node.js) serves the web client with domain-specific APIs. The BFF aggregates data from multiple GraphQL resolvers, handles SSR hydration, and manages OAuth session state. You have built GitHub Enterprise.",
        "nothing — you have built GitHub Enterprise"
      ),
      messages: [
        msg(
          "BFF Gateway serves the web client with domain-specific APIs."
        ),
        msg(
          "The BFF aggregates data from multiple GraphQL resolvers, handles SSR hydration, and manages OAuth session state. This is the final piece of GitHub Enterprise Cloud."
        ),
        msg(
          'Press ⌘K and search for "BFF Gateway" and press Enter to add it, then connect Web Client → BFF Gateway.'
        ),
      ],
      requiredNodes: ["bff_gateway"],
      requiredEdges: [edge("client_web", "bff_gateway")],
      successMessage: "BFF Gateway added. You have built GitHub Enterprise.",
      errorMessage: "Add a BFF Gateway connected from the Web Client.",
    }),
  ],
});

export const githubTutorial: Tutorial = tutorial({
  id: 'github-architecture',
  title: 'How to Design GitHub Architecture',
  description:
    'Build a code hosting platform for 100 million developers with 420 million repositories. Learn Git object storage, pull request workflows, CI/CD pipelines, code search, and webhook delivery at scale.',
  difficulty: 'Advanced',
  category: 'Developer Tools',
  isLive: false,
  icon: 'Github',
  color: '#333333',
  tags: ['Git Storage', 'CI/CD', 'Code Search', 'Webhooks'],
  estimatedTime: '~87 mins',
  levels: [l1, l2, l3],
});
