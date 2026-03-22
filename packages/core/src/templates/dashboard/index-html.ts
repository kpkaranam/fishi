export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FISHI Agent Dashboard</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #0a0a0f;
      color: #e2e8f0;
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
      min-height: 100vh;
    }

    /* ── Header ── */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 24px;
      background: #12121a;
      border-bottom: 1px solid #1e1e2e;
    }
    header h1 { font-size: 18px; color: #06b6d4; letter-spacing: 0.05em; }
    .status-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #22c55e;
      display: inline-block;
      margin-right: 8px;
      animation: pulse 2s infinite;
    }
    .status-dot.offline { background: #ef4444; animation: none; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .last-updated { color: #6b7280; font-size: 12px; }

    /* ── Layout ── */
    main { padding: 20px 24px; }

    /* ── Stat cards ── */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    @media (max-width: 900px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
    .card {
      background: #12121a;
      border: 1px solid #1e1e2e;
      border-radius: 8px;
      padding: 16px;
    }
    .card-label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
    .card-value { font-size: 28px; color: #06b6d4; font-weight: bold; }

    /* ── Phase bar ── */
    .phase-section { margin-bottom: 20px; }
    .phase-bar {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      background: #12121a;
      border: 1px solid #1e1e2e;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .phase-pill {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      color: #6b7280;
      border: 1px solid #2d2d3d;
      background: #0a0a0f;
    }
    .phase-pill.done { color: #22c55e; border-color: #22c55e; background: rgba(34,197,94,0.08); }
    .phase-pill.active { color: #06b6d4; border-color: #06b6d4; background: rgba(6,182,212,0.12); font-weight: bold; }
    .phase-arrow { color: #2d2d3d; align-self: center; }

    /* ── Main grid ── */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    @media (max-width: 800px) { .main-grid { grid-template-columns: 1fr; } }

    .panel {
      background: #12121a;
      border: 1px solid #1e1e2e;
      border-radius: 8px;
      padding: 16px;
    }
    .panel-title {
      color: #94a3b8;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 12px;
      border-bottom: 1px solid #1e1e2e;
      padding-bottom: 8px;
    }

    /* ── Events ── */
    .event-row {
      display: flex;
      gap: 10px;
      padding: 5px 0;
      border-bottom: 1px solid #1a1a28;
      font-size: 12px;
    }
    .event-row:last-child { border-bottom: none; }
    .event-ts { color: #4b5563; min-width: 80px; }
    .event-type { color: #06b6d4; min-width: 130px; }
    .event-agent { color: #a78bfa; }
    .empty-msg { color: #4b5563; font-style: italic; }

    /* ── Agent activity ── */
    .agent-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #1a1a28;
      font-size: 12px;
    }
    .agent-row:last-child { border-bottom: none; }
    .agent-name { color: #a78bfa; }
    .agent-stats { color: #6b7280; display: flex; gap: 12px; }
    .stat-ok { color: #22c55e; }
    .stat-fail { color: #ef4444; }
    .stat-files { color: #06b6d4; }

    /* ── Bottom row ── */
    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 900px) { .bottom-grid { grid-template-columns: 1fr; } }

    /* ── KV table ── */
    .kv-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid #1a1a28;
      font-size: 12px;
    }
    .kv-row:last-child { border-bottom: none; }
    .kv-key { color: #fbbf24; }
    .kv-val { color: #06b6d4; }

    /* ── Gates ── */
    .gate-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      font-size: 12px;
      border-bottom: 1px solid #1a1a28;
    }
    .gate-row:last-child { border-bottom: none; }
    .gate-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .gate-dot.passed { background: #22c55e; }
    .gate-dot.failed { background: #ef4444; }
    .gate-dot.pending { background: #f59e0b; }
    .gate-name { color: #e2e8f0; flex: 1; }
    .gate-status { font-size: 11px; }
    .gate-status.passed { color: #22c55e; }
    .gate-status.failed { color: #ef4444; }
    .gate-status.pending { color: #f59e0b; }
  </style>
</head>
<body>
  <header>
    <h1><span class="status-dot" id="statusDot"></span>FISHI Agent Dashboard</h1>
    <span class="last-updated" id="lastUpdated">Loading...</span>
  </header>
  <main>
    <!-- Stat cards -->
    <div class="stat-grid">
      <div class="card"><div class="card-label">Total Events</div><div class="card-value" id="statEvents">—</div></div>
      <div class="card"><div class="card-label">Gates Passed</div><div class="card-value" id="statGates">—</div></div>
      <div class="card"><div class="card-label">Checkpoints</div><div class="card-value" id="statCheckpoints">—</div></div>
      <div class="card"><div class="card-label">Agent Completions</div><div class="card-value" id="statCompletions">—</div></div>
    </div>

    <!-- Phase bar -->
    <div class="phase-section">
      <div class="phase-bar" id="phaseBar">Loading phases...</div>
    </div>

    <!-- Main grid -->
    <div class="main-grid">
      <div class="panel">
        <div class="panel-title">Recent Events</div>
        <div id="eventsPanel"><span class="empty-msg">No events yet.</span></div>
      </div>
      <div class="panel">
        <div class="panel-title">Agent Activity</div>
        <div id="agentsPanel"><span class="empty-msg">No agent activity yet.</span></div>
      </div>
    </div>

    <!-- Bottom row -->
    <div class="bottom-grid">
      <div class="panel">
        <div class="panel-title">Checkpoints</div>
        <div id="checkpointsPanel"><span class="empty-msg">No checkpoints.</span></div>
      </div>
      <div class="panel">
        <div class="panel-title">TaskBoard</div>
        <div id="taskboardPanel"><span class="empty-msg">No tasks.</span></div>
      </div>
      <div class="panel">
        <div class="panel-title">Gates</div>
        <div id="gatesPanel"><span class="empty-msg">No gates.</span></div>
      </div>
    </div>
  </main>

  <script>
    const PHASES = ['init', 'discovery', 'prd', 'architecture', 'sprint_planning', 'development', 'deployment', 'deployed'];

    function fmt(n) {
      if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
      if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
      return String(n);
    }

    function fmtTime(iso) {
      try { return new Date(iso).toLocaleTimeString(); } catch { return iso; }
    }

    function renderPhase(currentPhase) {
      const idx = PHASES.indexOf(currentPhase);
      const bar = document.getElementById('phaseBar');
      let html = '';
      PHASES.forEach((p, i) => {
        if (i > 0) html += '<span class="phase-arrow">&#8594;</span>';
        const cls = i < idx ? 'done' : i === idx ? 'active' : '';
        html += \`<span class="phase-pill \${cls}">\${p}</span>\`;
      });
      bar.innerHTML = html;
    }

    function renderEvents(events) {
      const panel = document.getElementById('eventsPanel');
      const recent = events.slice(-10).reverse();
      if (!recent.length) { panel.innerHTML = '<span class="empty-msg">No events yet.</span>'; return; }
      panel.innerHTML = recent.map(ev =>
        \`<div class="event-row">
          <span class="event-ts">\${fmtTime(ev.timestamp)}</span>
          <span class="event-type">\${ev.type}</span>
          <span class="event-agent">\${ev.agent}</span>
        </div>\`
      ).join('');
    }

    function renderAgents(agentSummary) {
      const panel = document.getElementById('agentsPanel');
      const entries = Object.entries(agentSummary);
      if (!entries.length) { panel.innerHTML = '<span class="empty-msg">No agent activity yet.</span>'; return; }
      entries.sort((a, b) => b[1].completions - a[1].completions);
      panel.innerHTML = entries.map(([name, s]) =>
        \`<div class="agent-row">
          <span class="agent-name">\${name}</span>
          <span class="agent-stats">
            <span class="stat-ok">&#10003; \${s.completions}</span>
            <span class="stat-fail">\${s.failures > 0 ? '&#10007; ' + s.failures : ''}</span>
            <span class="stat-files">&#128196; \${s.filesChanged}</span>
          </span>
        </div>\`
      ).join('');
    }

    function renderCheckpoints(events) {
      const panel = document.getElementById('checkpointsPanel');
      const checkpoints = events.filter(e => e.type === 'checkpoint.created').slice(-5).reverse();
      if (!checkpoints.length) { panel.innerHTML = '<span class="empty-msg">No checkpoints.</span>'; return; }
      panel.innerHTML = checkpoints.map(c =>
        \`<div class="kv-row">
          <span class="kv-key">#\${c.data?.checkpointId || '?'} — \${c.data?.phase || 'unknown'}</span>
          <span class="kv-val">\${fmtTime(c.timestamp)}</span>
        </div>\`
      ).join('');
    }

    function renderTaskboard(events) {
      const panel = document.getElementById('taskboardPanel');
      // Get latest checkpoint with taskCounts
      const withCounts = events.filter(e => e.data?.taskCounts).reverse();
      if (!withCounts.length) { panel.innerHTML = '<span class="empty-msg">No task data.</span>'; return; }
      const tc = withCounts[0].data.taskCounts;
      const cols = [
        { name: 'Backlog', count: tc.backlog || 0, color: '#6b7280' },
        { name: 'Ready', count: tc.ready || 0, color: '#f59e0b' },
        { name: 'In Progress', count: tc.inProgress || 0, color: '#3b82f6' },
        { name: 'Review', count: tc.review || 0, color: '#a855f7' },
        { name: 'Done', count: tc.done || 0, color: '#22c55e' },
      ];
      panel.innerHTML = cols.map(c =>
        \`<div class="kv-row">
          <span class="kv-key" style="color:\${c.color}">\${c.name}</span>
          <span class="kv-val">\${c.count}</span>
        </div>\`
      ).join('');
    }

    function renderGates(gates) {
      const panel = document.getElementById('gatesPanel');
      if (!gates || !gates.length) { panel.innerHTML = '<span class="empty-msg">No gates.</span>'; return; }
      panel.innerHTML = gates.map(g => {
        const cls = g.status === 'approved' ? 'passed' : g.status === 'rejected' ? 'failed' : g.status === 'skipped' ? 'pending' : 'pending';
        const label = g.phase || g.name || 'unknown';
        return \`<div class="gate-row">
          <span class="gate-dot \${cls}"></span>
          <span class="gate-name">\${label}</span>
          <span class="gate-status \${cls}">\${g.status}</span>
        </div>\`;
      }).join('');
    }

    async function fetchAndRender() {
      const dot = document.getElementById('statusDot');
      const lu = document.getElementById('lastUpdated');
      try {
        const res = await fetch('/api/state');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        dot.classList.remove('offline');

        const s = data.summary || {};
        const events = data.events || [];
        const gates = data.gates || [];

        // Stat cards
        document.getElementById('statEvents').textContent = fmt(events.length);
        document.getElementById('statGates').textContent = fmt(gates.filter(g => g.status === 'approved').length);
        document.getElementById('statCheckpoints').textContent = fmt(events.filter(e => e.type === 'checkpoint.created').length);
        document.getElementById('statCompletions').textContent = fmt(s.totalAgentCompletions || 0);

        renderPhase(data.phase || 'init');
        renderEvents(events);
        renderAgents(data.agentSummary || {});
        renderCheckpoints(events);
        renderTaskboard(events);
        renderGates(gates);

        lu.textContent = 'Updated: ' + new Date().toLocaleTimeString();
      } catch (err) {
        dot.classList.add('offline');
        lu.textContent = 'Error: ' + err.message;
      }
    }

    fetchAndRender();
    setInterval(fetchAndRender, 2000);
  </script>
</body>
</html>`;
}
