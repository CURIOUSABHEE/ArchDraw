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
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
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
        msg('Press ⌘K, search for "Agent Orchestrator", add it, then connect API Gateway → Agent Orchestrator.'),
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
        msg('Press ⌘K, search for "Agent Planner", add it, then connect Agent Orchestrator → Agent Planner.'),
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
        msg('Press ⌘K, search for "Tool Registry", add it, then connect Agent Planner → Tool Registry.'),
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
        msg('Press ⌘K, search for "Agent Orchestrator", add another one for the Agent Executor, then connect Agent Orchestrator → Agent Executor.'),
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
        msg('Press ⌘K, search for "Agent Memory", add it, then connect Agent Orchestrator → Agent Memory.'),
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
        msg('Press ⌘K, search for "Agent Supervisor", add it, then connect Agent Executor → Agent Supervisor.'),
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
        msg('Press ⌘K, search for "LLM API", add it for the LLM Gateway, then connect Agent Orchestrator → LLM Gateway.'),
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
        msg('Press ⌘K, search for "Metrics Collector", add it, then connect Agent Orchestrator → Metrics Collector.'),
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
        msg('Press ⌘K, search for "Logger", add it, then connect Agent Orchestrator → Logger.'),
      ],
      requiredNodes: ['logger'],
      requiredEdges: [edge('agent_orchestrator', 'logger')],
      successMessage: 'Logger added. You have built an AI Agent System.',
      errorMessage: 'Add a Logger and connect Agent Orchestrator → Logger.',
    }),
  ],
});

export const aiAgentTutorial: Tutorial = tutorial({
  id: 'ai-agent-system',
  title: 'How to Design an AI Agent System',
  description:
    'Build a production AI agent system. Learn multi-agent orchestration, tool calling, memory systems, agent supervision, and LangGraph-style workflows that power autonomous AI systems.',
  difficulty: 'Advanced',
  category: 'AI Systems',
  isLive: false,
  icon: 'Bot',
  color: '#10b981',
  tags: ['LangGraph', 'Tool Use', 'Memory', 'Agents'],
  estimatedTime: '~30 mins',
  levels: [l1],
});
