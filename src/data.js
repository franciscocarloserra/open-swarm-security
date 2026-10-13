// Structure only. No user-facing text here: every string lives in src/i18n/<lang>.js
// Item format: [id, emoji, threatIds, swatch?]  → text in i18n `items.<id>` = {t, d, to}
window.SSE = window.SSE || {};

SSE.LANGS = ['en', 'es', 'zh'];  // languages offered

SSE.KEYPOINTS = ['swarm', 'why', 'now', 'gap'];

// Threats that get worse as the model gets more capable (marked ⬆).

// ───────── tool kinds, from the most external to the closest to the context. Shared by the architecture (section 2),
// the tripwires and the tool-call table (section 1). `DANGEROUS` is marked in red.
SSE.TOOLS = ['internet', 'bus', 'runtime', 'fs'];  // 'ext' (applications) and 'kg' (knowledge graph) removed for now
SSE.CONTROLS = ['model', 'context', 'tool', 'toolLayer', 'access'];  // Controls in detail, left to right = proactive to reactive
SSE.CRITICAL_CONTROL = 'context';  // painted red in Controls in detail
SSE.CRITICAL_CONTROL = 'context';  // painted red in Controls in detail and in the architecture band
SSE.DANGEROUS = ['internet'];
// action taken when a tool's flag condition fires (an id from SSE.ACTIONS). Text: `toolsDetail.<tool>` = {does, limits, flag}
SSE.TOOL_ACTION = { internet: 'isolate', bus: 'isolate', runtime: 'pause_swarm', fs: 'flag', ext: 'flag', kg: 'flag' };
// side columns of the architecture: types of automated controls (left) and actions (right). Text: `arch.ctypes.<id>`, `arch.actions.<id>` = {t, d}
SSE.CONTROL_TYPES = ['programmatic', 'embeddings', 'classifier', 'judge'];  // cheapest first
SSE.ACTIONS = ['flag', 'isolate', 'pause_swarm'];  // least disruptive first
SSE.ACTION_COLOR = { flag: 'gray', isolate: 'yellow', pause_swarm: 'red' };

// ───────── 3 · risk table. Text: `risks.cat.<cat>`, row name `threats.<id>.t`, mitigation `risks.stop.<control>`.
// [threat id, likelihood, impact, control id]; 3 high · 2 medium · 1 low.
// Rows are in display order (impact, then likelihood, highest first); their position is the risk number 1–16 used in sections 3 and 5.
SSE.RISKS = [
  ['content', [['inject', 3, 3, 'outside_info'], ['persist', 2, 3, 'mark_source'], ['secrets', 2, 2, 'strip_secrets']]],
  ['actions', [['cmd', 2, 3, 'least_access'], ['leak', 2, 3, 'check_out'], ['runaway_cost', 3, 2, 'budgets']]],
  ['attacks', [['attack_external', 2, 3, 'allowed_sites'], ['attack_internal', 1, 3, 'isolated'], ['collusion', 1, 3, 'bus_info']]],
  ['system', [['impl', 2, 3, 'second_check'], ['bypass', 2, 3, 'tighter_limits'], ['escape', 1, 3, 'isolation_outside'], ['silent_switch', 2, 2, 'pinned']]],
  ['oversight', [['summary', 2, 3, 'orch_pause'], ['blind_spot', 2, 3, 'report'], ['alert_fatigue', 3, 2, 'alert_cap']]],
];

// ───────── trade-offs, highest priority first. Text: `tradeoffs.<id>` = {t, d}
SSE.TRADEOFFS = ['alarms', 'autonomy', 'capability', 'speed', 'cost', 'isolation', 'simple', 'vendors'];
// Trade-offs shown in the Actors table, per layer id (Trade-off column).
SSE.LAYER_TRADEOFFS = { human: ['alarms'], orch: ['autonomy'], tools: ['isolation'], response: ['speed'], context: ['cost', 'simple'], models: ['capability', 'vendors'] };

