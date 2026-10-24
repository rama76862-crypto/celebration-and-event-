/**
 * Celebration & Event Planner - Accessible Frontend
 * WAI-ARIA tabs, safe DOM creation (no innerHTML), localStorage persistence.
 */
const state = { currentPlan: null, completedTasks: new Set(), vendorStatuses: {} };
const $ = (id) => document.getElementById(id);

const els = {
    form: $('event-form'), loading: $('loading-state'), error: $('error-state'),
    errMsg: $('error-message'), errList: $('error-list'), results: $('results-section'),
    subTitle: $('results-subtitle'), warnings: $('plan-warnings'), warnList: $('warnings-list'),
    apiBadge: $('api-status-badge'), announcer: $('aria-announcer'),
    tabs: Array.from(document.querySelectorAll('[role="tab"]')),
    tabpanels: Array.from(document.querySelectorAll('[role="tabpanel"]')),
    priorities: $('priorities-cluster'), prioCount: $('priority-count'),
    notes: $('event-notes'), notesCount: $('notes-char-count'),
};

const el = (tag, cls = '', text = '') => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
};

const announce = (msg) => { if (els.announcer) els.announcer.textContent = msg; };

// Persistence
function loadStorage() {
    try {
        const t = localStorage.getItem('cep_tasks');
        if (t) state.completedTasks = new Set(JSON.parse(t));
        const v = localStorage.getItem('cep_vendors');
        if (v) state.vendorStatuses = JSON.parse(v);
    } catch {}
}

function saveStorage() {
    try {
        localStorage.setItem('cep_tasks', JSON.stringify([...state.completedTasks]));
        localStorage.setItem('cep_vendors', JSON.stringify(state.vendorStatuses));
    } catch {}
}

// Health Check
async function checkHealth() {
    try {
        const res = await fetch('/health');
        if (res.ok) { els.apiBadge.textContent = 'System Ready'; els.apiBadge.classList.add('ok'); }
        else els.apiBadge.textContent = 'Service Degraded';
    } catch { els.apiBadge.textContent = 'Offline'; }
}

// Validation & Form Collection
function validateForm() {
    let valid = true;
    const f = els.form;
    const setErr = (id, inputId, msg) => {
        const node = $(id);
        const input = $(inputId);
        if (node) node.textContent = msg;
        if (input) {
            if (msg) {
                input.setAttribute('aria-invalid', 'true');
            } else {
                input.removeAttribute('aria-invalid');
            }
        }
        if (msg) valid = false;
    };

    setErr('title-error', 'event-title', !f.title.value.trim() ? 'Title is required (1-100 chars).' : '');
    const g = parseInt(f.guest_count.value, 10);
    setErr('guest-error', 'guest-count', isNaN(g) || g < 1 || g > 1000 ? 'Guest count must be 1-1,000.' : '');
    const b = parseFloat(f.total_budget.value);
    setErr('budget-error', 'total-budget', isNaN(b) || b <= 0 || b > 10000000 ? 'Budget must be > 0 and <= 10,000,000.' : '');

    if (!f.event_date.value) {
        setErr('date-error', 'event-date', 'Please choose a future date.');
    } else {
        const d = new Date(f.event_date.value + 'T00:00:00');
        const today = new Date(); today.setHours(0,0,0,0);
        setErr('date-error', 'event-date', d <= today ? 'Event date must be in the future.' : '');
    }
    setErr('loc-error', 'event-location', !f.location.value.trim() ? 'Location is required.' : '');
    return valid;
}

function collectData() {
    const f = els.form;
    const diets = Array.from(f.querySelectorAll('input[name="dietary"]:checked')).map(c => c.value);
    const prios = Array.from(f.querySelectorAll('input[name="priorities"]:checked')).map(c => c.value);
    return {
        event_type: f.event_type.value,
        title: f.title.value.trim(),
        guest_count: parseInt(f.guest_count.value, 10),
        total_budget: parseFloat(f.total_budget.value),
        currency: f.currency.value,
        event_date: f.event_date.value,
        location: f.location.value.trim(),
        city_tier: f.city_tier.value || null,
        preferences: {
            theme: f.theme.value.trim() || null,
            dietary: diets,
            indoor_outdoor: f.indoor_outdoor.value,
            priorities: prios.slice(0, 3),
            age_group: f.age_group.value || null,
            notes: f.notes.value.trim() || null,
        },
    };
}

