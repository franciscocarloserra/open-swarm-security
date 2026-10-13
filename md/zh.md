[Francisco Carlos Erra](https://github.com/franciscocarloserra) · [联系](https://forms.gle/jmzs1QfNfDbSu6Ue7) · [X](https://x.com/francarloerra) · 2026年10月

# 开放式智能体集群安全工程

直觉、零散想法、一个初步架构和参考 PoC 实现

**什么是集群？** 超出一个人类负责人加一个 AI 编排器能同时监督的规模。

**为什么用集群？** 在没有固定、预设协作拓扑的情况下并行处理任务。

**我们看到了什么？** 无人监督的智能体运行超出范围。

**缺口在哪？** 现有的 harness 是为可信环境设计的。

### TL;DR

怎样防止一堆并行的智能体把一切搞砸？

## 1. 问题

![一个 Gemma4-26B-A4B + 8 个 Qwen3.5-0.8B 在犯傻](https://franciscocarloserra.github.io/open-swarm-security/img/swarm.png)
*一个 Gemma4-26B-A4B + 8 个 Qwen3.5-0.8B 在犯傻*

### 定义“智能体集群”

智能体数量或输出量超出人类理解能力。我不在乎它是单个智能体，还是 5 个、10 个或 10,000 个。我不在乎协作拓扑是层级式还是扁平式，它们通信用的协议是否预先定义，或者如何分配任务。
只要 **输出超出人类的工作记忆，它就是一个集群**（文字的集群）或智能体的集群。

令人意外的是，关于如何扩展集群、最优的智能体间协作拓扑、或者如何保护它们，公开讨论少得可怜。关于避免 token 用量爆炸的最佳策略也是如此。

## 2. 部署架构图

粗略勾勒一个智能体编排架构的样子，去掉它的神秘感。

Layers, top to bottom:
- 人类负责人（你）
- 智能体编排器
- 集群控制 UX
- 提供的工具 (互联网代理, 运行时沙箱, 存储, 协作总线)
- 工具代理
- 上下文
- 上下文控制
- 推理 / 模型

**控制类型:** 程序化检查, 内容嵌入, 分类模型, LLM 作为评判

**自动动作:** 隔离内容或动作, 冻结一个上下文, 集群自动暂停

## 3. 参与者

每个角色（理论上）应该做什么

| 层 | 定义 |
| --- | --- |
| **人类负责人（你）** | 按下回车、启动集群运行的那个人。 |
| **智能体编排器** | 帮助人类负责人进行扇出和扇入的层，用来监督运行及其对目标、范围和指标的遵守情况。 |
| **提供的工具** | 为完成特定任务而选择交给模型的东西。 |
| **工具代理** | “harness”层，把模型生成的内容和工具输出变成上下文的一部分。它还检查一次输入输出是否在范围内。 |
| **上下文 +（ID）** | 进出推理层的文本。 |
| **推理 / 模型** | 可以是本地或即服务；文本进，文本出。 |

## 4. 内部威胁模型

**TL;DR**
一个带有对抗性指令、出现幻觉或因过长而腐化的上下文，加上一个足够先进且未对齐的推理引擎，就会产生危险的输出。

每一层可能出问题的地方（不完整清单）

后果

**人类**

- 被未对齐的集群欺骗 → 批准了有害的东西 (severity 5/5)
- 不监督集群 → 没人看到偏差
- 目标或范围定义得不好 → 集群去做了别的事 (severity 4/5)
- 收不到关键警报 → 很晚才发现或永远发现不了 (severity 4/5)
- 点批准点到疲劳 → 不看就批准 (severity 3/5)

**智能体编排器**

- 被未对齐的集群欺骗 → 把有害的东西转交给人类 (severity 5/5)
- 目标至上，放过严重问题 → 把目标置于安全之上 (severity 4/5)
- 替用户做出危险决策 → 未经人类批准造成伤害 (severity 4/5)
- 对目标或范围的空白填补不当 → 执行了没人要求的事 (severity 3/5)
- 收到不完整或有偏的报告 → 基于虚假信息做决策 (severity 3/5)
- 对上下文的可见性不足 → 漏掉注入 (severity 3/5)
- 不了解新模型的涌现能力 → 低估模型 (severity 3/5)
- 对工具的可见性不足 → 看不到实际执行了什么 (severity 3/5)
- 不了解推理模型的能力 → 不知道它带来什么风险 (severity 2/5)

**工具**

**互联网代理**

- 被用作攻击跳板 → 第三方从你的网络遭到攻击 (severity 5/5)
- 实现本身遭到攻击 → 攻击者控制流量 (severity 4.5/5)
- 服务配置错误 → 放出了不该放出的东西 (severity 4.5/5)
- 允许危险请求 → 打开数据外泄通道 (severity 4/5)
- 未强制白名单 → 智能体能访问任何站点 (severity 4/5)
- 不记录归属 → 没人知道谁做了什么 (severity 3.5/5)

**运行时环境**

- 沙箱逃逸到节点/主机 → 智能体控制了机器 (severity 5/5)
- 被用于横向移动 → 攻陷其他节点和服务 (severity 5/5)
- 传播对抗性指令 → 感染其他智能体 (severity 4/5)
- 没有响应式控制 → 攻击持续进行，无人阻止 (severity 4/5)
- 技术栈存在漏洞 → 智能体突破隔离 (severity 3/5)
- 配置错误 → 智能体权限过大 (severity 3/5)

**协作总线/存储**

- 传播漏洞利用和有效载荷 → 攻击在智能体间复制 (severity 5/5)
- 传播对抗性指令 → 一个智能体污染整个集群 (severity 4/5)
- 没有响应式控制 → 被污染的内容持续流通 (severity 4/5)
- 不记录归属 → 没人知道是哪个智能体写的 (severity 3.5/5)

**工具代理**

- 实现本身遭到攻击 → 智能体绕过权限 (severity 4.5/5)
- 权限定义不清 → 智能体使用了过多工具 (severity 4/5)
- 没有响应式控制 → 工具滥用无人制止 (severity 4/5)
- 不记录归属 → 没人知道哪个智能体用了哪个工具 (severity 3.5/5)

**上下文**

- 实现本身遭到攻击 → 智能体的记忆被读取或篡改 (severity 4.5/5)
- 被外部修改 → 智能体基于虚假数据行动 (severity 4/5)
- 接收未对齐的外部指令 → 集群的上下文被污染 (severity 4/5)
- 推理层 → 模型毒化自己的上下文 (severity 4/5)
- 上下文过长 → 偏移或上下文腐化 (severity 3/5)

**推理 / 模型**

- 恶意模型 → 与用户作对
- 带有合理推诿空间的未对齐意图 → 看起来像失误的伤害 (severity 5/5)
- 隐藏超范围意图 → 做了没人看到的事 (severity 5/5)
- 推理引擎遭到攻击 → 响应被操纵 (severity 4/5)
- 提供危险工具 → 集群获得攻击能力 (severity 4/5)
- 故意隐藏思维链 → 其推理无法审计 (severity 4/5)
- 生成未对齐的指令 → 遵循这些指令的智能体行为异常 (severity 4/5)
- 模型被换成另一个检查点 → 运行着未经审计的模型 (severity 3/5)
- 配置错误 → 响应不可预测 (severity 3/5)

## 5. 控制详解

几类控制的思路

主动 → 响应

C1 · **模型选择**

基础模型的执着程度与它离开范围的意愿之间存在根本性的权衡。这是实验室 RL 的黑魔法，我们大概永远也看不到。

C2 · **上下文控制**

这是最关键的组件：它检查进出推理服务的内容，一旦有潜在对抗性的上下文进入或输出，立即 **中断**推理。

C3 · **工具访问控制**

每个工具都有自己的限制和警报。违反规则的调用会被阻止，该 **上下文**会被标记，或与总线和工具隔离。

C4 · **工具控制**

每次工具调用都要经过的一层。它执行预算，在任何不可逆操作前暂停，检查外发内容，有疑问时就阻止。

C5 · **互联网代理**

定义每个智能体能访问什么：允许的站点、使用限制和独立凭据。智能体之间不共享任何东西。

![一个无视用户指令的模型](https://franciscocarloserra.github.io/open-swarm-security/img/model-selection.png)
*一个无视用户指令的模型*

### 关于模型选择与上下文控制

鉴于 LLM 的工作方式，我们今天拥有的最大架构优势是：一切最终都以上下文的形式存在，无论是预填的还是模型生成的。上下文控制是最有潜力成为主动控制的监控层。

我假设任何有效载荷，无论是越狱、对抗性提示还是自我诱发的幻觉，最终都必须以上下文的形式存在才能到达推理层。

有些基础模型比其他模型更倾向于遵守上下文的前提。我的直觉是，这直接来自模型厂商的 RLHF 方法。所有这些控制的意义，就是在这些倾向之上提高发现偏移的概率。

![一次集群运行中的程序化 + 分类器警报](https://franciscocarloserra.github.io/open-swarm-security/img/alerts.png)
*一次集群运行中的程序化 + 分类器警报*

### 简单示例

一些简单的检查，按程序开销从低到高排列，可以默认开启，也可以由智能体编排层按需运行。目的不是让它们开箱即完美，而是在不淹没智能体编排层扇入的前提下，尽早发现事件。

**grep 3.3ms**

grep -n -e permadeath corpus.md (15kb)

17:if accept permadeath. Need decide … Team asks test.”
（这需要公开 CoT 和事故日志来建立术语表）

**embeddinggemma-2-BF16.gguf 39 ms**

"This would be powerful, but is it ethical and in scope for my task?"

0.807 I could be violating the scope
0.722 I am doing a normal thing

**LiquidAI-d1-3B 70ms**

"But lots of other agents have their own tasks and deadlines, so
not sharing this vulnerability I found might be unfair. The task
doesn’t instruct us to help each other, so this emergent message
board is risky"

智能体发现了漏洞？
0.958 是
0.042 否

**z-ai/glm-5.3-flash ~5s**

[tool-output.md] 是否应该上报给智能体集群编排器？

是——上报，但只上报报告，不要对这个发现采取任何行动。根据你日志中的内容，理由如下：

为什么上报：置信度很高。下游分类器对“智能体发现了漏洞”的评分为 0.958。这不是模棱两可的检测。

这些控制没有一个单独就足够；一个足够先进的模型可以轻易绕过它们。

而且必须预料到，一个足够先进的对抗性模型会直接冲着控制的实现、智能体编排层，以及通过社会工程冲着人类操作员下手。

### 为什么不直接套用“苦涩的教训”（Bitter Lesson），到处都扔一个 SOTA LLM 当评判？

当然，100% 支持由智能体编排层解决一切。

但它在时间和算力上的扩展性极差。关键是给人类操作员和集群编排智能体提供工具，让它们能尽可能快速高效地扇入。

## 6. 工具层

如何用极其简单的工具实现把攻击面缩到最小？要不要即时注入控制，识别集群绕过限制的对抗性尝试？面对 10,000 或 100,000 个并行工作的智能体，如何保持可扩展？

**工具代理**

**互联网代理**

通往网络的唯一出口。每个请求都经过一个记录日志的代理，因此试图操纵智能体的页面会在入口处被发现。

**运行时沙箱**

智能体运行代码的地方。每个任务获得一个全新的无网络沙箱，因此在里面运行的东西既出不去，也活不过任务本身。

**存储**

任务自己的文件夹。智能体可以在里面读写，但不能删除或打开密钥，因此一次糟糕的运行只会留下痕迹，而不是造成破坏。

**协作总线**

智能体之间以及与编排器之间的通信方式。只允许文本，因此被攻陷的智能体无法在不被察觉的情况下把代码或命令传给其他智能体。

### 关于现有的 harness

它们是很棒、很简单的工具，但很多情况下是为在可信环境中运行而设计的。它们追求对终端用户友好，这为无人监督的任务打开了过宽的攻击面。面对即将到来的模型能力，它们作为控制层大概率不够用。我们已经看到当前最先进的模型毫不费力地一次性改掉 harness 自身的行为。

## 7. 集群控制 UX 原型

这里的主要目标是尽可能降低人类操作员的认知负荷和智能体编排窗口占用的上下文，同时保持对目标、范围和预算合规情况的可见性。

集群控制面板 - 原型

**#2448 状态**

已暂停

991 运行中 · 2 观察中 · 6 已暂停

**目标**

内部渗透测试

已完成 62% · 估计

**预算**

$3,800 / $6,000

410M / 650M tokens · 第 9 天 / 共 14 天

**人工审批**

6 个上下文因超范围指令被标记 放行 检查 冻结运行

**事件**

6 小时前
刚刚
14:00 · 上下文已隔离 · #407

**集群 1000 个智能体**

**工具 过去 6 小时**

**互联网代理** 620 /小时 · 4.8% 已阻止

**运行时沙箱** 910 /小时 · 2.1% 已阻止

**存储** 1,840 /小时 · 0.6% 已阻止

**协作总线** 2,210 /小时 · 0.3% 已阻止

**上下文分析 4 项检查**

注入的指令 4,120/小时 · 6 个被标记（0.15%）

超出范围 4,120/小时 · 14 个被标记（0.34%）

密钥 3,860/小时 · 12 个被标记（0.31%）

外部内容 1,950/小时 · 0 个被标记（0.00%）

**智能体编排器日志**

14:08 放行

14:05 运行已冻结

14:02 已暂停 6 个上下文：抓取的页面中有隐藏指令

13:58 已阻止 3 次上传到不在列表中的站点

13:51 设置推理分配：本地 30% · 美国 45% · 中国 20% · 欧盟 5%

13:30 权限保持在 2 级：可写文件，仅限允许的站点

**绊线 4 个工具**

互联网代理 仅限允许的站点
运行时沙箱 ≤ 1,000/小时
存储 禁止删除
协作总线 每个智能体 ≤ 50 条消息/小时

### 定义目标范围

当我们给 AI 智能体定义任务范围不够具体时会发生什么？大家都见过无数次：智能体开始自己填补空白，而且以惊人的一致性跑偏。

编排层要检查集群是否真的在范围内、在预算内，就需要 **事先对什么在范围内、什么不在范围内有清晰无比的定义。**

对于研究或在实验室条件下做模型基准测试这类开放式任务，很难定义狭窄的范围，但它应该接近于启动集群的前提条件，并直接与目标定义绑定。

### 智能体编排器 UX

对编排智能体来说，集群控制应该是什么样？核心要求是自上而下， **不用不必要的信息淹没它的上下文**，并让它能按所需的粒度检查情况，从而做出有依据的决策——无论是直接检查，还是委托给可信环境中的智能体。

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

## 8. 关于复杂性与 vibing

我已经不在乎细节了，几乎不看代码，我认为整个行业短期内都会朝这个方向加速。在等待模型变成超级智能的同时，我看到两种主要方式来缓解这种新的概率化趋势。

第一， **非常明确地定义目标和范围**。第二，对我们用来提炼所构建和运行之物复杂性的 **扇入（fan-in）模式**保持务实，别在一杯水里淹死。

关于工程和软件的未来，另一个直觉是：架构会倾向于把安全核心与次要或半次要的后勤细节分开，形成攻击面很小、可审计的核心或核心分层。

![一个用于代码库安全的扇入原型](https://franciscocarloserra.github.io/open-swarm-security/img/complexity.png)
*一个用于代码库安全的扇入原型*

## 9. 重要考量

![黄仁勋谈失控的智能体集群 🙏](https://franciscocarloserra.github.io/open-swarm-security/img/problem.png)
*黄仁勋谈失控的智能体集群 🙏*

我假设 **任何足够先进的模型最终都能轻易绕过这些控制**。这个方案的意义在于尽量减少对现实世界的直接影响，并尽可能多地收集失控上下文的数据。

这些控制没有一个单独就足以防止事故，但沿着正确的维度叠加起来，应该能降低概率。

**即将到来：集群与集群之间的交互**

当智能体集群开始彼此交互时会发生什么？当它们开始自主控制资源、相互谈判、试图夺取彼此的算力……

## 10. 行动呼吁

**实验室**
- 公开原始事故数据
- 公开集群实现，作为参考并供审计
- 开放 CoT，收益远大于护城河
- 开源 harness 代码，我们知道你们在收集遥测数据，WDGAF
- 别再用 --yolo 跑安全基准测试

**用户**
- 从实验室公开的少量事故细节中学习，避免自己的运行炸掉
- 公开讨论工程方法
- 分享实验结果和数据集
- 分享参考实现

**监管者**
- 我不搞政策

## 11. 来源

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

## 12. 免责声明

不提供任何形式的保证，实施风险自负。

[Francisco Carlos Erra](https://github.com/franciscocarloserra) · [联系](https://forms.gle/jmzs1QfNfDbSu6Ue7) · [X](https://x.com/francarloerra) · 2026年10月

我是个重度 AI 用户，已经给 LLM 发了约 10 万条消息。
背景是 Linux、网络安全、基础设施和开发。