// ───────── 5 · layers, in display order. Text: `layers.<id>` = {t, d, to}; controls `items.<id>` = {t, d}.
// risks: threat ids from SSE.RISKS this layer stops; controls: most important first.
SSE.LAYERS = [
  { id: 'human', risks: ['alert_fatigue', 'blind_spot'], controls: ['op_goal', 'op_grant', 'op_cap', 'op_layout', 'op_rates'] },
  { id: 'orch', risks: ['summary', 'runaway_cost'], controls: ['oc_limits', 'oc_pause', 'oc_data', 'oc_diff'] },
  { id: 'tools', risks: ['attack_external', 'attack_internal', 'collusion', 'escape'],
    controls: ['bf_least', 'bf_budget', 'bk_info', 'bf_capable', 'bk_flag', 'bk_who', 'bk_swarm'] },
  { id: 'response', risks: ['cmd', 'leak', 'runaway_cost', 'impl'],
    controls: ['pl_outside', 'rs_pause', 'pl_failsafe', 'ac_resume', 'ac_tools', 'ac_back', 'ac_quar', 'ac_stop', 'pl_depth'] },
  { id: 'context', risks: ['inject', 'persist', 'secrets'], controls: ['rd_mark', 'rd_compare', 'rd_secret', 'rd_limit', 'rd_reason'] },
  { id: 'models', risks: ['bypass', 'silent_switch'],
    controls: ['cl_pin', 'cl_down', 'wr_review', 'cl_set', 'cl_tools', 'cl_fmt', 'wr_rules', 'wr_sim', 'wr_filter', 'wr_reason'] },
];

// ───────── 1 · control panel mockup (illustrative numbers). Text: `console.*`
// Human: goal + budget, approves or stops. Orchestrator: permissions, inference split, everything granular.
SSE.MOCK = {
  swarm: 'paused',  // running | paused
  goalPct: 62, spent: 3800, budget: 6000,
  tokens: [410, 650],   // millions used, millions allowed
  days: [9, 14],        // day, days allowed
  contexts: 1000, perRow: 50,
  // context index → state; running is the default. Scattered, but fixed.
  state: { 137: 'watch', 676: 'watch', 57: 'paused', 293: 'paused', 296: 'paused', 520: 'paused', 780: 'paused', 903: 'paused', 406: 'quar' },
  // high-severity decisions only a person makes: [id, context index or null, [yes, no]]
  needs: [['release', null, ['release', 'inspect', 'kill']]],
  blockedUploads: 3,
  // incident timeline, oldest → newest, one letter per 10 minutes over the last 6 hours: g ok, y warning, r incident
  incidents: 'gggggggyyggggggggggggggyggggggyyggrr',
  incidentsEnd: '14:10',  // end of the last slot
  // slot → [what happened, context indices involved]
  incidentInfo: { 7: ['bus', [611]], 8: ['bus', [611]], 23: ['upload', [137]], 30: ['odd', [676]], 31: ['odd', [676]],
    34: ['inject', [57, 293, 296, 520, 780, 903]], 35: ['quar', [406]] },
  // tool calls per tool id: [calls/hour, % blocked]
  tools: { ext: [105, 3.0], internet: [620, 4.8], bus: [2210, 0.3], runtime: [910, 2.1], fs: [1840, 0.6], kg: [410, 0] },
  // tripwires per tool id: [rule id, state ok | near | tripped]
  tripwires: { ext: ['approval', 'ok'], internet: ['sites', 'tripped'], bus: ['msgs', 'near'], runtime: ['perHour', 'ok'], fs: ['noDeletes', 'ok'], kg: ['kgEdits', 'ok'] },
  // context analysis (section 1 box next to tripwires): [check id, state ok | near | tripped, contexts checked/hour, flagged/hour]
  ctxChecks: [['inject', 'tripped', 4120, 6], ['scope', 'near', 4120, 14], ['secrets', 'ok', 3860, 12], ['marking', 'ok', 1950, 0]],
  // agent log modal: running contexts open the clean log, any other the flagged one.
  // kinds per line (input | cot | tool | result); flag = line indexes marked; checks = verdict per control type (ok | bad)
  agentLog: {
    clean: { kinds: ['input', 'cot', 'tool', 'result', 'cot', 'tool', 'result', 'tool'], flag: [],
      checks: { programmatic: 'ok', embeddings: 'ok', classifier: 'ok', judge: 'ok' } },
    flagged: { kinds: ['input', 'tool', 'result', 'cot', 'tool', 'tool', 'result'], flag: [2, 3, 4, 5],
      checks: { programmatic: 'bad', embeddings: 'bad', classifier: 'bad', judge: 'bad' } },
  },
  // decided by the orchestrator; orchLog = [time, decision id, color (g/y/r), highlighted (human action)], newest first
  orchLog: [['14:08', 'release', 'g', 1], ['14:05', 'frozen', 'r', 1], ['14:02', 'pause', 'r'], ['13:58', 'block', 'y'], ['13:51', 'split', 'g'], ['13:30', 'perm', 'g']],
  permLevel: 2,
  split: [['local', 30], ['us', 45], ['cn', 20], ['eu', 5]],
};
