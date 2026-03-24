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
  title: 'Multi-Agent Orchestration',
  subtitle: 'Build an AI agent system in 11 steps',
  description:
    'Build a production AI agent system. Learn multi-agent orchestration, tool calling, memory systems, agent supervision, and LangGraph-style workflows that power autonomous AI systems like AutoGPT and CrewAI.',
  estimatedTime: '~30 mins',
  unlocks: undefined,
  contextMessage:
    "Let's build an AI Agent System from scratch. AI agents are LLMs that take actions — they plan, use tools, make decisions, and learn from feedback. This is the architecture behind AutoGPT, CrewAI, and Claude's tool use. Agents are the next frontier of AI applications.",
  steps: [
    step({
      id: 1,
      title: 'Start with the Client',
      explanation:
        "The client is a chat interface or API that sends a goal to the agent system. Unlike simple chatbots, the user gives the agent a task ('research competitors, draft a report, book travel') and the agent autonomously plans and executes steps.",
      action: buildFirstStepAction('Web'),
      why: "AI agent systems change the user interaction model. Instead of one question → one answer, the user gives a goal and the agent autonomously plans, executes, and reports back. The client must handle streaming updates as the agent works.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'AI Agent',
        'Chat Interface',
        'accept goal-oriented tasks from users and display streaming updates as the agent autonomously plans, executes, and reports',
        "AI agents change the interaction model: user gives a goal ('research our top 5 competitors'), agent autonomously plans steps, executes tools, and reports results. The client handles streaming progress updates as the agent works.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "AI agents change the interaction model: one goal → autonomous planning, tool use, and execution. The client handles streaming updates as the agent works through its plan. All the intelligence is in the agent system.",
        'API Gateway'
      ),
      messages: [
        msg("Welcome to the AI Agent System tutorial. AI agents are LLMs that take actions — plan, use tools, make decisions, and learn from feedback."),
        msg("The client sends a goal: 'research competitors and draft a report'. The agent autonomously plans steps, executes tools, and reports results. Unlike chatbots, the user sets a goal and the agent figures out how to achieve it."),
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
        "The API Gateway handles agent requests and streaming responses. It authenticates users, enforces rate limits (agent loops can consume thousands of tokens per minute), and routes to the agent orchestrator.",
      action: buildAction(
        'API Gateway',
        'Web',
        'API Gateway',
        'agent requests and streaming responses being authenticated and rate-limited, with token budgets preventing runaway agent loops'
      ),
      why: "AI agents consume tokens rapidly — a single agent loop can generate thousands of tokens. Without rate limiting and token budgets at the gateway, one runaway agent could consume your entire API budget in minutes.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'AI Agent',
        'API Gateway',
        'authenticate requests, enforce token budgets, and rate-limit agent loops to prevent runaway execution that could exhaust API quotas',
        "AI agents consume tokens rapidly. A single agent loop — plan, execute, evaluate, repeat — can generate thousands of tokens. The API Gateway enforces token budgets and rate limits to prevent runaway agents from burning through your entire API quota.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "The API Gateway enforces token budgets and rate limits on agent requests. Without these guardrails, a single runaway agent loop could consume your entire LLM API quota in minutes. This is the first line of defense in any agent system.",
        'Agent Orchestrator'
      ),
      messages: [
        msg("The API Gateway handles agent requests and streaming responses with token budgets and rate limits."),
        msg("AI agents consume tokens rapidly — a single agent loop (plan → execute → evaluate → repeat) can generate thousands of tokens. The API Gateway enforces token budgets: max 10,000 tokens per request. Rate limits prevent runaway agents from burning through your API quota."),
        msg("Press ⌘K and search for \"API Gateway\" and press Enter to add it, then connect Web → API Gateway."),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added. Now the agent orchestration layer.',
      errorMessage: 'Add an API Gateway and connect Web → API Gateway.',
    }),
    step({
      id: 3,
      title: 'Add Agent Orchestrator',
      explanation:
        "The Agent Orchestrator is the brain — it decomposes the user's goal into sub-tasks, assigns them to specialized agents, manages execution order, and handles the overall workflow state. This is the LangGraph or LangChain agent graph.",
      action: buildAction(
        'Agent Orchestrator',
        'API Gateway',
        'Agent Orchestrator',
        'user goals being decomposed into sub-tasks, assigned to specialized agents, with execution order managed and state tracked across the workflow'
      ),
      why: "The orchestrator is what separates multi-agent systems from single agents. Without orchestration, you have multiple agents but no coordination. The orchestrator manages the workflow graph — deciding which agent runs next based on outputs.",
      component: component('agent_orchestrator', 'Agent'),
      openingMessage: buildOpeningL1(
        'AI Agent',
        'Agent Orchestrator',
        'decompose goals into sub-tasks, assign them to specialized agents, and manage the workflow graph — the LangGraph-style execution engine',
        "The Agent Orchestrator is the brain. Given 'research competitors and draft a report', it decomposes: 1) search for competitors, 2) visit their websites, 3) extract data, 4) draft report. It assigns each step to the right agent and tracks state across the workflow.",
        'Agent'
      ),
      celebrationMessage: buildCelebration(
        'Agent Orchestrator',
        'API Gateway',
        "The Agent Orchestrator decomposes goals into sub-tasks and assigns them to specialized agents. Think of it as the LangGraph execution engine: it manages the workflow graph, tracks state, and decides which agent runs next based on outputs. This is the brain of any multi-agent system.",
        'Agent Planner'
      ),
      messages: [
        msg("The Agent Orchestrator decomposes goals and manages the multi-agent workflow."),
        msg("Given a goal like 'research competitors and draft a report', the orchestrator decomposes: 1) identify competitor names, 2) search for their websites, 3) extract key data, 4) draft report. It assigns each step to the right agent and manages execution order. This is the LangGraph-style execution engine."),
        msg("Press ⌘K and search for \"Agent Orchestrator\" and press Enter to add it, then connect API Gateway → Agent Orchestrator."),
      ],
      requiredNodes: ['agent_orchestrator'],
      requiredEdges: [edge('api_gateway', 'agent_orchestrator')],
      successMessage: 'Agent Orchestrator added. Now the planning layer.',
      errorMessage: 'Add an Agent Orchestrator and connect API Gateway → Agent Orchestrator.',
    }),
    step({
      id: 4,
      title: 'Add Agent Planner',
      explanation:
        "The Agent Planner generates the execution plan — breaking the user's goal into a sequence of steps. It decides: what sub-tasks are needed, in what order, with what tools. This is the 'thinking before acting' phase.",
      action: buildAction(
        'Agent Planner',
        'Agent Orchestrator',
        'Agent Planner',
        'user goals being decomposed into structured execution plans: sub-tasks, sequence, required tools, and expected outputs'
      ),
      why: "Planning before acting is what separates smart agents from dumb ones. A planner prevents the agent from blindly trying actions — it thinks through the goal, decomposes it into steps, and identifies which tools each step needs.",
      component: component('agent_planner', 'Agent'),
      openingMessage: buildOpeningL1(
        'AI Agent',
        'Agent Planner',
        'decompose goals into structured execution plans: what sub-tasks to run, in what order, with what tools',
        "Planning before acting prevents blind trial-and-error. The Agent Planner thinks: 'What do I need to know? What tools do I need? In what order?' It outputs a structured plan before any tools are called. ReAct (Reasoning + Acting) and chain-of-thought are common planning patterns.",
        'Agent'
      ),
      celebrationMessage: buildCelebration(
        'Agent Planner',
        'Agent Orchestrator',
        "The Agent Planner decomposes goals into structured plans: sub-tasks, sequence, tools. ReAct (Reasoning + Acting) and chain-of-thought are common patterns. Without planning, agents blindly try actions. With planning, agents think before they act.",
        'Tool Registry'
      ),
      messages: [
        msg("The Agent Planner decomposes goals into structured execution plans before any tools are called."),
        msg("Planning before acting is what separates smart agents from dumb ones. The planner thinks: 'What do I need to know? What tools do I need? In what order?' It outputs a structured plan. ReAct (Reasoning + Acting) and chain-of-thought are common planning patterns used by GPT-4 and Claude."),
        msg("Press ⌘K and search for \"Agent Planner\" and press Enter to add it, then connect Agent Orchestrator → Agent Planner."),
      ],
      requiredNodes: ['agent_planner'],
      requiredEdges: [edge('agent_orchestrator', 'agent_planner')],
      successMessage: 'Agent Planner added. Now the tool registry.',
      errorMessage: 'Add an Agent Planner and connect Agent Orchestrator → Agent Planner.',
    }),
    step({
      id: 5,
      title: 'Add Tool Registry',
      explanation:
        "The Tool Registry is a catalog of available tools the agent can call — web search, calculator, code execution, database queries, API calls. Each tool has a name, description, input schema, and endpoint.",
      action: buildAction(
        'Tool Registry',
        'Agent Planner',
        'Tool Registry',
        'available tools being cataloged with name, description, input schema, and execution endpoint — enabling agents to discover and call the right tools'
      ),
      why: "Agents are only as capable as their tools. The Tool Registry is the agent's 'app store' — it makes tools discoverable so the planner can select the right ones. Without a registry, agents can't systematically choose tools.",
      component: component('tool_registry', 'Tool'),
      openingMessage: buildOpeningL1(
        'AI Agent',
        'Tool Registry',
        'catalog available tools with name, description, and input schema so agents can discover and call the right tools for each sub-task',
        "Agents are only as capable as their tools. The Tool Registry is the agent's 'app store': web search, calculator, code execution, database queries, API calls. Each tool has a schema that describes what it does and what inputs it needs — enabling the planner to select the right tool for each task.",
        'Tool'
      ),
      celebrationMessage: buildCelebration(
        'Tool Registry',
        'Agent Planner',
        "The Tool Registry is the agent's 'app store'. Web search, calculator, code execution, database queries — each with a schema describing inputs and outputs. The planner selects tools based on their descriptions. Without a registry, agents can't systematically discover and use tools.",
        'Agent Executor'
      ),
      messages: [
        msg("The Tool Registry catalogs available tools — the agent's capabilities."),
        msg("Agents are only as capable as their tools. The Tool Registry lists: web search, calculator, code execution, database queries, API calls. Each tool has a name, description, and input schema. The planner selects tools based on their descriptions. This is the agent's capability surface."),
        msg("Press ⌘K and search for \"Tool Registry\" and press Enter to add it, then connect Agent Planner → Tool Registry."),
      ],
      requiredNodes: ['tool_registry'],
      requiredEdges: [edge('agent_planner', 'tool_registry')],
      successMessage: 'Tool Registry added. Now the executor.',
      errorMessage: 'Add a Tool Registry and connect Agent Planner → Tool Registry.',
    }),
    step({
      id: 6,
      title: 'Add Agent Executor',
      explanation:
        "The Agent Executor runs individual tasks assigned by the planner — calls tools, handles responses, and reports results back to the orchestrator. It handles tool execution errors and retry logic.",
      action: buildAction(
        'Agent Executor',
        'Agent Orchestrator',
        'Agent Executor',
        'individual tasks being executed: calling tools, handling responses, retrying on failure, and reporting results back to the orchestrator'
      ),
      why: "The executor is the runtime — it does the actual work. Given a task ('search for competitor X'), it calls the search tool, parses the response, and formats it for the orchestrator. Without execution, planning is useless.",
      component: component('agent_executor', 'Agent'),
      openingMessage: buildOpeningL1(
        'AI Agent',
        'Agent Executor',
        'execute individual tasks by calling tools, handling errors with retry logic, and formatting results back to the orchestrator',
        "The executor is the runtime: given 'search for competitor X', it calls the search tool, handles timeouts and errors with retry logic, parses the response, and formats it for the orchestrator. Without execution, planning is just wishful thinking.",
        'Agent'
      ),
      celebrationMessage: buildCelebration(
        'Agent Executor',
        'Agent Orchestrator',
        "The Agent Executor runs tasks: calls tools, handles timeouts with retry logic, parses responses. Tool execution is where agentic AI meets the real world — web searches, API calls, database queries. Without execution, planning is useless.",
        'Agent Memory'
      ),
      messages: [
        msg("The Agent Executor runs individual tasks — calling tools and handling responses."),
        msg("Given a task ('search for competitor X'), the executor calls the search tool with retry logic. It parses the response, handles errors (timeout, rate limit, invalid input), and formats results for the orchestrator. Without execution, planning is just wishful thinking."),
        msg("Press ⌘K and search for \"Agent Orchestrator\" and press Enter to add another one for the Agent Executor, then connect Agent Orchestrator → Agent Executor."),
      ],
      requiredNodes: ['agent_executor'],
      requiredEdges: [edge('agent_orchestrator', 'agent_executor')],
      successMessage: 'Agent Executor added. Now the memory layer.',
      errorMessage: 'Add a second Agent Orchestrator as the Agent Executor and connect Agent Orchestrator → Agent Executor.',
    }),
    step({
      id: 7,
      title: 'Add Agent Memory',
      explanation:
        "Agent Memory stores conversation history, tool call results, and learned facts across agent sessions. Without memory, every task starts from scratch. With memory, agents learn from past interactions.",
      action: buildAction(
        'Agent Memory',
        'Agent Orchestrator',
        'Agent Memory',
        'conversation history, tool call results, and learned facts being persisted across sessions for context-aware agentic behavior'
      ),
      why: "Memory is what turns a stateless agent into a persistent one. Without memory, an agent can't remember what it learned in previous tasks. With memory, an agent working on 'monthly reports' can reference last month's report it already generated.",
      component: component('agent_memory', 'Memory'),
      openingMessage: buildOpeningL1(
        'AI Agent',
        'Agent Memory',
        'persist conversation history, tool results, and learned facts across sessions — enabling context-aware, persistent agentic behavior',
        "Memory is what turns stateless agents into persistent ones. Without memory: every task starts fresh, no context from previous sessions. With memory: an agent working on 'monthly reports' references last month's report. This is how agents build knowledge over time.",
        'Memory'
      ),
      celebrationMessage: buildCelebration(
        'Agent Memory',
        'Agent Orchestrator',
        "Agent Memory stores conversation history and tool results across sessions. Without it, every task starts from scratch. With it, agents learn from past interactions — referencing previous work, building on prior research. This is what makes agents feel intelligent and context-aware.",
        'Agent Supervisor'
      ),
      messages: [
        msg("Agent Memory stores conversation history and tool results across sessions."),
        msg("Without memory: every task starts from scratch, no context from previous sessions. With memory: an agent working on 'monthly reports' references last month's report. Memory includes: conversation history, tool call results, and a learned-facts store (key-value knowledge the agent has accumulated)."),
        msg("Press ⌘K and search for \"Agent Memory\" and press Enter to add it, then connect Agent Orchestrator → Agent Memory."),
      ],
      requiredNodes: ['agent_memory'],
      requiredEdges: [edge('agent_orchestrator', 'agent_memory')],
      successMessage: 'Agent Memory added. Now the supervisor.',
      errorMessage: 'Add an Agent Memory component and connect Agent Orchestrator → Agent Memory.',
    }),
    step({
      id: 8,
      title: 'Add Agent Supervisor',
      explanation:
        "The Agent Supervisor monitors the agent's execution — evaluating results, detecting failures, deciding whether to retry or escalate. It implements guardrails that prevent the agent from taking harmful or incorrect actions.",
      action: buildAction(
        'Agent Supervisor',
        'Agent Executor',
        'Agent Supervisor',
        'agent execution being monitored: results evaluated, failures detected, retry or escalation decisions made with guardrails preventing harmful actions'
      ),
      why: "Supervision is what makes agents safe and reliable. Without it, a flawed plan or bad tool call goes uncorrected. The supervisor evaluates: did the tool work? Is the output valid? Should we retry or escalate to the user?",
      component: component('agent_supervisor', 'Supervisor'),
      openingMessage: buildOpeningL1(
        'AI Agent',
        'Agent Supervisor',
        'evaluate tool execution results, detect failures, decide retry or escalation, and enforce guardrails that prevent harmful actions',
        "Supervision makes agents safe and reliable. The supervisor evaluates: did the tool work? Is the output valid? Should we retry or escalate to the user? Guardrails prevent harmful actions — the supervisor can halt execution if the agent tries something dangerous.",
        'Supervisor'
      ),
      celebrationMessage: buildCelebration(
        'Agent Supervisor',
        'Agent Executor',
        "The Agent Supervisor evaluates results and enforces guardrails. Did the tool work? Is the output valid? Should we retry or escalate? Without supervision, bad tool calls go uncorrected. With supervision, the agent can self-correct or escalate to the user.",
        'LLM API'
      ),
      messages: [
        msg("The Agent Supervisor monitors execution and enforces safety guardrails."),
        msg("Supervision makes agents safe and reliable. The supervisor evaluates tool results: did the search return useful data? Should we retry with different parameters? Should we escalate to the user? Guardrails prevent harmful actions — the supervisor can halt execution if the agent tries something dangerous."),
        msg("Press ⌘K and search for \"Agent Supervisor\" and press Enter to add it, then connect Agent Executor → Agent Supervisor."),
      ],
      requiredNodes: ['agent_supervisor'],
      requiredEdges: [edge('agent_executor', 'agent_supervisor')],
      successMessage: 'Agent Supervisor added. Now the LLM layer.',
      errorMessage: 'Add an Agent Supervisor and connect Agent Executor → Agent Supervisor.',
    }),
    step({
      id: 9,
      title: 'Add LLM Gateway',
      explanation:
        "The LLM Gateway routes requests to the right LLM (GPT-4, Claude, Gemini) based on task type, cost, and latency requirements. Different agents within the system may use different models for different tasks.",
      action: buildAction(
        'LLM Gateway',
        'Agent Orchestrator',
        'LLM Gateway',
        'requests being routed to the optimal LLM (GPT-4, Claude, Gemini) based on task type, cost budget, and latency requirements'
      ),
      why: "Different LLMs excel at different tasks. GPT-4 is best for reasoning, Claude for long documents, Gemini for multimodal. The LLM Gateway routes intelligently: fast tasks to cheap models, complex reasoning to GPT-4, saving 60%+ on costs.",
      component: component('llm_gateway', 'LLM'),
      openingMessage: buildOpeningL1(
        'AI Agent',
        'LLM Gateway',
        'route requests to the optimal LLM based on task complexity, cost budget, and latency requirements — using different models for different sub-tasks',
        "Different LLMs excel at different tasks: GPT-4 for complex reasoning, Claude for long document analysis, Gemini for multimodal. The LLM Gateway routes intelligently: simple classification to fast cheap models, complex planning to GPT-4. This saves 60%+ on LLM costs.",
        'LLM Gateway'
      ),
      celebrationMessage: buildCelebration(
        'LLM Gateway',
        'Agent Orchestrator',
        "The LLM Gateway routes to the optimal model: simple tasks to fast cheap models, complex reasoning to GPT-4. Different agents within the system can use different models. Intelligent routing saves 60%+ on LLM API costs.",
        'Metrics Collector'
      ),
      messages: [
        msg("The LLM Gateway routes requests to the optimal LLM based on task complexity."),
        msg("Different LLMs excel at different tasks: GPT-4 for complex reasoning, Claude for long documents, Gemini for multimodal. The LLM Gateway routes intelligently. Simple classification → fast cheap models. Complex planning → GPT-4. This saves 60%+ on LLM costs."),
        msg("Press ⌘K and search for \"LLM API\" and press Enter to add it for the LLM Gateway, then connect Agent Orchestrator → LLM Gateway."),
      ],
      requiredNodes: ['llm_api'],
      requiredEdges: [edge('agent_orchestrator', 'llm_api')],
      successMessage: 'LLM Gateway added. Now observability.',
      errorMessage: 'Add an LLM API for the LLM Gateway and connect Agent Orchestrator → LLM Gateway.',
    }),
    step({
      id: 10,
      title: 'Add Metrics Collector',
      explanation:
        "Agent systems need specialized observability — tracking token usage per agent, tool call success rates, planning accuracy, and task completion rates. Standard LLM monitoring misses agent-specific metrics.",
      action: buildAction(
        'Metrics Collector',
        'Agent Orchestrator',
        'Metrics Collector',
        'token usage per agent, tool call success rates, planning accuracy, and task completion rates being tracked for agent-specific observability'
      ),
      why: "Standard LLM metrics (tokens, latency) miss what matters for agents: which tools fail most? How often does planning need retries? What's the task completion rate? Agent-specific metrics are essential for debugging and improving agentic systems.",
      component: component('metrics_collector', 'Metrics'),
      openingMessage: buildOpeningL1(
        'AI Agent',
        'Metrics Collector',
        'track agent-specific metrics: token usage per agent, tool call success rates, planning accuracy, and task completion rates',
        "Standard LLM metrics (tokens, latency) miss what matters for agents: which tools fail most? How often does planning need retries? What's the task completion rate? Agent-specific observability is essential for debugging agentic systems and improving their reliability.",
        'Metrics'
      ),
      celebrationMessage: buildCelebration(
        'Metrics Collector',
        'Agent Orchestrator',
        "Agent systems need specialized observability. Standard LLM monitoring misses: which tools fail most, planning retry rates, task completion. Metrics track: token budget consumption per agent, tool success/failure rates, and task-level completion. This is what makes agents production-ready.",
        'Logger'
      ),
      messages: [
        msg("Agent systems need specialized observability — tracking tool call success rates, planning accuracy, and task completion."),
        msg("Standard LLM metrics (tokens, latency) miss what matters for agents: which tools fail most? How often does planning need retries? What's the task completion rate? The Metrics Collector tracks: token budget consumption, tool call success/failure rates, planning accuracy, and task-level completion."),
        msg("Press ⌘K and search for \"Metrics Collector\" and press Enter to add it, then connect Agent Orchestrator → Metrics Collector."),
      ],
      requiredNodes: ['metrics_collector'],
      requiredEdges: [edge('agent_orchestrator', 'metrics_collector')],
      successMessage: 'Metrics Collector added. Now the logger.',
      errorMessage: 'Add a Metrics Collector and connect Agent Orchestrator → Metrics Collector.',
    }),
    step({
      id: 11,
      title: 'Add Logger',
      explanation:
        "Every agent action — plan, tool call, result, decision — is logged for auditing and debugging. Agent systems are complex and opaque. Detailed logs are essential for understanding why the agent made a particular decision.",
      action: buildAction(
        'Logger',
        'Agent Orchestrator',
        'Logger',
        'every agent action being captured: plans, tool calls, results, decisions, and failures — for full auditing and debugging traceability'
      ),
      why: "Agent systems are notoriously hard to debug — the LLM's reasoning is opaque. Every tool call, every decision, every failure must be logged in detail. When the agent does something unexpected, logs are your only way to understand why.",
      component: component('logger', 'Logger'),
      openingMessage: buildOpeningL1(
        'AI Agent',
        'Logger',
        'capture every agent action — plans, tool calls, results, decisions, failures — for full auditing and debugging traceability',
        "Agent systems are notoriously hard to debug. When the agent does something unexpected, logs are your only way to understand why. Every plan, tool call, result, decision, and failure must be logged in detail. This is what makes agentic AI auditable and debuggable.",
        'Logger'
      ),
      celebrationMessage: buildCelebration(
        'Logger',
        'Agent Orchestrator',
        "Every agent action is logged: plans, tool calls, results, decisions, failures. When an agent does something unexpected, detailed logs are your only way to understand why. This is what makes AI agents auditable, debuggable, and production-ready. You have built an AI Agent System.",
        'nothing — you have built an AI Agent System'
      ),
      messages: [
        msg("Final step — observability. Every agent action is logged for auditing and debugging."),
        msg("Agent systems are notoriously hard to debug. When the agent does something unexpected, logs are your only way to understand why. Every plan, tool call, result, decision, and failure is logged in detail. This is what makes AI agents auditable, debuggable, and production-ready."),
        msg("Press ⌘K and search for \"Logger\" and press Enter to add it, then connect Agent Orchestrator → Logger."),
      ],
      requiredNodes: ['logger'],
      requiredEdges: [edge('agent_orchestrator', 'logger')],
      successMessage: 'Logger added. You have built an AI Agent System.',
      errorMessage: 'Add a Logger and connect Agent Orchestrator → Logger.',
    }),
  ],
});