async function handlePlanSubmit(e) {
    e.preventDefault();
    if (!validateForm()) { announce('Please correct the highlighted form errors.'); return; }

    els.loading.classList.remove('hidden');
    els.error.classList.add('hidden');
    els.results.classList.add('hidden');
    announce('Generating event plan...');

    try {
        const res = await fetch('/api/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(collectData()),
        });
        if (!res.ok) throw await res.json();
        const plan = await res.json();
        state.currentPlan = plan;
        renderPlan(plan);
        els.loading.classList.add('hidden');
        els.results.classList.remove('hidden');
        announce('Event plan generated. Results are displayed.');
        els.results.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        els.loading.classList.add('hidden');
        els.error.classList.remove('hidden');
        els.errList.replaceChildren();
        if (err.errors && Array.isArray(err.errors)) {
            els.errMsg.textContent = 'Validation error:';
            err.errors.forEach(m => els.errList.appendChild(el('li', '', String(m))));
        } else {
            els.errMsg.textContent = err.detail || 'Failed to generate plan. Please try again.';
        }
        announce('Error: ' + els.errMsg.textContent);
    }
}

// Rendering
function renderPlan(plan) {
    const { request, budget, timeline, vendors, ideas } = plan;
    els.subTitle.textContent = `${request.title} | ${request.location} | Date: ${request.event_date}`;

    // Warnings
    const allWarnings = budget.warnings.concat(timeline.warnings);
    els.warnList.replaceChildren();
    if (allWarnings.length > 0) {
        allWarnings.forEach(w => els.warnList.appendChild(el('li', '', w)));
        els.warnings.classList.remove('hidden');
    } else {
        els.warnings.classList.add('hidden');
    }

    // Populate Replan form controls
    if ($('replan-budget')) $('replan-budget').value = request.total_budget;
    if ($('replan-guests')) $('replan-guests').value = request.guest_count;
    if ($('replan-date')) $('replan-date').value = request.event_date;

    renderOverview(plan);
    renderBudget(budget);
    renderTimeline(timeline);
    renderVendors(vendors);
    renderIdeas(ideas);
}

function renderOverview(plan) {
    const { request, budget, timeline } = plan;
    const box = $('overview-metrics'); box.replaceChildren();
    const metrics = [
        ['Type', request.event_type.toUpperCase()],
        ['Guests', request.guest_count.toLocaleString()],
        ['Total Budget', `${budget.currency} ${budget.total_budget.toLocaleString()}`],
        ['Per Guest', `${budget.currency} ${budget.per_guest_cost.toLocaleString()}`],
        ['Days Left', `${timeline.days_remaining} Days`],
        ['Mode', timeline.is_compressed ? 'Compressed' : 'Standard'],
    ];
    metrics.forEach(([label, value]) => {
        const c = el('div', 'metric-card');
        c.appendChild(el('div', 'metric-label', label));
        c.appendChild(el('div', 'metric-value', value));
        box.appendChild(c);
    });

    const tips = $('overview-tips'); tips.replaceChildren();
    budget.money_saving_tips.forEach(t => tips.appendChild(el('li', '', t)));
}

