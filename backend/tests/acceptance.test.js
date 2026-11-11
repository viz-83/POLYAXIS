/**
 * Executable acceptance suite for PolyAxis_Phase1_Prototype_Requirements.md.
 * Every test is tagged with the requirement ID(s) / acceptance criterion it verifies.
 *
 * It starts its OWN server on a throw-away data directory (seeded from scripts/seed.js), so it never
 * touches real demo data.  Run:  npm test
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const jwt = require('jsonwebtoken');

const BACKEND = path.join(__dirname, '..');
const PORT = 4390;
const BASE = `http://127.0.0.1:${PORT}/api`;
const ORIGIN = 'http://localhost:5173';
const SECRET = `test-secret-${'x'.repeat(48)}`;

let server;
let dataDir;
const tokens = {};
const ids = {};

async function api(method, url, { token, body, headers = {} } = {}) {
  const started = Date.now();
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, body: json, headers: res.headers, ms: Date.now() - started };
}

async function login(email, password) {
  const r = await api('POST', '/auth/login', { body: { email, password } });
  assert.equal(r.status, 200, `login failed for ${email}`);
  return r.body;
}

const readJson = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, `${name}.json`), 'utf-8'));
const sig = (ranked) => ranked.map((t) => `${t.materialId}|${t.profileId}|${t.compositeScore}`);
const distinct = (arr) => [...new Set(arr)];

before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'polyaxis-acceptance-'));
  const env = {
    ...process.env, DATA_DIR: dataDir, PORT: String(PORT), JWT_SECRET: SECRET, FRONTEND_ORIGIN: ORIGIN,
    NODE_ENV: 'test', SESSION_TIMEOUT_SECONDS: '3600', SESSION_REFRESH_AFTER_SECONDS: '0',
  };
  const seed = spawnSync(process.execPath, ['scripts/seed.js'], { cwd: BACKEND, env });
  assert.equal(seed.status, 0, `seed failed: ${seed.stderr}`);
  server = spawn(process.execPath, ['server.js'], { cwd: BACKEND, env, stdio: 'ignore' });
  for (let i = 0; i < 50; i += 1) {
    try { const r = await fetch(`${BASE}/health`); if (r.ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  const accounts = {
    alex: ['alex.chapman@polyaxis-demo.com', 'Demo2026!'],
    sarah: ['sarah.mitchell@polyaxis-demo.com', 'Demo2026!'],
    james: ['james.okafor@polyaxis-demo.com', 'Demo2026!'],
    admin: ['admin@polyaxis-demo.com', 'Admin2026!'],
  };
  for (const [k, [email, pw]] of Object.entries(accounts)) {
    const r = await login(email, pw);
    tokens[k] = r.token;
    const list = await api('GET', '/projects', { token: r.token });
    ids[k] = list.body.projects[0]?.id;
  }
});

after(() => {
  if (server) server.kill();
  if (dataDir) fs.rmSync(dataDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------------------------
describe('Module 1 — Authentication & session management', () => {
  it('AUTH-01/02/03: valid credentials return a JWT and the user (role included)', async () => {
    const r = await api('POST', '/auth/login', { body: { email: 'alex.chapman@polyaxis-demo.com', password: 'Demo2026!' } });
    assert.equal(r.status, 200);
    assert.ok(r.body.token);
    assert.equal(r.body.user.role, 'Technical User');
    assert.equal(r.body.user.email, 'alex.chapman@polyaxis-demo.com');
    assert.equal(r.body.user.passwordHash, undefined, 'password hash must never be returned');
  });

  it('AUTH-04 / AC: invalid credentials give the same generic error for unknown email and wrong password', async () => {
    const a = await api('POST', '/auth/login', { body: { email: 'nobody@example.com', password: 'Demo2026!' } });
    const b = await api('POST', '/auth/login', { body: { email: 'alex.chapman@polyaxis-demo.com', password: 'wrong-password' } });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.equal(a.body.error.message, b.body.error.message);
    assert.equal(a.body.error.code, b.body.error.code);
  });

  it('AUTH-06 / 8.4: session token lifetime is 60 minutes', () => {
    const p = jwt.decode(tokens.alex);
    assert.equal(p.exp - p.iat, 3600);
  });

  it('AUTH-06: the 60-minute timeout is INACTIVITY-based — active use issues a refreshed token', async () => {
    const r = await api('GET', '/projects', { token: tokens.alex });
    const fresh = r.headers.get('x-session-token');
    assert.ok(fresh, 'authenticated responses must carry a refreshed session token (X-Session-Token)');
    const p = jwt.verify(fresh, SECRET);
    assert.equal(p.exp - p.iat, 3600);
    // and the refreshed token must itself work
    assert.equal((await api('GET', '/projects', { token: fresh })).status, 200);
  });

  it('8.4: all routes except login require a valid token', async () => {
    for (const url of ['/projects', '/materials', '/admin/status']) {
      assert.equal((await api('GET', url)).status, 401, `${url} must reject missing token`);
      assert.equal((await api('GET', url, { token: 'not.a.token' })).status, 401, `${url} must reject a bad token`);
    }
    const expired = jwt.sign({ sub: 'x', role: 'Administrator' }, SECRET, { expiresIn: -10 });
    const r = await api('GET', '/admin/status', { token: expired });
    assert.equal(r.status, 401);
    assert.equal(r.body.error.code, 'SESSION_EXPIRED');
  });

  it('AUTH-07 / AC: Technical User receives 403 on every /api/admin/* route; Administrator succeeds', async () => {
    for (const [m, u] of [['GET', '/admin/scenarios'], ['GET', '/admin/materials'], ['GET', '/admin/regulations'], ['GET', '/admin/scoring'], ['GET', '/admin/status'], ['POST', '/admin/scenarios/reset']]) {
      const r = await api(m, u, { token: tokens.alex, body: m === 'POST' ? {} : undefined });
      assert.equal(r.status, 403, `${m} ${u}`);
    }
    assert.equal((await api('GET', '/admin/scenarios', { token: tokens.admin })).status, 200);
  });

  it('AUTH-05: logout endpoint succeeds for an authenticated user', async () => {
    assert.equal((await api('POST', '/auth/logout', { token: tokens.alex })).status, 200);
  });

  it('8.4: passwords are stored as bcrypt hashes with cost ≥ 10', () => {
    for (const u of readJson('users')) {
      assert.match(u.passwordHash, /^\$2[aby]\$(\d\d)\$/);
      assert.ok(Number(u.passwordHash.split('$')[2]) >= 10, 'bcrypt cost factor must be ≥ 10');
      assert.ok(!u.passwordHash.includes('Demo2026'));
    }
  });

  it('8.4: CORS is restricted to the configured frontend origin', async () => {
    const ok = await api('GET', '/health', { headers: { Origin: ORIGIN } });
    assert.equal(ok.headers.get('access-control-allow-origin'), ORIGIN);
    const bad = await api('GET', '/health', { headers: { Origin: 'https://evil.example' } });
    assert.notEqual(bad.headers.get('access-control-allow-origin'), 'https://evil.example');
  });

  it('4.4: the four seeded demo accounts exist with the specified roles', () => {
    const users = readJson('users');
    const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));
    assert.equal(byEmail['alex.chapman@polyaxis-demo.com'].role, 'Technical User');
    assert.equal(byEmail['sarah.mitchell@polyaxis-demo.com'].role, 'Technical User');
    assert.equal(byEmail['james.okafor@polyaxis-demo.com'].role, 'Technical User');
    assert.equal(byEmail['admin@polyaxis-demo.com'].role, 'Administrator');
  });
});

// ---------------------------------------------------------------------------------------------
describe('Module 2 — Project management', () => {
  let created;

  it('PROJ-02: creation REQUIRES project name, product type, description AND transition objective', async () => {
    const full = { name: 'Req test', productType: 'Industrial', description: 'd', transitionObjective: 'o' };
    for (const missing of ['name', 'productType', 'description', 'transitionObjective']) {
      const body = { ...full }; delete body[missing];
      const r = await api('POST', '/projects', { token: tokens.alex, body });
      assert.equal(r.status, 400, `missing ${missing} must be rejected`);
      assert.ok(r.body.error.details?.[missing], `field-level error for ${missing}`);
    }
  });

  it('PROJ-03: only the six specified product types are accepted', async () => {
    for (const t of ['Fresh Food', 'Ambient Food', 'Frozen Food', 'Consumer Goods', 'Industrial', 'Other']) {
      const r = await api('POST', '/projects', { token: tokens.alex, body: { name: `T ${t}`, productType: t, description: 'd', transitionObjective: 'o' } });
      assert.equal(r.status, 201, t);
      if (t === 'Other') created = r.body.project;
    }
    const bad = await api('POST', '/projects', { token: tokens.alex, body: { name: 'x', productType: 'Aerospace', description: 'd', transitionObjective: 'o' } });
    assert.equal(bad.status, 400);
  });

  it('PROJ-01/07 / AC: new project starts at the Specification stage; saving the spec advances the stage', async () => {
    assert.equal(created.stage, 'Specification');
    await api('POST', `/projects/${created.id}/specification`, { token: tokens.alex, body: { existingMaterial: 'x' } });
    const p = (await api('GET', `/projects/${created.id}`, { token: tokens.alex })).body.project;
    assert.equal(p.stage, 'Requirements');
    assert.ok(p.stagesCompleted.includes('Specification'));
  });

  it('PROJ-04: a Technical User only lists their own projects; PROJ-09: Administrator lists all', async () => {
    const mine = (await api('GET', '/projects', { token: tokens.alex })).body.projects;
    assert.ok(mine.every((p) => readJson('projects').find((x) => x.id === p.id).userId === readJson('users').find((u) => u.email === 'alex.chapman@polyaxis-demo.com').id));
    const all = (await api('GET', '/projects', { token: tokens.admin })).body.projects;
    assert.ok(all.length > mine.length);
    assert.ok(all.some((p) => p.id === ids.sarah) && all.some((p) => p.id === ids.james));
  });

  it('RBAC: a Technical User cannot read or write another user’s project (403)', async () => {
    assert.equal((await api('GET', `/projects/${ids.alex}`, { token: tokens.sarah })).status, 403);
    assert.equal((await api('GET', `/projects/${ids.alex}/dashboard`, { token: tokens.sarah })).status, 403);
    assert.equal((await api('POST', `/projects/${ids.alex}/run-optimisation`, { token: tokens.sarah, body: { materialIds: ['MAT-003'] } })).status, 403);
    assert.equal((await api('PATCH', `/projects/${ids.alex}`, { token: tokens.sarah, body: { name: 'hijack' } })).status, 403);
  });

  it('PROJ-08: project information can be edited at any stage', async () => {
    const r = await api('PATCH', `/projects/${created.id}`, { token: tokens.alex, body: { name: 'Renamed project' } });
    assert.equal(r.status, 200);
    assert.equal(r.body.project.name, 'Renamed project');
  });

  it('8.4: user input is sanitised server-side before storage', async () => {
    const r = await api('POST', '/projects', { token: tokens.alex, body: { name: '<script>alert(1)</script>Safe name', productType: 'Other', description: '<img src=x onerror=alert(1)>desc', transitionObjective: 'o' } });
    assert.equal(r.status, 201);
    assert.ok(!/[<>]/.test(r.body.project.name));
    assert.ok(!/[<>]/.test(r.body.project.description));
  });

  it('8.2: unknown project → structured JSON 404 (no stack trace)', async () => {
    const r = await api('GET', '/projects/does-not-exist', { token: tokens.alex });
    assert.equal(r.status, 404);
    assert.ok(r.body.error.code && r.body.error.message);
    assert.ok(!JSON.stringify(r.body).includes('at '), 'no stack trace');
  });
});

// ---------------------------------------------------------------------------------------------
describe('Modules 3–5 — Specification, requirements, manufacturing, regulatory', () => {
  const p = () => ids.alex;

  it('SPEC-07: numeric inputs are validated against ranges with field-level errors', async () => {
    const cases = [
      ['requirements', { otrTarget: -1 }, 'otrTarget'],
      ['requirements', { wvtrTarget: -0.5 }, 'wvtrTarget'],
      ['requirements', { recyclabilityTargetPercent: 150 }, 'recyclabilityTargetPercent'],
      ['requirements', { sealStrengthMinimum: -3 }, 'sealStrengthMinimum'],
      ['requirements', { shelfLifeRequirementMonths: -1 }, 'shelfLifeRequirementMonths'],
      ['requirements', { productSensitivity: 'Spicy' }, 'productSensitivity'],
      ['specification', { targetRecyclabilityPercent: 101 }, 'targetRecyclabilityPercent'],
      ['specification', { currentOtr: -2 }, 'currentOtr'],
      ['specification', { currentShelfLifeMonths: -1 }, 'currentShelfLifeMonths'],
      ['manufacturing', { temperatureMinC: 220, temperatureMaxC: 180 }, 'temperatureMinC'],
      ['manufacturing', { lineSpeedMinMpm: 150, lineSpeedMaxMpm: 100 }, 'lineSpeedMinMpm'],
      ['manufacturing', { equipmentTypes: ['Time Machine'] }, 'equipmentTypes'],
      ['manufacturing', { constraintFlexibility: 'Maybe' }, 'constraintFlexibility'],
      ['regulatory', { classificationPriority: 'Whatever' }, 'classificationPriority'],
    ];
    for (const [resource, body, field] of cases) {
      const r = await api('POST', `/projects/${p()}/${resource}`, { token: tokens.alex, body });
      assert.equal(r.status, 400, `${resource} ${JSON.stringify(body)} should be rejected`);
      assert.ok(r.body.error.details?.[field], `field-level error expected for ${field}`);
    }
  });

  it('SPEC-08: incomplete requirements can be saved and completed later', async () => {
    const before = (await api('GET', `/projects/${p()}/requirements`, { token: tokens.alex })).body.requirements;
    const r = await api('POST', `/projects/${p()}/requirements`, { token: tokens.alex, body: { otrTarget: 5 } });
    assert.equal(r.status, 200);
    // restore the complete baseline
    await api('POST', `/projects/${p()}/requirements`, { token: tokens.alex, body: before });
  });

  it('SPEC-01..06 / MFG-01..06 / REG-01: every field saves and persists (round-trip)', async () => {
    const spec = { existingMaterial: 'A', layerStructure: 'B / C', currentShelfLifeMonths: 3, currentOtr: 2, currentWvtr: 1, currentRecyclabilityStatus: 'Non-Recyclable', targetMaterialType: 'T', targetRecyclabilityPercent: 70, targetRecyclingStream: 'UK EPR Household', transitionPriority: 'Cost' };
    const reqs = { otrTarget: 4, wvtrTarget: 2, sealStrengthMinimum: 7, shelfLifeRequirementMonths: 6, productSensitivity: 'Both', recyclabilityTargetPercent: 75, additionalParameters: 'extra' };
    const mfg = { equipmentTypes: ['Blown Film Line', 'Cast Film Line', 'Extrusion Coating Line', 'Flexographic Printing Line', 'Lamination Line', 'Rotogravure Line'], temperatureMinC: 150, temperatureMaxC: 230, lineSpeedMinMpm: 50, lineSpeedMaxMpm: 150, materialCompatibilityNote: 'PE only', constraintFlexibility: 'Soft' };
    const reg = { ukEprEnabled: true, ukEprMandatory: false, euPpwrEnabled: true, euPpwrMandatory: true, classificationPriority: 'Most Restrictive', notes: 'n' };
    const original = {};
    for (const k of ['specification', 'requirements', 'manufacturing', 'regulatory']) original[k] = (await api('GET', `/projects/${p()}/${k}`, { token: tokens.alex })).body[k];
    for (const [k, body] of [['specification', spec], ['requirements', reqs], ['manufacturing', mfg], ['regulatory', reg]]) {
      assert.equal((await api('POST', `/projects/${p()}/${k}`, { token: tokens.alex, body })).status, 200, k);
      const got = (await api('GET', `/projects/${p()}/${k}`, { token: tokens.alex })).body[k];
      for (const [f, v] of Object.entries(body)) assert.deepEqual(got[f], v, `${k}.${f}`);
    }
    for (const k of Object.keys(original)) await api('POST', `/projects/${p()}/${k}`, { token: tokens.alex, body: original[k] });
  });
});

// ---------------------------------------------------------------------------------------------
describe('Module 6 — Candidate materials & materials library (§11.2)', () => {
  const TABLE = {
    'MAT-001': ['Mono-PE 60µm', 8.5, 4.2, 110, 130, 65, 1800],
    'MAT-002': ['Mono-PE 80µm', 6.8, 3.5, 115, 135, 68, 2100],
    'MAT-003': ['Mono-PE 80µm + EVOH barrier', 1.8, 1.2, 120, 145, 72, 2400],
    'MAT-004': ['Mono-PE 80µm + SiOx barrier', 2.4, 1.8, 115, 140, 74, 2600],
    'MAT-005': ['Mono-PP 50µm', 12.0, 6.5, 130, 155, 71, 1900],
    'MAT-006': ['Mono-PP 60µm + barrier coating', 4.2, 2.8, 135, 160, 73, 2300],
    'MAT-007': ['HDPE 70µm', 5.1, 3.1, 125, 150, 70, 2000],
    'MAT-008': ['Bio-based Mono-PE 75µm', 7.2, 3.8, 112, 132, 69, 3100],
  };
  let newId;

  it('MAT-01/02 / AC: all 8 materials are present with the exact §11.2 profile values', async () => {
    const list = (await api('GET', '/materials', { token: tokens.alex })).body.materials;
    assert.equal(list.length, 8);
    for (const [id, [name, otr, wvtr, sMin, sMax, epr, cost]] of Object.entries(TABLE)) {
      const m = list.find((x) => x.id === id);
      assert.ok(m, id);
      assert.deepEqual([m.name, m.otr, m.wvtr, m.sealTempMinC, m.sealTempMaxC, m.ukEprRecyclabilityPercent, m.baseTrialCostGbp], [name, otr, wvtr, sMin, sMax, epr, cost], id);
    }
  });

  it('MAT-03: a profile carries structure, OTR, WVTR, seal range, UK EPR + EU PPWR recyclability, cost and shelf-life suitability', async () => {
    const m = (await api('GET', '/materials/MAT-003', { token: tokens.alex })).body.material;
    for (const f of ['name', 'layerStructure', 'otr', 'wvtr', 'sealTempMinC', 'sealTempMaxC', 'ukEprRecyclabilityPercent', 'euPpwrRecyclabilityPercent', 'baseTrialCostGbp', 'typicalShelfLifeSuitability']) {
      assert.ok(m[f] !== undefined && m[f] !== '', `material.${f}`);
    }
  });

  it('MAT-04/05/08: overview gives a manufacturing and a regulatory status for every material, with reasons', async () => {
    const o = (await api('GET', `/projects/${ids.alex}/materials-overview`, { token: tokens.alex })).body.overview;
    assert.equal(o.length, 8);
    for (const x of o) {
      assert.ok(['pass', 'conditional', 'fail'].includes(x.manufacturingCheck.status));
      assert.ok(['pass', 'conditional', 'fail'].includes(x.regulatoryCheck.status));
      assert.ok(x.manufacturingCheck.reason && x.regulatoryCheck.reason);
    }
  });

  it('MAT-09 / ADMIN-05/06: Administrator can ADD, EDIT and DEACTIVATE materials; Technical User cannot', async () => {
    const payload = { name: 'Test Mono-PE 100µm', polymerFamily: 'Mono-PE', barrierType: 'None', layerStructure: 'Single layer', otr: 5, wvtr: 2.5, sealTempMinC: 110, sealTempMaxC: 130, processingTempMinC: 185, processingTempMaxC: 215, minLineSpeedMpm: 80, maxLineSpeedMpm: 150, ukEprRecyclabilityPercent: 80, euPpwrRecyclabilityPercent: 80, baseTrialCostGbp: 2000, typicalShelfLifeSuitability: 'Up to 6 months' };
    assert.equal((await api('POST', '/admin/materials', { token: tokens.alex, body: payload })).status, 403);
    const bad = await api('POST', '/admin/materials', { token: tokens.admin, body: { ...payload, otr: -1 } });
    assert.equal(bad.status, 400);
    const add = await api('POST', '/admin/materials', { token: tokens.admin, body: payload });
    assert.equal(add.status, 201);
    newId = add.body.material.id;
    assert.match(newId, /^MAT-\d{3}$/);
    assert.ok((await api('GET', '/materials', { token: tokens.alex })).body.materials.some((m) => m.id === newId));
    const edit = await api('PATCH', `/admin/materials/${newId}`, { token: tokens.admin, body: { name: 'Edited name', baseTrialCostGbp: 2222 } });
    assert.equal(edit.status, 200);
    assert.equal(edit.body.material.baseTrialCostGbp, 2222);
    assert.equal((await api('PATCH', `/admin/materials/${newId}/active`, { token: tokens.admin, body: { active: false } })).status, 200);
    assert.ok(!(await api('GET', '/materials', { token: tokens.alex })).body.materials.some((m) => m.id === newId), 'disabled material must leave the library');
    const run = await api('POST', `/projects/${ids.alex}/run-optimisation`, { token: tokens.alex, body: { materialIds: [newId] } });
    assert.equal(run.status, 400, 'a disabled material cannot be selected');
  });
});

// ---------------------------------------------------------------------------------------------
describe('Modules 7–9 — Trial generator, engine and recommendation (DEMO-01 data)', () => {
  const run = (ms) => api('POST', `/projects/${ids.alex}/run-optimisation`, { token: tokens.alex, body: { materialIds: ms } });
  const ALL = ['MAT-001', 'MAT-002', 'MAT-003', 'MAT-004', 'MAT-005', 'MAT-006', 'MAT-007', 'MAT-008'];

  it('TRIAL-03/05: even a single material yields ≥ 5 trials, drawn from ≥ 3 distinct process profiles', async () => {
    const r = await run(['MAT-003']);
    assert.equal(r.status, 200);
    const t = r.body.recommendation.ranked;
    assert.ok(t.length >= 5, `expected ≥5 trials, got ${t.length}`);
    assert.ok(distinct(t.map((x) => x.profileId)).length >= 3);
  });

  it('TRIAL-05: never more than 12 trials, and every feasible material stays represented', async () => {
    const r = await run(ALL);
    const rec = r.body.recommendation;
    assert.ok(rec.ranked.length >= 5 && rec.ranked.length <= 12, `got ${rec.ranked.length}`);
    const feasible = ALL.filter((id) => !rec.excluded.some((e) => e.materialId === id));
    // trimming must be score-based, not a blind slice that drops whole materials
    const top = rec.ranked.map((t) => t.materialId);
    assert.ok(top.includes('MAT-003') && top.includes('MAT-004'), 'the strongest materials must survive the cap');
    assert.ok(distinct(top).length >= Math.min(3, feasible.length));
  });

  it('TRIAL-02: every trial record has id, material, process parameters, performance targets, feasibility score, cost, expected outcome', async () => {
    const t = (await run(['MAT-003', 'MAT-004'])).body.recommendation.ranked[0];
    assert.ok(t.id && t.materialId && t.trialName);
    assert.ok(t.processParameters.temperatureC != null && t.processParameters.lineSpeedMpm != null && t.processParameters.sealConditions);
    assert.ok(t.performanceTargets && t.performanceTargets.otrTarget === 5 && t.performanceTargets.wvtrTarget === 3, 'performance targets');
    assert.equal(typeof t.manufacturingCheck.score, 'number');
    assert.equal(typeof t.estimatedCostGbp, 'number');
    assert.ok(t.expectedOutcomeDescription);
  });

  it('TRIAL-04 / REG-07/08 / AC: hard manufacturing failures are excluded with a recorded reason', async () => {
    const rec = (await run(ALL)).body.recommendation;
    for (const id of ['MAT-005', 'MAT-006']) {
      const e = rec.excluded.find((x) => x.materialId === id);
      assert.ok(e, `${id} must be excluded`);
      assert.equal(e.reasonType, 'manufacturing');
      assert.match(e.reason, /temperature|°C/i);
    }
    assert.ok(!rec.ranked.some((t) => ['MAT-005', 'MAT-006'].includes(t.materialId)));
  });

  it('TRIAL-06: generated trials persist and are retrievable', async () => {
    const r = (await run(['MAT-003', 'MAT-004'])).body.recommendation;
    const got = (await api('GET', `/projects/${ids.alex}/recommendation`, { token: tokens.alex })).body.recommendation;
    assert.equal(got.id, r.id);
    assert.equal(got.ranked.length, r.ranked.length);
    assert.equal((await api('GET', `/projects/${ids.alex}/recommendation/history`, { token: tokens.alex })).body.runs.at(-1).id, r.id);
  });

  it('ENGINE-02: default weights are 30/25/20/15/10', async () => {
    const w = (await api('GET', '/admin/scoring', { token: tokens.admin })).body.scoring.weights;
    assert.deepEqual([w.informationGain, w.feasibility, w.uncertaintyReduction, w.regulatory, w.cost], [0.3, 0.25, 0.2, 0.15, 0.1]);
  });

  it('ENGINE-01/05/06/07: five dimension scores per trial, regulatory ∈ {1, 0.5, 0}, ranked by composite descending', async () => {
    const t = (await run(ALL)).body.recommendation.ranked;
    for (const x of t) {
      assert.deepEqual(Object.keys(x.dimensionScores).sort(), ['cost', 'feasibility', 'informationGain', 'regulatory', 'uncertaintyReduction']);
      assert.ok([1, 0.5, 0].includes(x.dimensionScores.regulatory));
      assert.ok(typeof x.compositeScore === 'number');
    }
    for (let i = 1; i < t.length; i += 1) assert.ok(t[i - 1].compositeScore >= t[i].compositeScore, 'descending order');
  });

  it('ENGINE-09 / AC: identical inputs always produce an identical ranking', async () => {
    const a = (await run(ALL)).body.recommendation.ranked;
    const b = (await run(ALL)).body.recommendation.ranked;
    assert.deepEqual(sig(a), sig(b));
  });

  it('ENGINE-10 / 8.1 / AC: ranking a full candidate set completes within 3 seconds', async () => {
    const r = await run(ALL);
    assert.ok(r.ms < 3000, `took ${r.ms}ms`);
  });

  it('ENGINE-08 / ADMIN-08: scoring weights are configurable at runtime and must sum to 100%', async () => {
    const orig = (await api('GET', '/admin/scoring', { token: tokens.admin })).body.scoring.weights;
    const before = (await run(['MAT-001', 'MAT-003'])).body.recommendation.ranked[0].compositeScore;
    assert.equal((await api('PATCH', '/admin/scoring', { token: tokens.admin, body: { weights: { informationGain: 0.5, feasibility: 0.5, uncertaintyReduction: 0.5, regulatory: 0.5, cost: 0.5 } } })).status, 400);
    assert.equal((await api('PATCH', '/admin/scoring', { token: tokens.admin, body: { weights: { informationGain: 0.1, feasibility: 0.1, uncertaintyReduction: 0.1, regulatory: 0.1, cost: 0.6 } } })).status, 200);
    const after = (await run(['MAT-001', 'MAT-003'])).body.recommendation;
    assert.notEqual(after.ranked[0].compositeScore, before, 'new weights must change the scores');
    assert.equal(after.weights.cost, 0.6, 'the weights used are recorded on the run');
    await api('PATCH', '/admin/scoring', { token: tokens.admin, body: { weights: orig } });
  });

  it('REC-01/02/04/09: primary = top-ranked; carries score, cost, information gain, confidence and a performance status', async () => {
    const rec = (await run(['MAT-003', 'MAT-004', 'MAT-001'])).body.recommendation;
    assert.equal(rec.primaryRecommendationId, rec.ranked[0].id);
    assert.ok(['High', 'Medium', 'Low'].includes(rec.confidence));
    const top = rec.ranked[0];
    assert.equal(typeof top.dimensionScores.informationGain, 'number');
    assert.ok(top.performanceCheck && ['pass', 'conditional', 'fail'].includes(top.performanceCheck.status), 'REC-04 performance status');
    const runnerUp = rec.ranked.find((t) => t.materialId !== top.materialId);
    const gap = top.compositeScore - runnerUp.compositeScore;
    assert.equal(rec.confidence, gap >= 15 ? 'High' : gap >= 5 ? 'Medium' : 'Low');
  });

  it('REC-05/06 / AC: rationale covers barrier performance, manufacturing, regulation, cost and information gain', async () => {
    const r = (await run(['MAT-001', 'MAT-002', 'MAT-003', 'MAT-004'])).body.recommendation.rationale;
    assert.match(r, /OTR/);
    assert.match(r, /WVTR/);
    assert.match(r, /manufacturing|line window|processing window/i);
    assert.match(r, /recyclab/i);
    assert.match(r, /UK EPR/);
    assert.match(r, /£[\d,]+/);
    assert.match(r, /information gain/i);
  });

  it('DEMO-01 / AC (rejection criterion): MAT-003 (Mono-PE 80µm + EVOH) is the #1 recommendation; Mono-PP eliminated by temperature', async () => {
    const rec = (await run(ALL)).body.recommendation;
    assert.equal(rec.ranked[0].materialId, 'MAT-003');
    assert.ok(rec.excluded.some((e) => e.materialId === 'MAT-005') && rec.excluded.some((e) => e.materialId === 'MAT-006'));
    assert.match(rec.rationale, /EVOH/);
    assert.match(rec.rationale, /72%/);
  });
});

// ---------------------------------------------------------------------------------------------
describe('Pre-scripted scenarios DEMO-02, DEMO-03, DEMO-05', () => {
  it('DEMO-02 / AC: Cast Film Line + 100–140 m/min eliminates EVOH and SiOx; Mono-PP 50µm ranks #1', async () => {
    const m = (await api('GET', `/projects/${ids.sarah}/manufacturing`, { token: tokens.sarah })).body.manufacturing;
    assert.deepEqual(m.equipmentTypes, ['Cast Film Line']);
    assert.deepEqual([m.lineSpeedMinMpm, m.lineSpeedMaxMpm], [100, 140]);
    const r = await api('POST', `/projects/${ids.sarah}/run-optimisation`, { token: tokens.sarah, body: { materialIds: ['MAT-003', 'MAT-004', 'MAT-005', 'MAT-006'] } });
    assert.equal(r.status, 200);
    const rec = r.body.recommendation;
    for (const id of ['MAT-003', 'MAT-004']) {
      const e = rec.excluded.find((x) => x.materialId === id);
      assert.ok(e, `${id} must be excluded`);
      assert.equal(e.reasonType, 'manufacturing');
      assert.match(e.reason, /m\/min|line speed/i, 'excluded because of line speed');
    }
    assert.equal(rec.ranked[0].materialId, 'MAT-005');
  });

  it('DEMO-02 (contrast): the same candidates are NOT excluded on the Blown Film Line of project 1', async () => {
    const rec = (await api('POST', `/projects/${ids.alex}/run-optimisation`, { token: tokens.alex, body: { materialIds: ['MAT-003', 'MAT-004'] } })).body.recommendation;
    assert.equal(rec.excluded.length, 0);
  });

  it('DEMO-03 / AC: EU PPWR mandatory excludes MAT-001/002/008 on regulation alone; SiOx passes but ranks below EVOH', async () => {
    const reg = (await api('GET', `/projects/${ids.james}/regulatory`, { token: tokens.james })).body.regulatory;
    assert.equal(reg.euPpwrEnabled && reg.euPpwrMandatory, true);
    const ALL = ['MAT-001', 'MAT-002', 'MAT-003', 'MAT-004', 'MAT-005', 'MAT-006', 'MAT-007', 'MAT-008'];
    const rec = (await api('POST', `/projects/${ids.james}/run-optimisation`, { token: tokens.james, body: { materialIds: ALL } })).body.recommendation;
    for (const id of ['MAT-001', 'MAT-002', 'MAT-008']) {
      const e = rec.excluded.find((x) => x.materialId === id);
      assert.ok(e, id);
      assert.equal(e.reasonType, 'regulatory');
      assert.match(e.reason, /EU PPWR/);
    }
    const first = (id) => rec.ranked.findIndex((t) => t.materialId === id);
    assert.ok(first('MAT-004') >= 0, 'MAT-004 passes');
    assert.ok(first('MAT-003') < first('MAT-004'), 'EVOH ranks above SiOx (cost differential)');
  });

  it('DEMO-05 / AC: tightening the temperature window to 160–180°C changes the ranking and excludes candidates', async () => {
    const PE = ['MAT-001', 'MAT-002', 'MAT-003', 'MAT-004', 'MAT-007', 'MAT-008'];
    const original = (await api('GET', `/projects/${ids.alex}/manufacturing`, { token: tokens.alex })).body.manufacturing;
    const baseline = (await api('POST', `/projects/${ids.alex}/run-optimisation`, { token: tokens.alex, body: { materialIds: PE } })).body.recommendation;
    await api('POST', `/projects/${ids.alex}/manufacturing`, { token: tokens.alex, body: { ...original, temperatureMinC: 160, temperatureMaxC: 180 } });
    const tight = (await api('POST', `/projects/${ids.alex}/run-optimisation`, { token: tokens.alex, body: { materialIds: PE } })).body.recommendation;
    assert.notDeepEqual(sig(tight.ranked), sig(baseline.ranked), 'ranking must change');
    assert.ok(tight.excluded.length > baseline.excluded.length, 'a tighter window excludes more candidates');
    await api('POST', `/projects/${ids.alex}/manufacturing`, { token: tokens.alex, body: original });
  });
});

// ---------------------------------------------------------------------------------------------
describe('Module 10 — Trial results & re-optimisation (DEMO-04)', () => {
  const ms = ['MAT-001', 'MAT-002', 'MAT-003', 'MAT-004'];
  let primary;

  it('setup: reset Alex’s project and rank MAT-001..004', async () => {
    assert.equal((await api('POST', '/admin/scenarios/reset', { token: tokens.admin, body: { projectId: ids.alex } })).status, 200);
    const rec = (await api('POST', `/projects/${ids.alex}/run-optimisation`, { token: tokens.alex, body: { materialIds: ms } })).body.recommendation;
    primary = rec.ranked[0];
    assert.equal(primary.materialId, 'MAT-003');
  });

  it('RESULT-02 / AC: a failure reason is REQUIRED when any dimension fails; all three verdicts are required', async () => {
    const base = { trialId: primary.id, performanceResult: 'Pass', manufacturingResult: 'Fail', regulatoryResult: 'Pass' };
    const noReason = await api('POST', `/projects/${ids.alex}/trial-result`, { token: tokens.alex, body: base });
    assert.equal(noReason.status, 400);
    assert.ok(noReason.body.error.details?.failureReason);
    const missing = await api('POST', `/projects/${ids.alex}/trial-result`, { token: tokens.alex, body: { trialId: primary.id, performanceResult: 'Pass' } });
    assert.equal(missing.status, 400);
  });

  it('RESULT-04/05/06/07 / AC: a manufacturing failure removes MAT-003, promotes MAT-004 and the rationale cites the failure — within 3s', async () => {
    const r = await api('POST', `/projects/${ids.alex}/trial-result`, { token: tokens.alex, body: { trialId: primary.id, performanceResult: 'Pass', manufacturingResult: 'Fail', regulatoryResult: 'Pass', failureReason: 'Seal unit temperature variance caused inconsistent seal formation at target line speed.', measuredOtr: 4.2 } });
    assert.equal(r.status, 201);
    assert.ok(r.ms < 3000, `re-optimisation took ${r.ms}ms`);
    assert.equal(r.body.result.overallResult, 'Unsuccessful');
    const up = r.body.updatedRecommendation;
    assert.equal(up.ranked[0].materialId, 'MAT-004', 'DEMO-04: SiOx becomes the new #1');
    assert.ok(!up.ranked.some((t) => t.materialId === 'MAT-003'), 'failed material excluded from the updated ranking');
    assert.ok(up.excluded.some((e) => e.materialId === 'MAT-003' && e.reasonType === 'evidence'));
    assert.match(up.rationale, /Following the .*EVOH.*trial/);
    assert.match(up.rationale, /failed on manufacturing/);
    assert.match(up.rationale, /Seal unit temperature variance/);
  });

  it('RESULT-08/09/10 / DASH-07: several results accumulate in chronological order and appear on the dashboard', async () => {
    const second = (await api('GET', `/projects/${ids.alex}/recommendation`, { token: tokens.alex })).body.recommendation.ranked[0];
    const r = await api('POST', `/projects/${ids.alex}/trial-result`, { token: tokens.alex, body: { trialId: second.id, performanceResult: 'Fail', manufacturingResult: 'Pass', regulatoryResult: 'Pass', failureReason: 'OTR above target' } });
    assert.equal(r.status, 201);
    const results = (await api('GET', `/projects/${ids.alex}/trial-results`, { token: tokens.alex })).body.results;
    assert.equal(results.length, 2);
    assert.ok(new Date(results[0].recordedAt) <= new Date(results[1].recordedAt));
    const dash = (await api('GET', `/projects/${ids.alex}/dashboard`, { token: tokens.alex })).body.dashboard;
    assert.equal(dash.trialHistory.length, 2);
    assert.ok(['date', 'trialName', 'performanceResult', 'manufacturingResult', 'regulatoryResult', 'overallResult'].every((f) => f in dash.trialHistory[0]));
  });

  it('RESULT-04: a successful trial is recorded without a failure reason', async () => {
    const top = (await api('GET', `/projects/${ids.alex}/recommendation`, { token: tokens.alex })).body.recommendation.ranked[0];
    const r = await api('POST', `/projects/${ids.alex}/trial-result`, { token: tokens.alex, body: { trialId: top.id, performanceResult: 'Pass', manufacturingResult: 'Pass', regulatoryResult: 'Pass' } });
    assert.equal(r.status, 201);
    assert.equal(r.body.result.overallResult, 'Successful');
  });

  it('POST /re-optimise re-runs the engine on demand (MFG-09)', async () => {
    const r = await api('POST', `/projects/${ids.alex}/re-optimise`, { token: tokens.alex });
    assert.equal(r.status, 200);
    assert.ok(r.body.recommendation.ranked.length > 0);
  });
});

// ---------------------------------------------------------------------------------------------
describe('Module 11 — Dashboard', () => {
  it('DASH-01..08: aggregate exposes every required section', async () => {
    const r = await api('GET', `/projects/${ids.alex}/dashboard`, { token: tokens.alex });
    assert.equal(r.status, 200);
    assert.ok(r.ms < 1500, `dashboard took ${r.ms}ms`);
    const d = r.body.dashboard;
    assert.ok(d.project.name && d.project.productType && d.project.transitionObjective, 'DASH-02');
    assert.deepEqual(d.project.allStages, ['Specification', 'Requirements', 'Materials', 'Optimisation', 'Results'], 'DASH-03');
    assert.ok(d.packagingSummary.existing.material && d.packagingSummary.existing.otr != null && d.packagingSummary.existing.shelfLifeMonths != null, 'DASH-04 existing');
    assert.ok(d.packagingSummary.target.materialType && d.packagingSummary.target.recyclingStream, 'DASH-04 target');
    assert.ok('totalEvaluated' in d.candidatesOverview && 'compatibleCount' in d.candidatesOverview && 'excludedCount' in d.candidatesOverview, 'DASH-05');
    assert.ok(Array.isArray(d.candidatesOverview.statuses) && d.candidatesOverview.statuses.length > 0, 'DASH-05 candidate status overview');
    assert.ok(d.currentRecommendation.trialName && d.currentRecommendation.compositeScore != null && d.currentRecommendation.rationaleExcerpt, 'DASH-06');
    assert.ok(d.keyConstraints.manufacturing && d.keyConstraints.regulatory, 'DASH-08');
  });
});

// ---------------------------------------------------------------------------------------------
describe('Module 12 — Administrator panel', () => {
  it('ADMIN-02: lists every project with owner and status', async () => {
    const r = (await api('GET', '/admin/scenarios', { token: tokens.admin })).body.projects;
    assert.ok(r.length >= 3);
    assert.ok(r.every((p) => p.stage && p.ownerName), 'each project row carries its stage and owner');
  });

  it('REG-09 / ADMIN-07: regulatory thresholds can be viewed and updated; inconsistent values are rejected', async () => {
    const orig = (await api('GET', '/admin/regulations', { token: tokens.admin })).body.regulations;
    assert.ok(orig.ukEpr && orig.euPpwr);
    assert.equal((await api('PATCH', '/admin/regulations', { token: tokens.admin, body: { ukEpr: { compliantThreshold: 50, conditionalThreshold: 60 } } })).status, 400);
    assert.equal((await api('PATCH', '/admin/regulations', { token: tokens.admin, body: { ukEpr: { compliantThreshold: 150 } } })).status, 400);
    assert.equal((await api('PATCH', '/admin/regulations', { token: tokens.admin, body: { ukEpr: { compliantThreshold: 71 } } })).status, 200);
    // the new threshold must take effect in the engine (MAT-007 is exactly 70%)
    const o = (await api('GET', `/projects/${ids.alex}/materials-overview`, { token: tokens.alex })).body.overview.find((x) => x.material.id === 'MAT-007');
    assert.notEqual(o.regulatoryCheck.frameworks.find((f) => f.framework === 'UK EPR').status, 'pass');
    await api('PATCH', '/admin/regulations', { token: tokens.admin, body: { ukEpr: { compliantThreshold: orig.ukEpr.compliantThreshold } } });
  });

  it('ADMIN-03 / PROJ-10 / AC: resetting a project restores the full BASELINE (spec, constraints, no trials, no results)', async () => {
    const baselineMfg = readJson('baselines')[ids.alex].manufacturing;
    await api('POST', `/projects/${ids.alex}/manufacturing`, { token: tokens.alex, body: { equipmentTypes: ['Cast Film Line'], temperatureMinC: 100, temperatureMaxC: 120, lineSpeedMinMpm: 10, lineSpeedMaxMpm: 20, constraintFlexibility: 'Soft' } });
    await api('POST', `/projects/${ids.alex}/requirements`, { token: tokens.alex, body: { otrTarget: 99 } });
    assert.ok((await api('GET', `/projects/${ids.alex}/trial-results`, { token: tokens.alex })).body.results.length > 0, 'precondition: results exist');
    const r = await api('POST', '/admin/scenarios/reset', { token: tokens.admin, body: { projectId: ids.alex } });
    assert.equal(r.status, 200);
    assert.equal((await api('GET', `/projects/${ids.alex}/trial-results`, { token: tokens.alex })).body.results.length, 0);
    assert.equal((await api('GET', `/projects/${ids.alex}/recommendation`, { token: tokens.alex })).body.recommendation, null);
    const m = (await api('GET', `/projects/${ids.alex}/manufacturing`, { token: tokens.alex })).body.manufacturing;
    assert.deepEqual([m.equipmentTypes, m.temperatureMinC, m.temperatureMaxC, m.lineSpeedMinMpm, m.lineSpeedMaxMpm, m.constraintFlexibility], [baselineMfg.equipmentTypes, baselineMfg.temperatureMinC, baselineMfg.temperatureMaxC, baselineMfg.lineSpeedMinMpm, baselineMfg.lineSpeedMaxMpm, baselineMfg.constraintFlexibility]);
    assert.equal((await api('GET', `/projects/${ids.alex}/requirements`, { token: tokens.alex })).body.requirements.otrTarget, 5);
    const p = (await api('GET', `/projects/${ids.alex}`, { token: tokens.alex })).body.project;
    assert.equal(p.stage, 'Materials');
    assert.deepEqual(p.stagesCompleted.sort(), ['Requirements', 'Specification']);
  });

  it('ADMIN-04 / AC: batch reset restores every demonstration project simultaneously', async () => {
    await api('POST', `/projects/${ids.james}/regulatory`, { token: tokens.james, body: { ukEprEnabled: false, euPpwrEnabled: false } });
    await api('POST', `/projects/${ids.james}/run-optimisation`, { token: tokens.james, body: { materialIds: ['MAT-003'] } }).catch(() => {});
    const r = await api('POST', '/admin/scenarios/reset', { token: tokens.admin, body: {} });
    assert.equal(r.status, 200);
    assert.ok(r.body.resetCount >= 3);
    const reg = (await api('GET', `/projects/${ids.james}/regulatory`, { token: tokens.james })).body.regulatory;
    assert.equal(reg.euPpwrEnabled && reg.euPpwrMandatory, true);
    for (const k of ['alex', 'sarah', 'james']) {
      assert.equal((await api('GET', `/projects/${ids[k]}/recommendation`, { token: tokens[k] })).body.recommendation, null, `${k} trials cleared`);
    }
  });

  it('ADMIN-09 / S-09: system status — active sessions, project count, last reset, data-file sizes', async () => {
    const s = (await api('GET', '/admin/status', { token: tokens.admin })).body.status;
    assert.ok(s.activeSessions >= 2, `activeSessions=${s.activeSessions}`);
    assert.ok(s.totalProjects >= 3);
    assert.ok(s.lastResetAt, 'last reset timestamp');
    assert.ok(Array.isArray(s.dataFiles) && s.dataFiles.length >= 10 && s.dataFiles.every((f) => f.name && f.bytes > 0), 'data file sizes');
  });
});

// ---------------------------------------------------------------------------------------------
describe('§10–§11, §13 — data layer & seed dataset', () => {
  it('10.1: all specified JSON data files exist and mirror a relational schema (IDs, FKs, ISO-8601 timestamps)', () => {
    for (const f of ['users', 'projects', 'specifications', 'requirements', 'manufacturing', 'regulatory', 'materials', 'trials', 'results', 'regulations', 'scoring']) {
      assert.ok(fs.existsSync(path.join(dataDir, `${f}.json`)), `${f}.json`);
    }
    for (const p of readJson('projects')) assert.ok(!Number.isNaN(Date.parse(p.createdAt)) && /T/.test(p.createdAt));
    for (const s of readJson('specifications')) assert.ok(s.projectId);
  });

  it('TRIAL-03 / MAT-10 / REG-10: process-parameter profiles and regulatory rules live in the JSON data layer (not code)', () => {
    const profiles = readJson('profiles');
    assert.ok(Array.isArray(profiles) && profiles.length >= 3, 'profiles.json with ≥3 profiles');
    assert.ok(profiles.every((p) => p.id && p.label && p.costMultiplier && p.uncertaintyModifier));
    const regs = readJson('regulations');
    assert.ok(regs.ukEpr.compliantThreshold && regs.euPpwr.compliantThreshold);
  });

  it('11.1: the three demo projects are seeded exactly as specified', async () => {
    const get = async (u, pid, k) => (await api('GET', `/projects/${pid}/${k}`, { token: tokens[u] })).body[k];
    const aSpec = await get('alex', ids.alex, 'specification');
    const aReq = await get('alex', ids.alex, 'requirements');
    const aMfg = await get('alex', ids.alex, 'manufacturing');
    const aReg = await get('alex', ids.alex, 'regulatory');
    assert.equal(aSpec.currentOtr, 2.1); assert.equal(aSpec.currentWvtr, 1.8);
    assert.equal(aReq.otrTarget, 5); assert.equal(aReq.wvtrTarget, 3);
    assert.deepEqual(aMfg.equipmentTypes, ['Blown Film Line']);
    assert.deepEqual([aMfg.temperatureMinC, aMfg.temperatureMaxC, aMfg.lineSpeedMinMpm, aMfg.lineSpeedMaxMpm], [180, 220, 80, 120]);
    assert.ok(aReg.ukEprEnabled && aReg.ukEprMandatory && aReg.euPpwrEnabled && !aReg.euPpwrMandatory, 'UK EPR mandatory + EU PPWR monitoring');
    const sMfg = await get('sarah', ids.sarah, 'manufacturing');
    assert.deepEqual([sMfg.equipmentTypes[0], sMfg.temperatureMinC, sMfg.temperatureMaxC], ['Cast Film Line', 160, 190]);
    const sReg = await get('sarah', ids.sarah, 'regulatory');
    assert.ok(sReg.ukEprEnabled && !sReg.euPpwrEnabled, 'UK EPR only');
    const jSpec = await get('james', ids.james, 'specification');
    assert.equal(jSpec.targetRecyclabilityPercent, 80);
    const jReg = await get('james', ids.james, 'regulatory');
    assert.ok(jReg.euPpwrEnabled && jReg.euPpwrMandatory && jReg.ukEprEnabled && !jReg.ukEprMandatory, 'EU PPWR mandatory + UK EPR monitoring');
  });
});

describe('§8.1 — API performance', () => {
  it('standard GET/POST calls respond in < 500 ms', async () => {
    for (const [m, u, b] of [['GET', '/projects'], ['GET', '/materials'], ['GET', `/projects/${ids.alex}/requirements`], ['POST', `/projects/${ids.alex}/regulatory`, {}]]) {
      const r = await api(m, u, { token: tokens.alex, body: b });
      assert.ok(r.ms < 500, `${m} ${u} took ${r.ms}ms`);
    }
  });
});