const l2 = level({
  level: 2,
  title: "AI Agent at Scale",
  subtitle: "Stream agent executions with memory and tool observability",
  description:
    "Add Kafka event streaming, Redis memory caching, CDC pipelines, and SLO tracking to the AI agent architecture. Handle thousands of concurrent agents with full reasoning trace observability.",
  estimatedTime: "~28 mins",
  unlocks: undefined,
  contextMessage:
    "Let's scale the AI Agent system. Thousands of concurrent agents, millions of tool calls, and full reasoning trace observability. This requires Kafka for execution streaming, Redis for session state, and reasoning-grade observability.",
  steps: [
    step({
      id: 1,
      title: "Add Kafka Streaming",
      explanation:
        "AI Agent's Event Bus streams agent execution events, tool call results, and memory updates. Every agent action generates an event that streams to the observability and memory systems.",
      action: buildAction(
        "Kafka / Streaming",
        "Agent Orchestrator",
        "Kafka Streaming",
        "agent execution events, tool call results, and memory updates being streamed to observability and memory systems"
      ),
      why: "Without event streaming, every agent action would require synchronous calls to observability and memory systems — slowing down execution. Kafka decouples agents from their dependencies.",
      component: component("kafka_streaming", "Kafka / Streaming", "Kafka / Streaming"),
      openingMessage: buildOpeningL2(
        "AI Agent",
        "Kafka",
        "stream agent execution events, tool call results, and memory updates to observability and memory systems",
        "Without Kafka, agent actions require synchronous calls to every downstream system.",
        "Kafka / Streaming"
      ),
      celebrationMessage: buildCelebration(
        "Kafka Streaming",
        "Agent Orchestrator",
        "Kafka streams every agent action event to observability and memory consumers. Tool call results, planning decisions, memory retrievals — all flow through the event bus without slowing agent execution.",
        "Notification Worker"
      ),
      messages: [
        msg("Let's scale the AI Agent system. Thousands of concurrent agents, millions of tool calls — this requires Kafka for execution streaming."),
        msg("Every agent action generates an event: tool called, result received, decision made. Kafka streams these events to the observability platform and memory system in real time."),
        msg("Press ⌘K and search for \"Kafka / Streaming\" and press Enter to add it, then connect Agent Orchestrator → Kafka Streaming."),
      ],
      requiredNodes: ["kafka_streaming"],
      requiredEdges: [edge("agent_orchestrator", "kafka_streaming")],
      successMessage: "Kafka added. Now notifications.",
      errorMessage: "Add Kafka Streaming connected from the Agent Orchestrator.",
    }),
    step({
      id: 2,
      title: "Add Notification Worker",
      explanation:
        "AI Agent's Notification Worker sends alerts when long-running agents complete, when human-in-the-loop approval is needed, or when agents encounter errors requiring intervention.",
      action: buildAction(
        "Worker",
        "Kafka",
        "Notification Worker",
        "alerts being sent when agents complete, approval is needed, or errors require human intervention"
      ),
      why: "Agents can run for hours. Without notification workers, users would have to poll for completion. Workers send alerts when agents need attention.",
      component: component("worker_job", "Worker"),
      openingMessage: buildOpeningL2(
        "AI Agent",
        "Notification Worker",
        "send alerts when agents complete, human approval is needed, or errors require intervention",
        "Agents can run for hours — notification workers alert users when intervention is needed.",
        "Worker"
      ),
      celebrationMessage: buildCelebration(
        "Notification Worker",
        "Kafka Streaming",
        "Notification workers consume Kafka events to alert users: long-running agents completed, human-in-the-loop approval is needed, or agents encountered errors requiring intervention.",
        "In-Memory Cache"
      ),
      messages: [
        msg("Long-running agents need notification workers to alert users when action is required."),
        msg("Workers consume Kafka events to send notifications: agent completed, approval needed, or error encountered. This prevents users from having to poll for agent status."),
        msg("Press ⌘K and search for \"Worker / Background Job\" and press Enter to add it, then connect Kafka Streaming → Notification Worker."),
      ],
      requiredNodes: ["worker_job"],
      requiredEdges: [edge("kafka_streaming", "worker_job")],
      successMessage: "Notification worker added. Now memory caching.",
      errorMessage: "Add a Worker connected from Kafka Streaming.",
    }),
    step({
      id: 3,
      title: "Add In-Memory Cache",
      explanation:
        "AI Agent's Redis Cache stores agent session state, tool outputs, and conversation history. Long-running agents maintain state across thousands of tool calls — cached in Redis for sub-millisecond retrieval.",
      action: buildAction(
        "In-Memory Cache",
        "Agent Orchestrator",
        "In-Memory Cache",
        "agent session state, tool outputs, and conversation history being cached for sub-millisecond retrieval"
      ),
      why: "Without Redis, agent session state would require database queries on every tool call. Redis caches session state — agents can retrieve context across thousands of tool calls without slowing down.",
      component: component("in_memory_cache", "In-Memory Cache"),
      openingMessage: buildOpeningL2(
        "AI Agent",
        "Redis (In-Memory Cache)",
        "cache agent session state, tool outputs, and conversation history for sub-millisecond retrieval",
        "Without Redis, every tool call would query the database for session state — Redis keeps agents fast.",
        "In-Memory Cache"
      ),
      celebrationMessage: buildCelebration(
        "In-Memory Cache",
        "Agent Orchestrator",
        "Redis caches agent session state across thousands of tool calls. Tool outputs, conversation history, and planning context are retrieved in under 1ms — keeping long-running agents responsive.",
        "CDC Connector"
      ),
      messages: [
        msg("Long-running agents maintain state across thousands of tool calls — Redis caches this session state."),
        msg("Without Redis, every tool call would query the database for context. Redis stores session state, tool outputs, and conversation history for sub-millisecond retrieval."),
        msg("Press ⌘K and search for \"In-Memory Cache\" and press Enter to add it, then connect Agent Orchestrator → In-Memory Cache."),
      ],
      requiredNodes: ["in_memory_cache"],
      requiredEdges: [edge("agent_orchestrator", "in_memory_cache")],
      successMessage: "Cache added. Now CDC pipeline.",
      errorMessage: "Add an In-Memory Cache connected from the Agent Orchestrator.",
    }),
    step({
      id: 4,
      title: "Add CDC Connector",
      explanation:
        "AI Agent's CDC Connector mirrors agent execution data to the analytics platform. Tool usage patterns, agent success rates, and memory retrieval effectiveness stream to the data warehouse.",
      action: buildAction(
        "CDC Connector",
        "Agent Memory",
        "CDC Connector",
        "agent execution data being mirrored to the analytics platform for tool usage patterns and success rate analysis"
      ),
      why: "CDC (Change Data Capture) streams database changes to the analytics platform without impacting agent performance. Tool usage patterns, success rates, and memory effectiveness are analyzed without slowing the agent path.",
      component: component("cdc_connector", "CDC Connector"),
      openingMessage: buildOpeningL2(
        "AI Agent",
        "CDC Connector",
        "mirror agent execution data to the analytics platform for tool usage and success rate analysis",
        "CDC streams database changes to analytics without impacting agent performance.",
        "CDC Connector"
      ),
      celebrationMessage: buildCelebration(
        "CDC Connector",
        "Agent Memory",
        "CDC Connector mirrors agent execution data to the analytics platform. Tool usage patterns, agent success rates, and memory retrieval effectiveness stream to the data warehouse for analysis.",
        "SQL Database"
      ),
      messages: [
        msg("CDC Connector mirrors agent execution data to the analytics platform for tool usage and success rate analysis."),
        msg("Change Data Capture streams database changes to analytics without impacting agent performance. Tool patterns, success rates, and memory effectiveness are analyzed in the data warehouse."),
        msg("Press ⌘K and search for \"CDC Connector\" and press Enter to add it, then connect Agent Memory → CDC Connector."),
      ],
      requiredNodes: ["cdc_connector"],
      requiredEdges: [edge("agent_memory", "cdc_connector")],
      successMessage: "CDC added. Now SQL database.",
      errorMessage: "Add a CDC Connector connected from the Agent Memory.",
    }),
    step({
      id: 5,
      title: "Add SQL Database",
      explanation:
        "AI Agent's PostgreSQL stores user accounts, agent definitions, tool configurations, and execution logs. Agent definitions include tool permissions and resource limits — stored in PostgreSQL with fine-grained access control.",
      action: buildAction(
        "SQL Database",
        "API Gateway",
        "SQL Database",
        "user accounts, agent definitions, tool configurations, and execution logs being stored with fine-grained access control"
      ),
      why: "Agent definitions and tool permissions require ACID transactions. PostgreSQL stores user accounts, agent configurations, and execution logs with the consistency required for access control.",
      component: component("sql_db", "SQL Database"),
      openingMessage: buildOpeningL2(
        "AI Agent",
        "SQL Database",
        "store user accounts, agent definitions, tool permissions, and execution logs with ACID guarantees",
        "Agent definitions and tool permissions require ACID transactions — PostgreSQL handles access control.",
        "SQL Database"
      ),
      celebrationMessage: buildCelebration(
        "SQL Database",
        "API Gateway",
        "PostgreSQL stores user accounts, agent definitions, tool configurations, and execution logs. Agent definitions include tool permissions and resource limits — stored with fine-grained access control.",
        "Structured Logger"
      ),
      messages: [
        msg("User accounts, agent definitions, and tool configurations require ACID compliance. PostgreSQL stores these with fine-grained access control."),
        msg("Agent definitions include tool permissions and resource limits — these must be consistent and auditable. PostgreSQL handles the access control that keeps agents secure."),
        msg("Press ⌘K and search for \"SQL Database\" and press Enter to add it, then connect API Gateway → SQL Database."),
      ],
      requiredNodes: ["sql_db"],
      requiredEdges: [edge("api_gateway", "sql_db")],
      successMessage: "SQL added. Now structured logging.",
      errorMessage: "Add a SQL Database connected from the API Gateway.",
    }),
    step({
      id: 6,
      title: "Add Structured Logger",
      explanation:
        "AI Agent's Structured Logger captures agent reasoning chains, tool call inputs/outputs, and decision points. Logs flow to the observability platform — agent debugging requires full reasoning trace logging.",
      action: buildAction(
        "Structured Logger",
        "Agent Orchestrator",
        "Structured Logger",
        "agent reasoning chains, tool call inputs/outputs, and decision points being captured for full observability"
      ),
      why: "Agent systems are notoriously hard to debug. Every reasoning step, tool call, and decision must be logged. Structured JSON logs enable fast aggregation and debugging of agent failures.",
      component: component("structured_logger", "Structured Logger"),
      openingMessage: buildOpeningL2(
        "AI Agent",
        "Structured Logger",
        "capture agent reasoning chains, tool call inputs/outputs, and decision points for full observability",
        "Agent debugging requires full reasoning trace logging — structured logs enable fast debugging.",
        "Structured Logger"
      ),
      celebrationMessage: buildCelebration(
        "Structured Logger",
        "Agent Orchestrator",
        "Structured Logger captures every reasoning step, tool call, and decision. Logs flow to the observability platform — agent debugging requires full reasoning trace logging.",
        "SLO Tracker"
      ),
      messages: [
        msg("Structured Logger captures agent reasoning chains, tool call inputs/outputs, and decision points for debugging."),
        msg("Agent systems are notoriously hard to debug. Every reasoning step, tool call, and decision must be logged. Structured JSON logs enable fast aggregation and debugging of agent failures."),
        msg("Press ⌘K and search for \"Structured Logger\" and press Enter to add it, then connect Agent Orchestrator → Structured Logger."),
      ],
      requiredNodes: ["structured_logger"],
      requiredEdges: [edge("agent_orchestrator", "structured_logger")],
      successMessage: "Structured logging added. Now SLO tracking.",
      errorMessage: "Add a Structured Logger connected from the Agent Orchestrator.",
    }),
    step({
      id: 7,
      title: "Add SLO Tracker",
      explanation:
        "AI Agent's SLO Tracker monitors agent execution time, tool call success rate, and memory retrieval quality. Long-running agents must complete within timeout — tracked as a critical SLO.",
      action: buildAction(
        "SLO/SLI Tracker",
        "Metrics Collector",
        "SLO Tracker",
        "agent execution time, tool call success rate, and memory retrieval quality being tracked against defined SLOs"
      ),
      why: "Without SLOs, engineering teams can't measure agent reliability. SLO tracking monitors tool call success rates and memory retrieval quality — alerting when agents fall below acceptable thresholds.",
      component: component("slo_tracker", "SLO/SLI Tracker"),
      openingMessage: buildOpeningL2(
        "AI Agent",
        "SLO Tracker",
        "monitor agent execution time, tool call success rate, and memory retrieval quality against defined SLOs",
        "Without SLOs, engineering teams can't measure agent reliability.",
        "SLO/SLI Tracker"
      ),
      celebrationMessage: buildCelebration(
        "SLO Tracker",
        "Metrics Collector",
        "SLO Tracker monitors agent execution time, tool call success rate, and memory retrieval quality. Long-running agents must complete within timeout — tracked as a critical SLO.",
        "Error Budget Alert"
      ),
      messages: [
        msg("SLO Tracker monitors agent execution time, tool call success rate, and memory retrieval quality against defined SLOs."),
        msg("Long-running agents must complete within timeout — tracked as a critical SLO. When tool call success rates fall or memory retrieval degrades, the SLO tracker alerts the team."),
        msg("Press ⌘K and search for \"SLO/SLI Tracker\" and press Enter to add it, then connect Metrics Collector → SLO Tracker."),
      ],
      requiredNodes: ["slo_tracker"],
      requiredEdges: [edge("metrics_collector", "slo_tracker")],
      successMessage: "SLO tracking added. Now error budgets.",
      errorMessage: "Add an SLO/SLI Tracker connected from the Metrics Collector.",
    }),
    step({
      id: 8,
      title: "Add Error Budget Alert",
      explanation:
        "AI Agent's Error Budget Monitor tracks tool call success rate SLO. When a tool API degrades, the error budget alerts the team to switch to fallback tools before agents start failing.",
      action: buildAction(
        "Error Budget Monitor",
        "SLO/SLI Tracker",
        "Error Budget Alert",
        "tool call success rate SLO being tracked with alerts when error budget burns from tool API degradation"
      ),
      why: "The error budget quantifies how much unreliability is acceptable. When a tool API degrades and starts failing, the error budget alerts the team to switch to fallback tools before agents fail.",
      component: component("error_budget_alert", "Error Budget Monitor"),
      openingMessage: buildOpeningL2(
        "AI Agent",
        "Error Budget Monitor",
        "track tool call success rate SLO and alert when error budget burns from tool API degradation",
        "Error budgets quantify acceptable unreliability — alerting teams before agents start failing.",
        "Error Budget Monitor"
      ),
      celebrationMessage: buildCelebration(
        "Error Budget Monitor",
        "SLO Tracker",
        "Error Budget Monitor tracks tool call success rate SLO. When a tool API degrades, the error budget alerts the team to switch to fallback tools before agents start failing.",
        "Level 3"
      ),
      messages: [
        msg("Error Budget Monitor tracks tool call success rate SLO. When error budget burns from tool API degradation, the team gets alerted to switch to fallback tools."),
        msg("The error budget quantifies acceptable unreliability. When a tool API degrades, alerts prompt the team to switch to fallback tools before agents start failing."),
        msg("Press ⌘K and search for \"Error Budget Monitor\" and press Enter to add it, then connect SLO Tracker → Error Budget Alert."),
      ],
      requiredNodes: ["error_budget_alert"],
      requiredEdges: [edge("slo_tracker", "error_budget_alert")],
      successMessage: "Error budget monitoring added. AI Agent at Scale is complete.",
      errorMessage: "Add an Error Budget Monitor connected from the SLO Tracker.",
    }),
  ],
});

