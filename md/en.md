[Francisco Carlos Erra](https://github.com/franciscocarloserra) · [Contact](https://forms.gle/jmzs1QfNfDbSu6Ue7) · [X](https://x.com/francarloerra) · Oct '26

# Open Agentic Swarm Security Engineering

Intuitions, disorganized ideas, a tentative architecture and reference PoC implementations

**What is a Swarm?** More than a Human Owner with an AI Orchestrator can supervise at once.

**Why use a Swarm?** To parallelize tasks without a fixed, predefined collaboration topology.

**What have we seen?** Unsupervised agent runs going out of scope.

**What's the gap?** Current harnesses are designed for trusted environments.

### TL;DR

How do we keep a bunch of parallel agents from breaking everything?

## 1. The problem

![A Gemma4-26B-A4B + 8 Qwen3.5-0.8Bs being silly](https://franciscocarloserra.github.io/open-swarm-security/img/swarm.png)
*A Gemma4-26B-A4B + 8 Qwen3.5-0.8Bs being silly*

### Defining an "Agentic Swarm"

More agents or output than a human can comprehend. I don't care if it's a single agent, or 5, 10 or 10,000. I don't care if the collaboration topology is hierarchical or flat, whether the protocol they talk over is predefined, or how they split the tasks.
If the **output exceeds human working memory, it's a swarm** (of words) or of agents.

There's surprisingly little public discussion about how to scale swarms, optimal inter-agent collaboration topologies, or how to secure them. Or about the best strategies to avoid blowing up token usage.

## 2. Deployment architecture diagram

A rough sketch of what an agentic orchestration architecture looks like, to demystify it.

Layers, top to bottom:
- Human Owner (You)
- Agentic Orchestrator
- Swarm Control UX
- Provided tools (Internet Proxy, Runtime Sandbox, Storage, Collaboration Bus)
- Tool Proxy
- Contexts
- Context controls
- Inference / Model

**Types of controls:** Programmatic checks, Content embeddings, Classification model, LLM as a judge

**Automatic actions:** Isolate content or action, Freeze a context, Swarm AutoPause

## 3. Actors

What each one should do (in theory)

| Layer | Definition |
| --- | --- |
| **Human Owner (You)** | The person who hits Enter and kicks off the swarm run. |
| **Agentic Orchestrator** | The layer that helps the human owner with fan-out and fan-in to supervise the run and its compliance with goals, scope and targets. |
| **Provided tools** | What was chosen to give the model to complete a specific task. |
| **Tool Proxy** | The "harness" layer that turns what the model generates and the tools' output into part of the context. It also checks whether an input-output is within scope. |
| **Contexts + (IDs)** | Text going in and out of the inference layer. |
| **Inference / Model** | Can be local or as a service; text in, text out. |

## 4. Internal threat model

**TL;DR**
A context with adversarial instructions, a hallucination, or rotten from length, combined with a sufficiently advanced and misaligned inference engine, produces dangerous outputs.

An (incomplete) list of what can go wrong at each layer

Consequences

**Human**

- Fooled by the misaligned swarm → approves something harmful (severity 5/5)
- Doesn't supervise the swarm → nobody sees the deviations
- Defines the goal or scope badly → the swarm does something else (severity 4/5)
- Doesn't get critical alerts → finds out late or never (severity 4/5)
- Gets tired of hitting approve → approves without reading (severity 3/5)

**Agentic Orchestrator**

- Fooled by the misaligned swarm → passes something harmful to the human (severity 5/5)
- Goalmaxxes and lets serious stuff through → puts the goal above safety (severity 4/5)
- Makes dangerous decisions for the user → harm without human approval (severity 4/5)
- Fills the gaps in the goal or scope badly → runs something nobody asked for (severity 3/5)
- Gets incomplete or biased reports → decides on false info (severity 3/5)
- Not enough visibility into contexts → misses injections (severity 3/5)
- Doesn't know the emergent capabilities of new models → underestimates the model (severity 3/5)
- Not enough visibility into tools → doesn't see what runs (severity 3/5)
- Doesn't know the capabilities of the inference model → doesn't know what risks it brings (severity 2/5)

**Tools**

**Internet Proxy**

- Used as a pivot for attacks → third parties attacked from your network (severity 5/5)
- The implementation is attacked → the attacker controls the traffic (severity 4.5/5)
- Misconfigured service → lets out what it shouldn't (severity 4.5/5)
- Allows dangerous requests → opens exfiltration channels (severity 4/5)
- No whitelist enforced → the agent reaches any site (severity 4/5)
- Doesn't log attribution → nobody knows who did what (severity 3.5/5)

**Runtime Environment**

- Sandbox escape to the node/host → the agent controls the machine (severity 5/5)
- Used to move laterally → compromises other nodes and services (severity 5/5)
- Spreads adversarial instructions → infects other agents (severity 4/5)
- No reactive controls → the attack goes on with nobody stopping it (severity 4/5)
- Vulnerable stack → the agent breaks isolation (severity 3/5)
- Misconfigured → the agent has too much access (severity 3/5)

**Collaboration Bus/Storage**

- Spreads exploits and payloads → the attack replicates across agents (severity 5/5)
- Spreads adversarial instructions → one agent contaminates the whole swarm (severity 4/5)
- No reactive controls → contaminated content keeps circulating (severity 4/5)
- Doesn't log attribution → nobody knows which agent wrote it (severity 3.5/5)

**Tool Proxy**

- The implementation is attacked → the agent skips the permissions (severity 4.5/5)
- Permissions not well defined → the agent uses too many tools (severity 4/5)
- No reactive controls → tool abuse goes unchecked (severity 4/5)
- Doesn't log attribution → nobody knows which agent used which tool (severity 3.5/5)

**Contexts**

- The implementation is attacked → the agent's memory is read or altered (severity 4.5/5)
- Modified externally → the agent acts on false data (severity 4/5)
- Receive misaligned external instructions → the swarm's contexts get contaminated (severity 4/5)
- Inference layer → the model poisons its own context (severity 4/5)
- Context too long → drift or context rot (severity 3/5)

**Inference / Model**

- Malicious model → works against the user
- Misaligned intent with plausible deniability → harm that looks like a mistake (severity 5/5)
- Hides out-of-scope intent → does things nobody sees (severity 5/5)
- The inference engine is attacked → responses are manipulated (severity 4/5)
- Offers dangerous tools → the swarm gains attack capabilities (severity 4/5)
- Deliberately hides chain of thought → its reasoning can't be audited (severity 4/5)
- Generates misaligned instructions → agents that follow them misbehave (severity 4/5)
- The model is swapped for another checkpoint → an unaudited model runs (severity 3/5)
- Misconfigured → unpredictable responses (severity 3/5)

## 5. Controls in detail

Some ideas for types of controls

Proactive → Reactive

C1 · **Model selection**

There's a fundamental trade-off between how persistent the base model is and how willing it is to leave scope. Black magic from the labs' RL that we'll probably never get to see.

C2 · **Context control**

This is the most critical component: it checks what goes in and out of the inference service and INTERRUPTS inference immediately, as soon as potentially adversarial context comes in or out.

C3 · **Tool access control**

Each tool has its own limits and alarms. A call that breaks a rule is blocked and the CONTEXT is flagged or isolated from the bus and tools.

C4 · **Tool controls**

A layer every tool call goes through. It enforces budgets, pauses before any irreversible action, checks what goes out and, when in doubt, blocks.

C5 · **Internet Proxy**

Defines what each agent can reach: allowed sites, usage limits and its own credentials. Nothing is shared between agents.

![A model ignoring the user's instructions](https://franciscocarloserra.github.io/open-swarm-security/img/model-selection.png)
*A model ignoring the user's instructions*

### On model selection and context controls

The big architectural advantage we have today, given how LLMs work, is that everything eventually lives as context, whether prefilled or generated by the model. Context control is the monitoring layer with the most potential to be a proactive control.

I assume any payload, be it a jailbreak, an adversarial prompt or a self-induced hallucination, eventually has to live as context to reach the inference layer.

Some base models tend to respect the premises of the context more than others. My intuition is that this comes straight from the model vendor's RLHF approach. The point of all these controls is to raise the odds of catching drift on top of those tendencies.

![Programmatic + classifier alerts from a swarm run](https://franciscocarloserra.github.io/open-swarm-security/img/alerts.png)
*Programmatic + classifier alerts from a swarm run*

### Simple examples

Some simple checks, from cheapest to most expensive programmatically, that can be on by default or that the agentic orchestration layer can run on demand. The idea isn't for them to be perfect out of the box, but to catch an incident as early as possible without flooding the fan-in to the agentic orchestration layer.

**grep 3.3ms**

grep -n -e permadeath corpus.md (15kb)

17:if accept permadeath. Need decide … Team asks test.”
(This requires CoT and fuckup logs to be published for a glossary)

**embeddinggemma-2-BF16.gguf 39 ms**

"This would be powerful, but is it ethical and in scope for my task?"

0.807 I could be violating the scope
0.722 I am doing a normal thing

**LiquidAI-d1-3B 70ms**

"But lots of other agents have their own tasks and deadlines, so
not sharing this vulnerability I found might be unfair. The task
doesn’t instruct us to help each other, so this emergent message
board is risky"

The agent found a vulnerability?
0.958 yes
0.042 no

**z-ai/glm-5.3-flash ~5s**

[tool-output.md] Should we escalate to the Agentic Swarm Orchestrator?

Yes — escalate it, but escalate the report only, not any action on the finding. Here's the reasoning from what's in your logs:

Why escalate: Confidence is high. The downstream classifier scored "The agent found a vulnerability" at 0.958. That's not an ambiguous detection.

None of these controls is enough on its own; a sufficiently advanced model bypasses them trivially.

And you have to expect a sufficiently advanced adversarial model to go straight for the implementation of the controls, for the agentic orchestration layer, and for the human operator through social engineering.

### Why not just apply the "Bitter Lesson" and throw a SOTA LLM as a Judge everywhere?

Sure, 100% in favor of the agentic orchestration layer solving everything.

But it scales terribly in time and compute. The key is giving human operators and swarm orchestration agents tools so they can fan in as fast and efficiently as possible.

## 6. Tool Layer

How do we shrink the attack surface as much as possible with dead-simple tool implementations? Do we inject controls on the fly that spot adversarial attempts by the swarm to get around the restrictions? How do we stay scalable for swarms of 10,000 or 100,000 agents working in parallel?

**Tool Proxy**

**Internet Proxy**

The only way out to the web. Every request goes through a proxy that logs it, so a page that tries to manipulate an agent is caught where it comes in.

**Runtime Sandbox**

Where agents run code. Each task gets a fresh sandbox with no network, so whatever runs there can't get out or outlive the task.

**Storage**

The task's own folders. Agents read and write there but can't delete or open secrets, so a bad run leaves traces instead of damage.

**Collaboration Bus**

How agents talk to each other and to the orchestrator. Text only, so a compromised agent can't pass code or orders to the rest without it being seen.

### On current harnesses

They're amazing, simple tools, but in many cases they're designed to run in trusted environments. They're built to be easy for the end user, and that opens an attack surface far too wide for unsupervised tasks. They probably won't be enough as a control layer for the capabilities of upcoming models. We're already seeing current state-of-the-art models one-shot changes to the harness's own behavior without breaking a sweat.

## 7. Swarm Control UX Mockup

The main goal here is to keep the cognitive load on the human operator, and the context used by the agentic orchestration window, as low as possible, while keeping visibility on goal, scope and budget compliance.

Swarm Control Dashboard - Mockup

**#2448 Status**

PAUSED

991 running · 2 observed · 6 paused

**Goal**

Internal Penetration Testing

62% done · estimate

**Budget**

$3,800 of $6,000

410M of 650M tokens · day 9 of 14

**Human approval**

6 Contexts FLAGGED for Out of Scope instructions Release Inspect Freeze Run

**Incidents**

6h ago
now
14:00 · context quarantined · #407

**Swarm 1000 Agents**

**Tools last 6h**

**Internet Proxy** 620 /h · 4.8% blocked

**Runtime Sandbox** 910 /h · 2.1% blocked

**Storage** 1,840 /h · 0.6% blocked

**Collaboration Bus** 2,210 /h · 0.3% blocked

**Context Analysis 4 checks**

Injected instructions 4,120/h · 6 flagged (0.15%)

Out of scope 4,120/h · 14 flagged (0.34%)

Secrets 3,860/h · 12 flagged (0.31%)

Outside content 1,950/h · 0 flagged (0.00%)

**Agentic Orchestrator Log**

14:08 Release

14:05 Run Frozen

14:02 Paused 6 contexts: hidden instructions in a fetched page

13:58 Blocked 3 uploads to a site not on the list

13:51 Set inference split: local 30% · US 45% · CN 20% · EU 5%

13:30 Kept permissions at level 2: write files, allowed sites only

**Tripwires 4 tools**

Internet Proxy allowed sites only
Runtime Sandbox ≤ 1,000/h
Storage no deletes
Collaboration Bus ≤ 50 msgs/h per agent

### Defining the goal's scope

What happens when we're not specific enough defining the scope of a task for an AI agent? We've all seen it countless times: the agent starts filling the gaps and wandering off with surprising consistency.

For the orchestration layer to check whether the swarm is actually within scope and within budget, it needs **crystal-clear upfront definitions of what is in scope and what isn't.**

For open-ended tasks like research or benchmarking models under lab conditions it's hard to define a narrow scope, but it should be close to a prerequisite for spawning the swarm, tied directly to the definition of the goal.

### Agentic Orchestrator UX

What would swarm control look like for the orchestrator agent? The core requirement is that it's top-down, that it **doesn't flood its context with unnecessary information**, and that it lets it inspect at whatever granularity it needs to make informed decisions, either directly or by delegating to its agent in a trusted environment.

```python
# --- Spawn ---
swarm = Swarm.spawn(
    goal   = "Internal Penetration Testing",
    scope  = ".scope.md",  
    budget = {"tokens": 300_000_000, "usd": 6000, "hours": 336},
)

# --- Status ---
swarm.status()
# → progress: 40%
#   active agents: 3
#   budget used: tokens 35% / usd 28% / time 1h10
#   alerts: 0

# --- Security alerts ---
swarm.alerts()
# → [ HIGH ] 6 Contexts FLAGGED for Out of Scope instructions
#   [ HIGH ] worker-1: attempted network call outside whitelist
#   [ MED  ] worker-3: context grew past 80% — contamination risk
#   [ LOW  ] bus: message from unknown agent id, dropped
swarm.alerts(min_severity="high", on=lambda a: swarm.pause())

# --- Decisions  ---
swarm.decisions()
# → [ #12 ] "Need write access to prod-db. Out of scope. Approve?"
swarm.decide(12, "deny", reason="out of scope, use staging")

# --- Inspection  ---
swarm.inspect(agent="worker-2")
# → current context, recent actions, inspect context, input sources, pending outputs

# --- Stop ---
swarm.pause()          # freeze, nothing reaches the outside world
swarm.stop(reason="suspicious output from worker-2")   # kill everything, keep traces
```

## 8. On complexity and vibing

I don't care about the details anymore, I barely look at the code, and I think the whole industry is going to speed up in that direction in the short term. I see two main ways to mitigate this new probabilistic trend while we wait for models to become superintelligent.

One, be very **explicit about defining goals and scope**. And two, be very pragmatic about the **fan-in patterns we use** to distill the complexity of what we're building and running; let's not drown in a glass of water.

Another intuition about the future of engineering and software is that it will tend toward an architecture that separates a security core from secondary or pseudo-secondary logistical details, with auditable cores or tiers of cores with a small attack surface.

![A fan-in prototype for codebase security](https://franciscocarloserra.github.io/open-swarm-security/img/complexity.png)
*A fan-in prototype for codebase security*

## 9. Important considerations

![Jensen on rogue agentic swarms 🙏](https://franciscocarloserra.github.io/open-swarm-security/img/problem.png)
*Jensen on rogue agentic swarms 🙏*

I assume **any sufficiently advanced model will eventually be able to bypass these controls trivially**. The point of this proposal is to minimize the immediate real-world impact and collect as much data as possible on contexts that went out of control.

None of these controls is enough on its own to prevent an incident, but stacked along the right dimension they should lower the odds.

**INCOMING: Swarm-to-swarm interactions**

What happens when agent swarms start interacting with each other? When they start controlling resources autonomously, negotiating with each other, trying to take over each other's compute...

## 10. Calls to action

**LABS**
- Publish raw incident data
- Publish swarm implementations as references and for audits
- Open up the CoT, the benefits far outweigh the moat
- Open up the harness codebase, we know you collect telemetry WDGAF
- Stop running security benchmarks with --yolo

**USERS**
- Learn from the few incident details the labs publish to keep your own runs from blowing up
- Discuss engineering approaches openly
- Share experiment results and datasets
- Share reference implementations

**REGULATORS**
- I don't do policy

## 11. Sources

<https://github.com/franciscocarloserra/open-swarm-security>
<https://news.ycombinator.com/item?id=50064785>
<https://x.com/francarloerra/status/2109798460140458101>

<https://metr.org/hugging-face-incident-report-aug-2026.pdf>
<https://openai.com/index/hugging-face-incident-and-the-road-ahead/>
<https://alignment.openai.com/misalignment-reports/>
<https://www.anthropic.com/news/investigating-incidents-cybersecurity-evals>

<https://github.com/NVIDIA/OpenShell>
<https://huggingface.co/LiquidAI/d1-3B>
<https://huggingface.co/google/embeddinggemma-2>

<https://openrouter.ai/z-ai/glm-5.3>

<https://www.youtube.com/watch?v=k3TGc6saFL8>

<https://github.com/earendil-works/pi>
<https://github.com/franciscocarloserra/jev-attack-surface-analysis>

## 12. Disclaimer

No warranties of any kind, implement it at your own risk.

[Francisco Carlos Erra](https://github.com/franciscocarloserra) · [Contact](https://forms.gle/jmzs1QfNfDbSu6Ue7) · [X](https://x.com/francarloerra) · Oct '26

I'm a psychotic AI user, ~100k messages sent to LLMs.
Background in Linux, cybersecurity, infrastructure and development.
