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
  title: 'Code Hosting Platform',
  subtitle: 'Build a code hosting platform in 12 steps',
  description:
    'Build a code hosting platform for 100 million developers with 420 million repositories. Learn Git object storage, pull request workflows, CI/CD pipelines, code search, and webhook delivery at scale.',
  estimatedTime: '~30 mins',
  unlocks: undefined,
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
        msg('Press ⌘K and search for "Web" to add the client to the canvas.'),
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
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
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
        msg('Press ⌘K, search for "Load Balancer", add it, then connect API Gateway → Load Balancer.'),
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
        msg('Press ⌘K, search for "Auth Service", add it, then connect Load Balancer → Auth Service.'),
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
        msg('Press ⌘K, search for "Microservice", add it, then connect Auth Service → Repository Service.'),
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
        msg('Press ⌘K, search for "Git Object Storage", add it, then connect Repository Service → Git Object Storage.'),
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
        msg('Press ⌘K, search for "Code Review Service", add it, then connect Repository Service → Code Review Service.'),
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
        msg('Press ⌘K, search for "CI Runner", add it, then connect Code Review Service → CI Runner.'),
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
        msg('Press ⌘K, search for "Webhook Dispatcher", add it, then connect Repository Service → Webhook Dispatcher.'),
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
        msg('Press ⌘K, search for "Search Engine", add it, then connect Repository Service → Search Service.'),
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
        msg('Press ⌘K, search for "NoSQL Database", add it, then connect Code Review Service → NoSQL Database.'),
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
        msg('Press ⌘K, search for "Object Storage", add it, then connect CI Runner → Object Storage.'),
      ],
      requiredNodes: ['object_storage'],
      requiredEdges: [edge('ci_runner', 'object_storage')],
      successMessage: 'Tutorial complete! You have built GitHub.',
      errorMessage: 'Add an Object Storage and connect it from the CI Runner.',
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
  estimatedTime: '~30 mins',
  levels: [l1],
});