const l3 = level({
  level: 3,
  title: "AI Agent Enterprise",
  subtitle: "Add zero-trust tool execution, reasoning tracing, and saga orchestration",
  description:
    "Implement zero-trust networking for tool execution, distributed tracing for agent reasoning, and saga orchestration for multi-step workflows. AI Agent Enterprise serves enterprises with audit and safety requirements.",
  estimatedTime: "~29 mins",
  unlocks: undefined,
  contextMessage:
    "Let's make AI Agent enterprise-grade. Zero-trust tool execution, reasoning trace tracing, and saga-based workflow orchestration. AI Agent Enterprise serves enterprises with safety, audit, and compliance requirements that drive every architectural decision.",
  steps: [
    step({
      id: 1,
      title: "Add Service Mesh",
      explanation:
        "AI Agent's Service Mesh (Envoy) handles mTLS between agent orchestrators, tool services, and memory stores. Agents execute external tools — zero-trust networking ensures tool outputs are authenticated and not tampered with.",
      action: buildAction(
        "Service Mesh (Istio)",
        "API Gateway",
        "Service Mesh",
        "mTLS being enforced between agent orchestrators, tool services, and memory stores for zero-trust tool execution"
      ),
      why: "Agents execute external tools — tool outputs must be authenticated and not tampered with. Service mesh provides zero-trust networking: every service-to-service call is encrypted and verified.",
      component: component("service_mesh", "Service Mesh (Istio)"),
      openingMessage: buildOpeningL3(
        "AI Agent",
        "Service Mesh (Envoy)",
        "enforce mTLS between agent orchestrators, tool services, and memory stores for zero-trust networking",
        "Agents execute external tools — zero-trust networking ensures tool outputs are authenticated.",
        "Service Mesh (Istio)"
      ),
      celebrationMessage: buildCelebration(
        "Service Mesh",
        "API Gateway",
        "Service mesh handles mTLS between agent orchestrators, tool services, and memory stores. Zero-trust networking ensures tool outputs are authenticated and not tampered with.",
        "BFF Gateway"
      ),
      messages: [
        msg("Let's make AI Agent enterprise-grade. Zero-trust tool execution requires a service mesh for mTLS between all services."),
        msg("Agents execute external tools — tool outputs must be authenticated and not tampered with. Service mesh provides zero-trust networking: every service-to-service call is encrypted and verified."),
        msg("Press ⌘K and search for \"Service Mesh (Istio)\" and press Enter to add it, then connect API Gateway → Service Mesh."),
      ],
      requiredNodes: ["service_mesh"],
      requiredEdges: [edge("api_gateway", "service_mesh")],
      successMessage: "Service mesh added. Now BFF gateway.",
      errorMessage: "Add a Service Mesh connected from the API Gateway.",
    }),
    step({
      id: 2,
      title: "Add BFF Gateway",
      explanation:
        "AI Agent's BFF Gateway serves the client with agent management APIs. The BFF handles agent deployment, streaming responses, and human-in-the-loop approval flows for sensitive operations.",
      action: buildAction(
        "BFF Gateway",
        "Service Mesh",
        "BFF Gateway",
        "agent management APIs being served to clients including deployment, streaming responses, and human-in-the-loop approval"
      ),
      why: "The BFF (Backend for Frontend) handles client-specific requirements: streaming responses, session management, and human-in-the-loop approval flows for sensitive agent operations.",
      component: component("bff_gateway", "BFF Gateway"),
      openingMessage: buildOpeningL3(
        "AI Agent",
        "BFF Gateway",
        "serve client-specific APIs: agent deployment, streaming responses, and human-in-the-loop approval flows",
        "BFF handles client-specific requirements: streaming, session management, and approval flows.",
        "BFF Gateway"
      ),
      celebrationMessage: buildCelebration(
        "BFF Gateway",
        "Service Mesh",
        "BFF Gateway serves client-specific APIs: agent deployment, streaming responses, and human-in-the-loop approval flows for sensitive operations.",
        "Token Bucket Rate Limiter"
      ),
      messages: [
        msg("BFF Gateway serves client-specific APIs for agent management."),
        msg("The BFF handles agent deployment, streaming responses, and human-in-the-loop approval flows for sensitive operations. This separates client logic from core agent logic."),
        msg("Press ⌘K and search for \"BFF Gateway\" and press Enter to add it, then connect Service Mesh → BFF Gateway."),
      ],
      requiredNodes: ["bff_gateway"],
      requiredEdges: [edge("service_mesh", "bff_gateway")],
      successMessage: "BFF gateway added. Now rate limiting.",
      errorMessage: "Add a BFF Gateway connected from the Service Mesh.",
    }),
    step({
      id: 3,
      title: "Add Token Bucket Rate Limiter",
      explanation:
        "AI Agent's Rate Limiter uses token buckets per tenant: free tier (100 tool calls/min), pro tier (1000/min), enterprise (unlimited). Token buckets prevent runaway agents from exhausting tool APIs.",
      action: buildAction(
        "Token Bucket Rate Limiter",
        "BFF Gateway",
        "Token Bucket Rate Limiter",
        "tenant-based rate limiting being enforced with token buckets per tier: free (100/min), pro (1000/min), enterprise (unlimited)"
      ),
      why: "Without rate limiting, one runaway agent could exhaust a tool API's rate limit in seconds. Token buckets per tenant prevent this while allowing legitimate high-volume usage.",
      component: component("token_bucket_limiter", "Token Bucket Rate Limiter"),
      openingMessage: buildOpeningL3(
        "AI Agent",
        "Token Bucket Rate Limiter",
        "enforce tenant-based rate limits: free tier (100/min), pro tier (1000/min), enterprise (unlimited)",
        "Without rate limiting, one runaway agent could exhaust tool APIs in seconds.",
        "Token Bucket Rate Limiter"
      ),
      celebrationMessage: buildCelebration(
        "Token Bucket Rate Limiter",
        "BFF Gateway",
        "Rate Limiter uses token buckets per tenant: free tier (100 tool calls/min), pro tier (1000/min), enterprise (unlimited). Token buckets prevent runaway agents from exhausting tool APIs.",
        "OpenTelemetry Collector"
      ),
      messages: [
        msg("Token Bucket Rate Limiter enforces tenant-based rate limits: free tier (100/min), pro tier (1000/min), enterprise (unlimited)."),
        msg("Without rate limiting, one runaway agent could exhaust a tool API's rate limit in seconds. Token buckets prevent this while allowing legitimate high-volume usage."),
        msg("Press ⌘K and search for \"Token Bucket Rate Limiter\" and press Enter to add it, then connect BFF Gateway → Token Bucket Rate Limiter."),
      ],
      requiredNodes: ["token_bucket_limiter"],
      requiredEdges: [edge("bff_gateway", "token_bucket_limiter")],
      successMessage: "Rate limiter added. Now distributed tracing.",
      errorMessage: "Add a Token Bucket Rate Limiter connected from the BFF Gateway.",
    }),
    step({
      id: 4,
      title: "Add OpenTelemetry Collector",
      explanation:
        "AI Agent's OTel Collector traces agent reasoning chains across orchestrator, tool calls, and memory retrieval. A single agent task can trigger 50+ tool calls — tracing is essential for debugging agent failures.",
      action: buildAction(
        "OpenTelemetry Collector",
        "Agent Orchestrator",
        "OpenTelemetry Collector",
        "agent reasoning chains being traced across orchestrator, tool calls, and memory retrieval with full distributed tracing"
      ),
      why: "A single agent task can trigger 50+ tool calls across multiple services. Without distributed tracing, debugging agent failures is nearly impossible — OTel traces every step.",
      component: component("otel_collector", "OpenTelemetry Collector"),
      openingMessage: buildOpeningL3(
        "AI Agent",
        "OTel Collector",
        "trace agent reasoning chains across orchestrator, tool calls, and memory retrieval with full distributed tracing",
        "A single agent task triggers 50+ tool calls — tracing is essential for debugging failures.",
        "OpenTelemetry Collector"
      ),
      celebrationMessage: buildCelebration(
        "OpenTelemetry Collector",
        "Agent Orchestrator",
        "OTel Collector traces agent reasoning chains across orchestrator, tool calls, and memory retrieval. A single agent task can trigger 50+ tool calls — tracing is essential for debugging agent failures.",
        "Correlation ID Handler"
      ),
      messages: [
        msg("OpenTelemetry Collector traces agent reasoning chains across orchestrator, tool calls, and memory retrieval."),
        msg("A single agent task can trigger 50+ tool calls across multiple services. Without distributed tracing, debugging agent failures is nearly impossible — OTel traces every step."),
        msg("Press ⌘K and search for \"OpenTelemetry Collector\" and press Enter to add it, then connect Agent Orchestrator → OpenTelemetry Collector."),
      ],
      requiredNodes: ["otel_collector"],
      requiredEdges: [edge("agent_orchestrator", "otel_collector")],
      successMessage: "OTel collector added. Now correlation IDs.",
      errorMessage: "Add an OpenTelemetry Collector connected from the Agent Orchestrator.",
    }),
    step({
      id: 5,
      title: "Add Correlation ID Handler",
      explanation:
        "AI Agent's Correlation ID links an agent task to every tool call, memory retrieval, and LLM response. Debugging a failed agent task requires tracing through dozens of tool executions.",
      action: buildAction(
        "Correlation ID Handler",
        "Agent Executor",
        "Correlation ID Handler",
        "agent task correlation IDs being linked to every tool call, memory retrieval, and LLM response for end-to-end debugging"
      ),
      why: "Without correlation IDs, tracing a failed agent task through dozens of tool executions is impossible. Correlation IDs link every action to the originating task.",
      component: component("correlation_id_handler", "Correlation ID Handler"),
      openingMessage: buildOpeningL3(
        "AI Agent",
        "Correlation ID Handler",
        "link agent task correlation IDs to every tool call, memory retrieval, and LLM response for end-to-end debugging",
        "Without correlation IDs, tracing failed agent tasks through dozens of executions is impossible.",
        "Correlation ID Handler"
      ),
      celebrationMessage: buildCelebration(
        "Correlation ID Handler",
        "Agent Executor",
        "Correlation ID links an agent task to every tool call, memory retrieval, and LLM response. Debugging a failed agent task requires tracing through dozens of tool executions.",
        "mTLS Certificate Authority"
      ),
      messages: [
        msg("Correlation ID Handler links an agent task to every tool call, memory retrieval, and LLM response."),
        msg("Debugging a failed agent task requires tracing through dozens of tool executions. Correlation IDs enable end-to-end debugging of the full agent reasoning chain."),
        msg("Press ⌘K and search for \"Correlation ID Handler\" and press Enter to add it, then connect Agent Executor → Correlation ID Handler."),
      ],
      requiredNodes: ["correlation_id_handler"],
      requiredEdges: [edge("agent_executor", "correlation_id_handler")],
      successMessage: "Correlation IDs added. Now mTLS CA.",
      errorMessage: "Add a Correlation ID Handler connected from the Agent Executor.",
    }),
    step({
      id: 6,
      title: "Add mTLS Certificate Authority",
      explanation:
        "AI Agent's SPIFFE CA issues certificates to every agent pod, tool service, and memory store. Compromised agent pods must not be able to access other tenants' data.",
      action: buildAction(
        "mTLS Certificate Authority",
        "Service Mesh",
        "mTLS Certificate Authority",
        "SPIFFE CA issuing certificates to every agent pod, tool service, and memory store for workload identity"
      ),
      why: "Multi-tenant agent systems require workload identity. SPIFFE CA issues short-lived certificates to every service — compromised pods can't access other tenants' data.",
      component: component("mtls_certificate_authority", "mTLS Certificate Authority"),
      openingMessage: buildOpeningL3(
        "AI Agent",
        "SPIFFE CA",
        "issue certificates to every agent pod, tool service, and memory store for multi-tenant workload identity",
        "Multi-tenant agents require workload identity — SPIFFE CA issues short-lived certificates.",
        "mTLS Certificate Authority"
      ),
      celebrationMessage: buildCelebration(
        "mTLS Certificate Authority",
        "Service Mesh",
        "SPIFFE CA issues certificates to every agent pod, tool service, and memory store. Compromised agent pods must not be able to access other tenants' data.",
        "Cache Stampede Guard"
      ),
      messages: [
        msg("SPIFFE CA issues certificates to every agent pod, tool service, and memory store for workload identity."),
        msg("Multi-tenant agent systems require workload identity. Compromised agent pods must not be able to access other tenants' data — SPIFFE CA provides the identity layer."),
        msg("Press ⌘K and search for \"mTLS Certificate Authority\" and press Enter to add it, then connect Service Mesh → mTLS Certificate Authority."),
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
        "AI Agent's Cache Stampede Guard prevents memory cache stampedes when popular agent sessions expire. Lock-assisted refresh ensures only one worker retrieves the memory state.",
      action: buildAction(
        "Cache Stampede Guard",
        "In-Memory Cache",
        "Cache Stampede Guard",
        "memory cache stampedes being prevented with lock-assisted refresh when popular agent sessions expire"
      ),
      why: "When a popular agent session expires, thousands of concurrent requests try to refresh the cache simultaneously. Lock-assisted refresh ensures only one worker retrieves the memory state.",
      component: component("cache_stampede_guard", "Cache Stampede Guard"),
      openingMessage: buildOpeningL3(
        "AI Agent",
        "Cache Stampede Guard",
        "prevent memory cache stampedes with lock-assisted refresh when popular agent sessions expire",
        "When popular sessions expire, thousands of requests try to refresh — lock-assisted refresh prevents stampedes.",
        "Cache Stampede Guard"
      ),
      celebrationMessage: buildCelebration(
        "Cache Stampede Guard",
        "In-Memory Cache",
        "Cache Stampede Guard prevents memory cache stampedes when popular agent sessions expire. Lock-assisted refresh ensures only one worker retrieves the memory state.",
        "Change Data Cache"
      ),
      messages: [
        msg("Cache Stampede Guard prevents memory cache stampedes when popular agent sessions expire."),
        msg("When a popular agent session expires, thousands of concurrent requests try to refresh the cache simultaneously. Lock-assisted refresh ensures only one worker retrieves the memory state."),
        msg("Press ⌘K and search for \"Cache Stampede Guard\" and press Enter to add it, then connect In-Memory Cache → Cache Stampede Guard."),
      ],
      requiredNodes: ["cache_stampede_guard"],
      requiredEdges: [edge("in_memory_cache", "cache_stampede_guard")],
      successMessage: "Cache stampede guard added. Now CDC cache.",
      errorMessage: "Add a Cache Stampede Guard connected from the In-Memory Cache.",
    }),
    step({
      id: 8,
      title: "Add Change Data Cache",
      explanation:
        "AI Agent's CDC pipeline precomputes agent session summaries and knowledge base lookups. These are materialized in Redis for instant retrieval during agent reasoning.",
      action: buildAction(
        "Change Data Cache",
        "CDC Connector",
        "Change Data Cache",
        "agent session summaries and knowledge base lookups being precomputed and materialized in Redis for instant retrieval"
      ),
      why: "Agents frequently need session summaries and knowledge lookups during reasoning. CDC precomputes these and materializes them in Redis — agents get instant results without waiting for computation.",
      component: component("change_data_cache", "Change Data Cache"),
      openingMessage: buildOpeningL3(
        "AI Agent",
        "Change Data Cache",
        "precompute agent session summaries and knowledge base lookups materialized in Redis for instant retrieval",
        "CDC precomputes session summaries — agents get instant results during reasoning.",
        "Change Data Cache"
      ),
      celebrationMessage: buildCelebration(
        "Change Data Cache",
        "CDC Connector",
        "CDC pipeline precomputes agent session summaries and knowledge base lookups materialized in Redis. Agents get instant retrieval during reasoning without waiting for computation.",
        "Data Warehouse"
      ),
      messages: [
        msg("Change Data Cache precomputes agent session summaries and knowledge base lookups materialized in Redis."),
        msg("Agents frequently need session summaries during reasoning. CDC precomputes these and materializes them in Redis — agents get instant results without waiting for computation."),
        msg("Press ⌘K and search for \"Change Data Cache\" and press Enter to add it, then connect CDC Connector → Change Data Cache."),
      ],
      requiredNodes: ["change_data_cache"],
      requiredEdges: [edge("cdc_connector", "change_data_cache")],
      successMessage: "Change data cache added. Now data warehouse.",
      errorMessage: "Add a Change Data Cache connected from the CDC Connector.",
    }),
    step({
      id: 9,
      title: "Add Data Warehouse",
      explanation:
        "AI Agent's Data Warehouse (ClickHouse) stores agent execution traces, tool performance metrics, and success rates. This data trains agent optimization models and identifies failure patterns.",
      action: buildAction(
        "Data Warehouse",
        "CDC Connector",
        "Data Warehouse",
        "agent execution traces, tool performance metrics, and success rates being stored for ML training and failure analysis"
      ),
      why: "Agent optimization requires historical data: which tools succeed? Which fail? What patterns predict failure? Data warehouse stores this for ML training and failure pattern identification.",
      component: component("data_warehouse", "Data Warehouse"),
      openingMessage: buildOpeningL3(
        "AI Agent",
        "Data Warehouse (ClickHouse)",
        "store agent execution traces, tool performance metrics, and success rates for ML training and failure analysis",
        "Agent optimization requires historical data — data warehouse stores execution traces for ML training.",
        "Data Warehouse"
      ),
      celebrationMessage: buildCelebration(
        "Data Warehouse",
        "CDC Connector",
        "Data Warehouse (ClickHouse) stores agent execution traces, tool performance metrics, and success rates. This data trains agent optimization models and identifies failure patterns.",
        "Event Store"
      ),
      messages: [
        msg("Data Warehouse stores agent execution traces, tool performance metrics, and success rates for ML training and failure analysis."),
        msg("Agent optimization requires historical data: which tools succeed, which fail, what patterns predict failure. Data warehouse enables ML training and failure pattern identification."),
        msg("Press ⌘K and search for \"Data Warehouse\" and press Enter to add it, then connect CDC Connector → Data Warehouse."),
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
        "AI Agent's Event Store stores every agent action as an immutable event: task started, tool called, decision made, task completed. Event sourcing enables agent replay, debugging, and audit trails.",
      action: buildAction(
        "Event Store",
        "Kafka",
        "Event Store",
        "every agent action being stored as immutable events: task started, tool called, decision made, task completed"
      ),
      why: "Event sourcing provides complete audit trails and enables agent replay. Every action is stored as an immutable event — debugging failures and auditing agent behavior is trivial.",
      component: component("event_store", "Event Store"),
      openingMessage: buildOpeningL3(
        "AI Agent",
        "Event Store",
        "store every agent action as an immutable event for replay, debugging, and audit trails",
        "Event sourcing provides complete audit trails and enables agent replay.",
        "Event Store"
      ),
      celebrationMessage: buildCelebration(
        "Event Store",
        "Kafka",
        "Event Store stores every agent action as an immutable event: task started, tool called, decision made, task completed. Event sourcing enables agent replay, debugging, and audit trails.",
        "Saga Orchestrator"
      ),
      messages: [
        msg("Event Store stores every agent action as an immutable event for replay, debugging, and audit trails."),
        msg("Event sourcing provides complete audit trails and enables agent replay. Every action is stored as an immutable event — debugging failures and auditing agent behavior is trivial."),
        msg("Press ⌘K and search for \"Event Store\" and press Enter to add it, then connect Kafka → Event Store."),
      ],
      requiredNodes: ["event_store"],
      requiredEdges: [edge("kafka_streaming", "event_store")],
      successMessage: "Event store added. Now saga orchestrator.",
      errorMessage: "Add an Event Store connected from the Kafka Streaming.",
    }),
    step({
      id: 11,
      title: "Add Saga Orchestrator",
      explanation:
        "AI Agent's Saga Orchestrator manages multi-step agent workflows: plan task, execute tools, validate results, and commit or compensate. Each step can fail and requires rollback.",
      action: buildAction(
        "Saga Orchestrator",
        "Agent Supervisor",
        "Saga Orchestrator",
        "multi-step agent workflows being managed with plan, execute, validate, and compensate steps for each failure"
      ),
      why: "Multi-step agent workflows require saga patterns: each step can fail and requires compensation. The Saga Orchestrator manages plan, execute, validate, and rollback across the entire workflow.",
      component: component("saga_orchestrator", "Saga Orchestrator"),
      openingMessage: buildOpeningL3(
        "AI Agent",
        "Saga Orchestrator",
        "manage multi-step agent workflows: plan, execute, validate, and compensate for each failure",
        "Multi-step agent workflows require saga patterns with compensation for each failure.",
        "Saga Orchestrator"
      ),
      celebrationMessage: buildCelebration(
        "Saga Orchestrator",
        "Agent Supervisor",
        "Saga Orchestrator manages multi-step agent workflows: plan, execute, validate, and commit or compensate. Each step can fail and requires rollback. AI Agent Enterprise is complete.",
        "nothing — you have built AI Agent Enterprise"
      ),
      messages: [
        msg("Saga Orchestrator manages multi-step agent workflows: plan, execute, validate, and compensate for each failure."),
        msg("Multi-step agent workflows require saga patterns: each step can fail and requires compensation. The Saga Orchestrator manages the entire workflow with rollback capabilities."),
        msg("Press ⌘K and search for \"Saga Orchestrator\" and press Enter to add it, then connect Agent Supervisor → Saga Orchestrator."),
      ],
      requiredNodes: ["saga_orchestrator"],
      requiredEdges: [edge("agent_supervisor", "saga_orchestrator")],
      successMessage: "Saga orchestrator added. You have built AI Agent Enterprise.",
      errorMessage: "Add a Saga Orchestrator connected from the Agent Supervisor.",
    }),
  ],
});

export const aiAgentTutorial: Tutorial = tutorial({
  id: 'ai-agent-system-architecture',
  title: 'How to Design an AI Agent System',
  description:
    'Build a production AI agent system. Learn multi-agent orchestration, tool calling, memory systems, agent supervision, and LangGraph-style workflows that power autonomous AI systems.',
  difficulty: 'Advanced',
  category: 'AI Systems',
  isLive: false,
  icon: 'Bot',
  color: '#10b981',
  tags: ['LangGraph', 'Tool Use', 'Memory', 'Agents'],
  estimatedTime: '~87 mins',
  levels: [l1, l2, l3],
});