function renderBudget(budget) {
    const tbody = $('budget-tbody'); const tfoot = $('budget-tfoot');
    const bars = $('budget-bars-container');
    tbody.replaceChildren(); tfoot.replaceChildren(); bars.replaceChildren();

    budget.categories.forEach(c => {
        const tr = el('tr');
        tr.appendChild(el('td', '', c.name));
        tr.appendChild(el('td', '', `${c.percentage.toFixed(1)}%`));
        tr.appendChild(el('td', '', `${budget.currency} ${c.amount.toLocaleString()}`));
        tr.appendChild(el('td', '', c.reasoning));
        tbody.appendChild(tr);

        const row = el('div', 'budget-bar-row');
        const lrow = el('div', 'budget-bar-label-row');
        lrow.appendChild(el('span', '', `${c.name} (${c.percentage.toFixed(1)}%)`));
        lrow.appendChild(el('span', '', `${budget.currency} ${c.amount.toLocaleString()}`));
        const track = el('div', 'budget-bar-track');
        const fill = el('div', 'budget-bar-fill');
        fill.style.width = `${Math.min(100, Math.max(1, c.percentage))}%`;
        track.appendChild(fill);
        row.appendChild(lrow); row.appendChild(track);
        bars.appendChild(row);
    });

    const ftr = el('tr');
    ftr.appendChild(el('th', '', 'Total Allocated'));
    ftr.appendChild(el('td', '', '100.0%'));
    ftr.appendChild(el('td', '', `${budget.currency} ${budget.total_budget.toLocaleString()}`));
    ftr.appendChild(el('td', '', 'Contextually optimized'));
    tfoot.appendChild(ftr);
}

function renderTimeline(timeline) {
    $('timeline-countdown-badge').textContent = `${timeline.days_remaining} Days Left`;
    const stack = $('timeline-phases-container'); stack.replaceChildren();

    const byPhase = {};
    timeline.tasks.forEach(t => { (byPhase[t.phase] = byPhase[t.phase] || []).push(t); });

    timeline.phases.forEach(phase => {
        const tasks = byPhase[phase] || [];
        if (!tasks.length) return;
        const grp = el('div', 'phase-group');
        const h = el('div', 'phase-heading');
        h.appendChild(el('span', '', phase));
        h.appendChild(el('span', 'badge', `${tasks.length} tasks`));
        grp.appendChild(h);

        const ul = el('ul', 'task-list');
        tasks.forEach(task => {
            const li = el('li', 'task-item');
            if (state.completedTasks.has(task.id)) li.classList.add('completed');

            const left = el('div', 'task-left');
            const cb = el('input', 'task-checkbox');
            cb.type = 'checkbox';
            cb.checked = state.completedTasks.has(task.id);
            cb.setAttribute('aria-label', `Complete: ${task.title}`);
            cb.addEventListener('change', () => {
                if (cb.checked) { state.completedTasks.add(task.id); li.classList.add('completed'); }
                else { state.completedTasks.delete(task.id); li.classList.remove('completed'); }
                saveStorage();
                updateProgress(timeline.tasks.length);
            });

            const textWrap = el('div');
            textWrap.appendChild(el('div', 'task-title', task.title));
            textWrap.appendChild(el('small', 'form-help', `Due: ${task.due_date} | ${task.category}`));
            left.appendChild(cb); left.appendChild(textWrap);

            li.appendChild(left);
            li.appendChild(el('span', `task-priority-badge ${task.priority}`, task.priority));
            ul.appendChild(li);
        });
        grp.appendChild(ul);
        stack.appendChild(grp);
    });

    updateProgress(timeline.tasks.length);

    // Run of Show
    const ros = $('run-of-show-tbody'); ros.replaceChildren();
    timeline.run_of_show.forEach(i => {
        const r = el('tr');
        r.appendChild(el('td', '', i.time_offset));
        r.appendChild(el('td', '', i.activity));
        r.appendChild(el('td', '', i.details));
        ros.appendChild(r);
    });
}

function updateProgress(total) {
    if (!total) return;
    const completed = [...state.completedTasks].filter(id => state.currentPlan?.timeline?.tasks?.some(t => t.id === id)).length;
    const pct = Math.round((completed / total) * 100);
    const txt = $('timeline-progress-text'); const fill = $('timeline-progress-fill');
    if (txt) txt.textContent = `${completed} / ${total} tasks completed (${pct}%)`;
    if (fill) fill.style.width = `${pct}%`;
}

function renderVendors(vendorsData) {
    const box = $('vendors-list-container'); box.replaceChildren();
    vendorsData.vendors.forEach((v, idx) => {
        const d = el('details', 'vendor-details');
        if (idx === 0) d.open = true;

        const sum = el('summary', 'vendor-summary');
        sum.appendChild(el('span', '', v.vendor_type));
        const rgt = el('div', 'vendor-summary-right');
        rgt.appendChild(el('span', 'badge', `Budget: ${v.budget_allocated ? v.budget_allocated.toLocaleString() : 'Shared'}`));
        sum.appendChild(rgt);
        d.appendChild(sum);

        const body = el('div', 'vendor-body');
        body.appendChild(el('p', 'section-desc', v.why_needed));

        // Outreach status selector
        const sWrap = el('div', 'form-group');
        sWrap.style.maxWidth = '250px'; sWrap.style.marginBottom = '1rem';
        sWrap.appendChild(el('label', '', 'Status:'));
        const sel = el('select', 'vendor-status-select');
        [
            ['not_started', 'Not Started'], ['contacted', 'Contacted'],
            ['quoted', 'Quote Received'], ['booked', 'Booked & Confirmed']
        ].forEach(([val, lbl]) => {
            const opt = el('option', '', lbl);
            opt.value = val;
            if (state.vendorStatuses[v.vendor_type] === val) opt.selected = true;
            sel.appendChild(opt);
        });
        sel.addEventListener('change', () => {
            state.vendorStatuses[v.vendor_type] = sel.value;
            saveStorage();
        });
        sWrap.appendChild(sel);
        body.appendChild(sWrap);

        const addSection = (title, items) => {
            body.appendChild(el('h4', '', title));
            const ul = el('ul', 'bullet-list');
            items.forEach(i => ul.appendChild(el('li', '', i)));
            body.appendChild(ul);
        };
        addSection('Key Questions to Ask:', v.questions_to_ask);
        addSection('Red Flags to Watch For:', v.red_flags);
        addSection('Documents to Collect:', v.documents_to_get);

        d.appendChild(body);
        box.appendChild(d);
    });

    const skBox = $('skipped-vendors-container');
    const skList = $('skipped-vendors-list');
    skList.replaceChildren();
    if (vendorsData.skipped_vendors && vendorsData.skipped_vendors.length > 0) {
        vendorsData.skipped_vendors.forEach(sv => {
            const li = el('li');
            li.appendChild(el('strong', '', `${sv.vendor_type}: `));
            li.appendChild(el('span', '', sv.reason));
            skList.appendChild(li);
        });
        skBox.classList.remove('hidden');
    } else {
        skBox.classList.add('hidden');
    }
}

function renderIdeas(ideas) {
    const badge = $('ideas-source-badge');
    badge.textContent = ideas.source === 'ai' ? 'AI-Generated Ideas' : 'Curated Suggestions';
    badge.className = ideas.source === 'ai' ? 'badge ok' : 'badge';

    const grid = $('ideas-grid'); grid.replaceChildren();
    [
        ['🎨 Theme Concepts', ideas.theme_ideas],
        ['✨ Decor & Ambiance', ideas.decor_ideas],
        ['🍽️ Menu & Food', ideas.food_menu_ideas],
        ['🎉 Activities & Fun', ideas.activities],
        ['🎁 Return Gifts', ideas.return_gift_ideas],
        ['💡 Budget Hacks', ideas.budget_hacks],
    ].forEach(([title, items]) => {
        const card = el('div', 'idea-card');
        card.appendChild(el('div', 'idea-card-header', title));
        const ul = el('ul', 'bullet-list');
        items.forEach(i => ul.appendChild(el('li', '', i)));
        card.appendChild(ul);
        grid.appendChild(card);
    });
}

// Tabs & Navigation (WAI-ARIA)
function setupTabs() {
    els.tabs.forEach((tab, idx) => {
        tab.addEventListener('click', () => switchTab(tab));
        tab.addEventListener('keydown', (e) => {
            let next = null;
            if (e.key === 'ArrowRight') next = els.tabs[(idx + 1) % els.tabs.length];
            else if (e.key === 'ArrowLeft') next = els.tabs[(idx - 1 + els.tabs.length) % els.tabs.length];
            else if (e.key === 'Home') next = els.tabs[0];
            else if (e.key === 'End') next = els.tabs[els.tabs.length - 1];
            if (next) { e.preventDefault(); next.focus(); switchTab(next); }
        });
    });
}

function switchTab(active) {
    els.tabs.forEach(t => {
        const is = t === active;
        t.setAttribute('aria-selected', is ? 'true' : 'false');
        t.setAttribute('tabindex', is ? '0' : '-1');
    });
    const panelId = active.getAttribute('aria-controls');
    els.tabpanels.forEach(p => {
        p.classList.toggle('hidden', p.id !== panelId);
    });
    announce(`Switched to ${active.textContent.trim()} tab.`);
}

async function handleReplanSubmit(e) {
    e.preventDefault();
    if (!state.currentPlan) return;

    const newBudget = parseFloat($('replan-budget').value);
    const newGuests = parseInt($('replan-guests').value, 10);
    const newDate = $('replan-date').value;

    announce('Re-calculating plan...');
    try {
        const res = await fetch('/api/replan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                original_request: state.currentPlan.request,
                new_budget: isNaN(newBudget) ? null : newBudget,
                new_guest_count: isNaN(newGuests) ? null : newGuests,
                new_event_date: newDate || null,
            }),
        });
        if (!res.ok) throw await res.json();
        const data = await res.json();
        state.currentPlan = data.new_plan;
        renderPlan(data.new_plan);

        // Render Diff
        const diffBox = $('replan-diff-container');
        const badgeBox = $('diff-summary-badges');
        const list = $('diff-details-list');
        badgeBox.replaceChildren(); list.replaceChildren();

        data.diff.summary.forEach(s => badgeBox.appendChild(el('span', 'diff-badge', s)));
        data.diff.budget_changes.forEach(c => {
            const sign = c.amount_change > 0 ? '+' : '';
            list.appendChild(el('li', '', `${c.category}: ${sign}${c.amount_change.toLocaleString()} (${c.percentage_change > 0 ? '+' : ''}${c.percentage_change.toFixed(1)}%)`));
        });
        data.diff.timeline_changes.forEach(tc => list.appendChild(el('li', '', tc)));
        diffBox.classList.remove('hidden');

        announce(`Re-planned successfully: ${data.diff.summary.join(', ')}`);
    } catch (err) {
        announce('Re-plan error: ' + (err.detail || 'Unable to recalculate.'));
    }
}

// Lifecycle Init
document.addEventListener('DOMContentLoaded', () => {
    loadStorage();
    checkHealth();
    setupTabs();

    if (els.form) els.form.addEventListener('submit', handlePlanSubmit);
    if ($('replan-form')) $('replan-form').addEventListener('submit', handleReplanSubmit);
    if ($('dismiss-error-btn')) $('dismiss-error-btn').addEventListener('click', () => els.error.classList.add('hidden'));
    if ($('print-plan-btn')) $('print-plan-btn').addEventListener('click', () => window.print());

    if ($('download-json-btn')) {
        $('download-json-btn').addEventListener('click', () => {
            if (!state.currentPlan) return;
            const b = new Blob([JSON.stringify(state.currentPlan, null, 2)], { type: 'application/json' });
            const a = el('a');
            a.href = URL.createObjectURL(b);
            a.download = `event-plan-${state.currentPlan.request.event_type}.json`;
            a.click();
            announce('Event plan downloaded as JSON.');
        });
    }

    if ($('reset-plan-btn')) {
        $('reset-plan-btn').addEventListener('click', () => {
            state.currentPlan = null;
            els.results.classList.add('hidden');
            els.form.reset();
            els.form.scrollIntoView({ behavior: 'smooth' });
            announce('Plan reset.');
        });
    }

    if (els.priorities) {
        els.priorities.addEventListener('change', () => {
            const chk = els.priorities.querySelectorAll('input:checked');
            if (els.prioCount) els.prioCount.textContent = String(chk.length);
            els.priorities.querySelectorAll('input:not(:checked)').forEach(cb => {
                cb.disabled = chk.length >= 3;
            });
        });
    }

    if (els.notes && els.notesCount) {
        els.notes.addEventListener('input', () => {
            els.notesCount.textContent = String(els.notes.value.length);
        });
    }
});
