# PolyAxis — Phase 1 Prototype Requirements

**Prepared for:** PolyAxis  
**Prepared by:** Vishnu K V — Full-Stack Developer  
**Contact:** vishnu.kv8833@gmail.com | 6366030738  
**Document version:** 1.0  
**Date:** 22 August 2026  
**Project status:** Phase 1 — Technical Validation and Prototype Development

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Scope of Prototype](#2-scope-of-prototype)
3. [System Architecture](#3-system-architecture)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [User Journeys](#5-user-journeys)
6. [Functional Requirements](#6-functional-requirements)
7. [UI/UX Screen Inventory](#7-uiux-screen-inventory)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Tech Stack](#9-tech-stack)
10. [Data & Privacy](#10-data--privacy)
11. [Demo Data & Simulation Layer](#11-demo-data--simulation-layer)
12. [Acceptance Criteria](#12-acceptance-criteria)
13. [Deliverables & Handover](#13-deliverables--handover)
14. [Glossary](#14-glossary)

---

## 1. Project Overview

### 1.1 Background

Flexible packaging manufacturers are under increasing pressure to transition from non-recyclable multi-material laminate structures to recyclable mono-material alternatives. However, packaging transition remains dependent on fragmented technical assessment, engineering judgement, regulatory review, and repeated physical experimentation.

Manufacturers must consider material performance, barrier requirements, seal integrity, shelf life, manufacturing equipment, regulatory requirements, and cost before determining whether an alternative packaging structure is viable.

PolyAxis is designed as an intelligent decision-support platform that brings these considerations into a structured optimisation workflow. The platform focuses on one of the most technically complex challenges in sustainable packaging: determining which physical trial should be conducted next.

The core technical innovation is the **Compliance-Constrained Trial Design Engine**. The engine is intended to help manufacturers identify which physical trial should be performed next by evaluating expected information gain, trial cost, manufacturing feasibility, and regulatory constraints together.

### 1.2 Product Vision

PolyAxis brings packaging requirements, manufacturing conditions, and regulatory considerations into one structured digital workflow, enabling packaging engineers to:

- Assess existing packaging structures against target recyclability requirements
- Define technical performance requirements (barrier, seal, shelf-life)
- Specify manufacturing and regulatory constraints (UK EPR, EU PPWR)
- Evaluate candidate mono-material alternative structures side-by-side
- Receive a ranked physical trial recommendation with full rationale explanation
- Record simulated trial outcomes and receive updated re-optimised recommendations

The platform is designed to support technical decision-making by helping manufacturers identify which feasible trial is likely to provide the greatest learning value — moving the industry from trial-and-error towards evidence-driven packaging development.

### 1.3 Phase 1 Prototype Purpose

The Phase 1 prototype is a technical proof-of-concept environment using controlled and simulated packaging data. It is designed to validate the proposed optimisation methodology and provide a solid technical foundation for future MVP development — without requiring live manufacturing integration.

The Phase 1 prototype will focus on:

- Demonstrating the complete packaging transition workflow end-to-end
- Validating the core Compliance-Constrained Trial Design Engine logic
- Providing an investor-grade demonstration platform
- Establishing the technical architecture for Phase 2 MVP development

The prototype uses simulated and pre-loaded packaging data rather than real-time manufacturing-system integration or proprietary production data.

### 1.4 Subscription Tiers

PolyAxis operates on a SaaS subscription model with three pricing tiers:

| Tier | Price | Target Audience |
|------|-------|----------------|
| **Starter** | £349/month | Smaller packaging manufacturers and technical teams requiring core packaging transition decision-support |
| **Professional** | £539/month | Growing packaging manufacturers requiring broader project management, candidate evaluation, optimisation, and reporting capabilities |
| **Enterprise** | £999/month | Larger packaging manufacturers requiring higher usage capacity, advanced functionality, multiple users, and greater integration potential |

> **Note for Phase 1 prototype:** Subscription tier gating is simulated. The prototype demonstrates the full feature set for demonstration purposes. Tier-locked features are visually indicated but not enforced by a payment gateway.

### 1.5 Project Timeline

**Total Duration:** 3–4 Weeks  
**Start Date:** 14 August 2026  
**Target Delivery:** 11 September 2026

| Phase | Dates | Key Activities |
|-------|-------|---------------|
| **Week 1 — Foundation** | Aug 14–20, 2026 | Backend architecture & API scaffold; Database schema (projects, specifications, materials, constraints); Role-based authentication (Technical User, Administrator); Project Setup module & packaging specification input forms; Data and Scenario Layer (simulated packaging data); Dashboard skeleton with project overview routing |
| **Week 2 — Core Modules** | Aug 21–27, 2026 | Performance Requirements module (barrier, seal, shelf-life); Manufacturing Constraints module (equipment, temperature, line-speed); Regulatory Constraints module (UK EPR, EU PPWR rules); Candidate Materials module (mono-PE, mono-PP, barrier structures); Processing & Constraint Layer (validation, normalisation, feasibility); Candidate Alternatives screen with comparison interface |
| **Week 3 — Optimisation Engine** | Aug 28–Sep 3, 2026 | Trial Candidate Generator (material × process combinations); Compliance-Constrained Trial Design Engine (core scoring logic); Trial ranking by: information gain, cost, feasibility, uncertainty; Recommendation Screen with rationale explanation; Simulated Trial Result module & evidence update loop; Re-optimisation workflow (updated recommendation after result) |
| **Week 4 — Polish & Deploy** | Sep 4–11, 2026 | Project Dashboard (status, candidates, recommended trial, results); UI refinement & investor-grade polish; Mobile-responsive layout & accessibility audit; Bug fixes & end-to-end testing against simulated scenarios; Technical documentation (architecture, data structure, logic); Final deployment-ready build |

### 1.6 Commercial Context

PolyAxis is being developed to support a UK Innovator Founder Visa application and investor demonstration. The Phase 1 prototype must function as a technically credible proof-of-concept that clearly communicates the platform's unique value proposition — the Compliance-Constrained Trial Design Engine — to investors, technical advisors, and prospective customers.

**Core Value Propositions:**
- **Reduced packaging development inefficiency** — prioritise experiments that provide useful information within defined constraints
- **Faster packaging transition decision-making** — one structured workflow across requirements, manufacturing, and regulatory considerations
- **Better use of engineering resources** — structure and compare candidate trials rather than manually assessing every combination
- **Constraint-aware trial selection** — manufacturing and regulatory feasibility considered during trial ranking
- **Greater transparency in trial decisions** — explainable recommendation rationale, not a black-box output
- **Evidence-driven packaging development** — simulated and eventually real trial outcomes feed into subsequent recommendations

---

## 2. Scope of Prototype

### 2.1 In Scope — Phase 1

The Phase 1 prototype will include only the functionality necessary to validate the core technical concept and deliver an investor-grade demonstration of the Compliance-Constrained Trial Design Engine.

#### 2.1.1 Project Management

- Create and manage packaging transition projects
- Enter project name, product type, description, and transition objectives
- Resume and switch between multiple projects (list, view, resume)
- Set key performance targets and transition constraints per project

#### 2.1.2 Packaging Specification Input

- Enter existing packaging structure (material layers, composition)
- Specify product type, current shelf-life, and performance baseline
- Define target packaging requirements and transition objectives
- Record barrier requirement (oxygen, moisture/water vapour)
- Record seal performance requirements (seal integrity, peel strength)
- Record recyclability requirements and target recycling stream
- Select target market and applicable regulatory territory

#### 2.1.3 Performance Requirements Module

- Define technical performance targets: oxygen barrier, water vapour barrier, seal performance, shelf-life
- Enter recyclability percentage target and recycling stream classification
- Define additional technical parameters relevant to the packaging type

#### 2.1.4 Manufacturing Constraints Module

- Enter equipment type and manufacturing compatibility requirements
- Define operating temperature range and processing window
- Specify line-speed range and throughput requirements
- Enter material compatibility constraints with existing production lines

#### 2.1.5 Regulatory Constraints Module

- Select applicable regulatory framework (UK EPR, EU PPWR, both)
- Apply UK Extended Producer Responsibility (EPR) structured rules
- Apply EU Packaging and Packaging Waste Regulation (PPWR) recyclability thresholds
- Recyclability classification rules applied as structured constraint logic

#### 2.1.6 Candidate Materials Module

- Present controlled set of mono-material alternative packaging structures
- Material options include: Mono-PE, Mono-PP, barrier coating structures, alternative barrier structures
- Display material profile per candidate: structure, barrier performance, seal compatibility, recyclability, estimated cost
- Manufacturing compatibility indicator against user-defined constraints
- Regulatory status flag (UK EPR / EU PPWR compliance indicator)
- Side-by-side comparison interface for candidate evaluation

#### 2.1.7 Trial Candidate Generator

- Generate controlled set of potential physical trials from material × process parameter combinations
- Each candidate trial includes: material structure, process conditions, performance targets, estimated cost
- Candidate trial list filtered and ranked before presentation to user

#### 2.1.8 Compliance-Constrained Trial Design Engine

- Constraint checking: validates each candidate against manufacturing and regulatory constraints
- Feasibility filtering: excludes candidates that fail defined constraints
- Trial scoring based on: expected information gain, trial cost, performance uncertainty, manufacturing feasibility, regulatory compliance
- Trial ranking: orders remaining candidates from most to least suitable
- Configurable scoring weights for future refinement

#### 2.1.9 Recommendation & Explanation Module

- Display recommended trial highlighted as the priority next physical experiment
- Show ranked alternative trials with comparative scores
- Display feasibility status for each candidate (pass/fail per constraint)
- Show expected information gain for the recommended trial
- Show estimated trial cost
- Confidence level indicator
- Recommendation rationale — plain-language explanation of why this trial was prioritised

#### 2.1.10 Simulated Trial Result Module & Re-optimisation

- Enter trial result: Performance (pass/fail), Manufacturing (pass/fail), Regulatory (pass/fail)
- Record overall result and failure reason where applicable
- System incorporates the result into the simulated scenario evidence base
- Updated candidate ranking generated incorporating the new trial data
- Updated recommendation with revised rationale displayed

#### 2.1.11 Project Dashboard

- Current packaging structure and target packaging summary
- Candidate alternatives overview with status indicators
- Recommended trial highlight with key metrics
- Trial history and simulated result log
- Updated recommendation following results
- Key constraint summary (manufacturing and regulatory)
- Project progress status

#### 2.1.12 Authentication & Access Control

- Session/token-based authentication system
- Two roles: Technical User, Administrator
- Secure login, session management, logout
- Role-based access to configuration features

### 2.2 Out of Scope — Phase 1

The following features are explicitly excluded from Phase 1 and reserved for future development phases:

| Excluded Feature | Reserved For |
|-----------------|-------------|
| Live manufacturing equipment integration or production-line telemetry | Phase 2+ |
| Real-world manufacturing data collection | Phase 2+ |
| Advanced machine-learning model training or production ML deployment | Phase 2+ |
| Full Manufacturing Process Fingerprinting | Phase 2+ |
| Evidence-Driven Feasible Design-Space Evolution Engine | Phase 2+ |
| Privacy-preserving industry learning network | Phase 3+ |
| Enterprise ERP, PLM, or MES integration | Phase 2+ |
| Full commercial materials database | Phase 2+ |
| Automated regulatory filing or live regulatory API | Phase 2+ |
| Payment processing or commercial customer account management | Phase 2+ |
| Production-scale cloud deployment or enterprise security architecture | Phase 2+ |
| Supplier marketplace | Phase 3+ |

---

## 3. System Architecture

### 3.1 Architecture Overview

The PolyAxis Phase 1 prototype is built as a full-stack web application with a clear separation between the frontend user interface, the backend API and business logic layer, and the data and scenario layer.

```
┌──────────────────────────────────────────────────────┐
│                  FRONTEND (React)                    │
│  7 Core Screens — Tailwind CSS — Responsive Layout  │
└──────────────────┬───────────────────────────────────┘
                   │ REST API (JSON)
┌──────────────────▼───────────────────────────────────┐
│              BACKEND (Node.js / Express)             │
│                                                      │
│  ┌─────────────┐  ┌────────────────────┐             │
│  │ Auth Layer  │  │  PackagingEngine   │             │
│  └─────────────┘  └────────────────────┘             │
│  ┌─────────────────────┐  ┌──────────────────────┐   │
│  │  ConstraintChecker  │  │  CandidateGenerator  │   │
│  └─────────────────────┘  └──────────────────────┘   │
│  ┌──────────────────────────────┐  ┌─────────────┐   │
│  │ TrialOptimisationEngine      │  │  Dashboard  │   │
│  └──────────────────────────────┘  │  Module     │   │
│  ┌──────────────────────────────┐  └─────────────┘   │
│  │    RecommendationEngine      │                    │
│  └──────────────────────────────┘                    │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│           DATA LAYER (JSON File System)              │
│  projects.json │ materials.json │ constraints.json  │
│  trials.json   │ results.json   │ regulations.json  │
└──────────────────────────────────────────────────────┘
```

### 3.2 Technical Layers

#### Layer 1 — Data and Scenario Layer

Provides the simulated packaging transition information required for the prototype.

Contains:
- Existing packaging specifications (example structures per product type)
- Candidate material structures (Mono-PE, Mono-PP, barrier alternatives)
- Performance requirement baselines
- Manufacturing parameter ranges
- Regulatory requirement rules (UK EPR, EU PPWR)
- Trial variable combinations
- Estimated trial costs per combination
- Simulated historical trial outcomes for the re-optimisation demonstration

#### Layer 2 — Processing and Constraint Layer

Validates and structures the supplied information:
- Data validation (required fields, range checks, type checks)
- Parameter normalisation (unit conversion, threshold alignment)
- Requirement comparison (actual vs. target values)
- Constraint classification (manufacturing / regulatory / performance)
- Feasibility checking (pass/fail per constraint type)
- Candidate trial generation from material × process combinations

#### Layer 3 — Trial Optimisation Layer (Core Engine)

The Compliance-Constrained Trial Design Engine evaluates candidate physical trials according to:
- Expected information gain (weighted scoring)
- Trial cost (normalised cost scoring)
- Performance uncertainty (uncertainty reduction estimate)
- Manufacturing feasibility (constraint satisfaction score)
- Regulatory constraints (UK EPR / EU PPWR compliance flag)

Candidate trials are ranked using a configurable weighted scoring formula. The engine runs deterministically using rule-based logic.

#### Layer 4 — User Interface Layer

Presents structured packaging project data, candidate alternatives, constraint status, trial options, trial ranking, expected learning value, estimated cost, and recommendation rationale across 7 core screens.

### 3.3 Backend Module Descriptions

| Module | Responsibility |
|--------|---------------|
| `PackagingEngine` | Manages project creation, packaging specification input, performance requirement storage and retrieval |
| `ConstraintChecker` | Validates candidate trials against manufacturing and regulatory constraint rules; returns pass/fail status per constraint |
| `CandidateGenerator` | Generates candidate material × process trial combinations from the controlled dataset; applies feasibility pre-filter |
| `TrialOptimisationEngine` | Scores and ranks candidate trials using the Compliance-Constrained Trial Design Engine logic; returns ordered candidate list with scores |
| `RecommendationEngine` | Selects the top-ranked trial; generates plain-language rationale explanation; incorporates simulated trial result into evidence base for re-optimisation |
| `DashboardModule` | Aggregates project status, candidate overview, trial history, recommendation summary, and constraint summary for the Project Dashboard screen |

### 3.4 API Structure

All backend routes follow RESTful conventions:

```
POST   /api/auth/login                   — Authentication
POST   /api/auth/logout                  — Session termination

POST   /api/projects                     — Create project
GET    /api/projects                     — List projects
GET    /api/projects/:id                 — Get project detail

POST   /api/projects/:id/specification   — Save packaging specification
GET    /api/projects/:id/specification   — Get packaging specification

POST   /api/projects/:id/requirements    — Save performance requirements
GET    /api/projects/:id/requirements    — Get performance requirements

POST   /api/projects/:id/manufacturing   — Save manufacturing constraints
GET    /api/projects/:id/manufacturing   — Get manufacturing constraints

POST   /api/projects/:id/regulatory      — Save regulatory requirements
GET    /api/projects/:id/regulatory      — Get regulatory requirements

GET    /api/materials                    — Get candidate material list
GET    /api/materials/:id                — Get material profile

POST   /api/projects/:id/run-optimisation — Run Trial Design Engine
GET    /api/projects/:id/recommendation  — Get current recommendation

POST   /api/projects/:id/trial-result    — Submit simulated trial result
GET    /api/projects/:id/trial-results   — Get trial result history
POST   /api/projects/:id/re-optimise     — Re-run optimisation after result

GET    /api/projects/:id/dashboard       — Get dashboard aggregate data

GET    /api/admin/scenarios              — Admin: list demo scenarios
POST   /api/admin/scenarios/reset        — Admin: reset scenario data
```

---

## 4. User Roles & Permissions

### 4.1 Role Overview

The Phase 1 prototype supports two user roles. The role structure is simplified for Phase 1 and does not represent the full commercial user-management system planned for later phases.

| Role | Description |
|------|-------------|
| **Technical User** | Primary prototype user — a packaging engineer or technical specialist who creates and manages packaging transition projects, enters requirements and constraints, reviews candidate alternatives, runs the optimisation engine, and records simulated trial results |
| **Administrator** | System administrator and demonstrator — manages demonstration scenarios and configuration; can reset prototype state for repeat demonstrations |

### 4.2 Technical User — Permissions

| Feature | Access |
|---------|--------|
| Create and manage packaging transition projects | ✅ Full access |
| Enter packaging specification and performance requirements | ✅ Full access |
| Define manufacturing constraints | ✅ Full access |
| Define regulatory requirements | ✅ Full access |
| View and compare candidate material alternatives | ✅ Full access |
| Run Trial Optimisation Engine | ✅ Full access |
| View Trial Recommendation with rationale | ✅ Full access |
| Enter simulated trial results | ✅ Full access |
| View updated recommendation (re-optimisation) | ✅ Full access |
| View Project Dashboard | ✅ Full access |
| Manage demonstration scenarios | ❌ No access |
| Configure materials database | ❌ No access |
| Configure regulatory rules | ❌ No access |
| Reset prototype data | ❌ No access |
| Manage users | ❌ No access |

### 4.3 Administrator — Permissions

| Feature | Access |
|---------|--------|
| All Technical User features | ✅ Full access |
| Manage demonstration scenarios | ✅ Full access |
| Configure example material structures and profiles | ✅ Full access |
| Configure regulatory rules and constraint logic | ✅ Full access |
| Configure manufacturing parameter defaults | ✅ Full access |
| Review prototype outputs and scenario results | ✅ Full access |
| Reset test scenarios to baseline state | ✅ Full access |
| View all projects across the system | ✅ Full access |

### 4.4 Demo User Accounts

The following pre-configured accounts are seeded for prototype demonstration:

| Name | Email | Password | Role | Scenario |
|------|-------|----------|------|----------|
| Alex Chapman | alex.chapman@polyaxis-demo.com | Demo2026! | Technical User | Fresh food packaging transition — PE laminate to Mono-PE |
| Sarah Mitchell | sarah.mitchell@polyaxis-demo.com | Demo2026! | Technical User | Consumer snacks packaging — OPP/PE to Mono-PP |
| James Okafor | james.okafor@polyaxis-demo.com | Demo2026! | Technical User | Industrial wrap — Multi-layer to Barrier Mono-PE |
| Admin User | admin@polyaxis-demo.com | Admin2026! | Administrator | Full system access for configuration and reset |

---

## 5. User Journeys

### 5.1 Overview

The primary Phase 1 prototype user journey follows:

**Create Project → Define Requirements → Select Alternatives → Apply Constraints → Generate Trials → Optimise → Recommend → Simulate Result → Re-optimise → Review Dashboard**

### 5.2 Journey 1 — New Packaging Transition Project (Technical User)

**Actor:** Alex Chapman (Technical User)  
**Scenario:** Fresh food packaging — transitioning from a PE/PA laminate structure to a recyclable Mono-PE alternative

| Step | Screen | Action | Outcome |
|------|--------|---------|---------|
| 1 | Login | Alex logs in with demo credentials | Lands on Project List view |
| 2 | Project Setup | Creates new project "Fresh Food Tray Lidding — PE/PA to Mono-PE"; enters product type (Fresh Food), description, and transition objective | Project record created; enters Packaging Specification step |
| 3 | Project Setup | Enters existing packaging: 80µm PE/PA laminate, 12-month shelf life target, oxygen barrier requirement <5 cc/m²/day, moisture barrier <3 g/m²/day | Specification saved; progress to Requirements step |
| 4 | Requirements & Constraints | Defines performance requirements: OTR target, MVTR target, seal strength minimum, recyclability target ≥70% UK EPR stream | Requirements saved |
| 5 | Requirements & Constraints | Enters manufacturing constraints: Blown film line, temperature 180–220°C, line speed 80–120 m/min, existing seal unit compatibility required | Constraints saved |
| 6 | Requirements & Constraints | Selects regulatory frameworks: UK EPR (mandatory), EU PPWR (optional monitoring) | Regulatory rules applied |
| 7 | Candidate Alternatives | Reviews 4 candidate mono-material alternatives; reviews material profiles for Mono-PE (60µm), Mono-PE (80µm + barrier coating), Mono-PP, HDPE alternative | Materials compared side-by-side; selects 3 for trial generation |
| 8 | Trial Recommendation | Clicks "Run Optimisation" — engine generates candidate trials and scores them; screen displays ranked recommendation list | Recommended trial: Mono-PE 80µm + EVOH barrier coating — highest information gain, UK EPR compliant, within manufacturing temperature window |
| 9 | Trial Recommendation | Reviews rationale explanation: "Mono-PE 80µm with EVOH barrier coating ranked first because it meets OTR and MVTR targets, is compatible with existing blown film line temperature range (186°C processing window), achieves 72% recyclability under UK EPR rules, and has the highest expected information gain at estimated trial cost of £2,400." | Rationale reviewed and understood |
| 10 | Trial Result | Enters simulated trial result: Performance → Pass (OTR 4.2 cc/m²/day ✓), Manufacturing → Fail (seal integrity inconsistent at 188°C), Regulatory → Pass | Result recorded in evidence base |
| 11 | Updated Recommendation | System re-optimises: Mono-PE 80µm with EVOH excluded from ranking due to seal failure; updated recommendation: Mono-PE 80µm with SiOx barrier coating | Re-optimised recommendation with updated rationale explaining result incorporation |
| 12 | Project Dashboard | Reviews full project overview: current vs. target packaging summary, trial history, constraint status, updated recommendation | Full project workflow visible in one screen |

**Journey Duration:** ~15–20 minutes for full demo walkthrough

---

### 5.3 Journey 2 — Repeat Optimisation Cycle (Technical User)

**Actor:** Sarah Mitchell (Technical User)  
**Scenario:** Consumer snacks packaging — OPP/PE laminate to Mono-PP alternative

| Step | Screen | Action | Outcome |
|------|--------|---------|---------|
| 1 | Login | Sarah logs in; resumes existing project "Snack Pouch — OPP/PE to Mono-PP" | Project resumed from last state |
| 2 | Requirements & Constraints | Reviews and updates manufacturing constraints — line-speed range revised to 100–140 m/min | Constraints updated; engine re-ready |
| 3 | Candidate Alternatives | Reviews updated candidate list with revised manufacturing compatibility scores | Updated compatibility indicators reflect new line-speed constraint |
| 4 | Trial Recommendation | Runs optimisation; reviews updated ranking — Mono-PP 50µm now ranked #1 due to higher manufacturing feasibility score at revised line speed | Updated recommendation displayed |
| 5 | Trial Result | Enters second simulated trial result after previous cycle | Updated ranking incorporates two trial outcomes |
| 6 | Updated Recommendation | Reviews second updated recommendation; notes progression through candidate shortlist | Evidence-driven iteration demonstrated |

**Journey Duration:** ~8–10 minutes for iterative demonstration

---

### 5.4 Journey 3 — Administrator Configuration and Reset

**Actor:** Admin User  
**Scenario:** Preparing prototype for a new investor demonstration

| Step | Screen | Action | Outcome |
|------|--------|---------|---------|
| 1 | Login | Admin logs in with administrator credentials | Admin dashboard visible |
| 2 | Admin Panel | Views all active demonstration projects | Full project list with status |
| 3 | Admin Panel | Selects "Reset Scenario" for Alex Chapman's project | Scenario returned to baseline state (spec entered, no trial results) |
| 4 | Admin Panel | Reviews regulatory rules configuration — confirms UK EPR rules are current | Rules confirmed |
| 5 | Admin Panel | Resets all demo scenarios to baseline for clean demonstration | All scenarios reset; demo-ready |

---

### 5.5 Journey 4 — Investor Demonstration Walkthrough

**Actor:** Technical User (with investor observing)  
**Scenario:** End-to-end demonstration of the Compliance-Constrained Trial Design Engine for investor audience

| Step | Action | Investor Observation |
|------|--------|---------------------|
| 1 | Open pre-loaded "Fresh Food Lidding" project | Full project specification pre-entered |
| 2 | Navigate to Requirements & Constraints | Performance, manufacturing, and regulatory requirements displayed clearly |
| 3 | Navigate to Candidate Alternatives | 4 candidate materials displayed with side-by-side comparison |
| 4 | Click "Run Optimisation" on Trial Recommendation screen | Engine processes; ranked trial list with scores appears within 2 seconds |
| 5 | Review recommendation rationale card | Plain-language explanation of priority trial selection |
| 6 | Enter simulated trial result (pre-configured failure scenario) | System acknowledges result; re-optimisation triggered |
| 7 | Navigate to Updated Recommendation | Updated ranked list and revised rationale displayed |
| 8 | Navigate to Project Dashboard | Full project overview — structure, trials, history, recommendation |

**Pre-scripted Demonstration Scenarios:**

| Scenario ID | Name | Description | Key Demo Point |
|-------------|------|-------------|----------------|
| DEMO-01 | Fresh Food Lidding — PE/PA to Mono-PE | Standard transition with clear OTR and MVTR requirements; Mono-PE + EVOH recommended | Engine selects correct trial; rationale is explainable |
| DEMO-02 | Snack Pouch — OPP/PE to Mono-PP | Tight manufacturing line-speed constraint eliminates 2 candidates | Manufacturing feasibility filtering visibly changes ranking |
| DEMO-03 | Industrial Wrap — Multi-layer to Barrier Mono-PE | Regulatory constraint (EU PPWR) eliminates one candidate that passes manufacturing check | Regulatory constraint engine demonstrated independently |
| DEMO-04 | Re-optimisation Cycle | Continuation of DEMO-01 after simulated trial failure | Evidence-driven iterative workflow demonstrated |
| DEMO-05 | Constraint Override | Relaxing manufacturing temperature constraint changes recommended trial | Sensitivity of ranking to constraint parameters demonstrated |

---

## 6. Functional Requirements

### Module 1 — Authentication & Session Management

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| AUTH-01 | System shall provide a secure login screen with email and password fields | High | All roles |
| AUTH-02 | System shall authenticate users against stored credentials and issue a session token | High | JWT-based |
| AUTH-03 | System shall redirect authenticated users to the Project List upon successful login | High | All roles |
| AUTH-04 | System shall display an error message for invalid email/password combinations | High | No detail leak |
| AUTH-05 | System shall support session logout that clears the session token | High | All roles |
| AUTH-06 | System shall timeout inactive sessions after 60 minutes | Medium | Security |
| AUTH-07 | System shall restrict Administrator-only routes and screens to users with the Administrator role | High | RBAC |
| AUTH-08 | System shall maintain session state across page navigations without requiring re-login within the session window | High | UX |

---

### Module 2 — Project Management

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| PROJ-01 | Technical User shall be able to create a new packaging transition project from a dedicated Project Setup screen | High | Core feature |
| PROJ-02 | Project creation shall require: project name, product type, description, and transition objective | High | Required fields |
| PROJ-03 | System shall support the following product types: Fresh Food, Ambient Food, Frozen Food, Consumer Goods, Industrial, Other | High | Dropdown selection |
| PROJ-04 | System shall display a Project List screen showing all projects created by the logged-in user | High | List view |
| PROJ-05 | Project List shall display: project name, product type, creation date, and current workflow progress stage | High | Status indicator |
| PROJ-06 | Technical User shall be able to resume a project by selecting it from the Project List | High | Navigation |
| PROJ-07 | System shall track project workflow progress through defined stages: Specification → Requirements → Materials → Optimisation → Results | High | Stage tracker |
| PROJ-08 | System shall allow editing of previously entered project information at any stage | Medium | Edit capability |
| PROJ-09 | Administrator shall be able to view all projects across all users | High | Admin feature |
| PROJ-10 | Administrator shall be able to reset a project to a defined baseline state for demonstration purposes | High | Demo support |

---

### Module 3 — Packaging Specification & Performance Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| SPEC-01 | System shall provide an Existing Packaging input form capturing: material composition, layer structure, product type, current shelf-life, and current performance baseline | High | Core input |
| SPEC-02 | System shall provide a Target Packaging section capturing: target material type, target recyclability, target regulatory stream, and transition objectives | High | Core input |
| SPEC-03 | System shall capture barrier requirements: Oxygen Transmission Rate (OTR) target in cc/m²/day, and Water Vapour Transmission Rate (WVTR) target in g/m²/day | High | Performance requirements |
| SPEC-04 | System shall capture seal performance requirements: minimum seal strength (N/15mm), seal integrity standard, and peel strength profile | High | Performance requirements |
| SPEC-05 | System shall capture shelf-life requirement in months and product sensitivity classification (standard / moisture-sensitive / oxygen-sensitive) | High | Performance requirements |
| SPEC-06 | System shall capture recyclability requirements: target recyclability percentage, target recycling stream, and recyclability classification priority | High | Regulatory input |
| SPEC-07 | System shall validate all numeric inputs against defined acceptable ranges and display field-level validation errors | High | Validation |
| SPEC-08 | System shall allow the user to save incomplete requirements and return to complete them | Medium | UX |
| SPEC-09 | System shall display a summary card of entered requirements on the Candidate Alternatives and Recommendation screens for reference | Medium | Context display |

---

### Module 4 — Manufacturing Constraints

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| MFG-01 | System shall provide a Manufacturing Constraints input form as part of the Requirements & Constraints screen | High | Core feature |
| MFG-02 | System shall capture equipment type from a predefined list: Blown Film Line, Cast Film Line, Extrusion Coating Line, Flexographic Printing Line, Lamination Line, Rotogravure Line | High | Equipment selection |
| MFG-03 | System shall capture operating temperature range (minimum and maximum °C) as a manufacturing constraint | High | Temperature window |
| MFG-04 | System shall capture line-speed range (minimum and maximum m/min) as a manufacturing constraint | High | Speed constraint |
| MFG-05 | System shall capture material compatibility flag: whether existing production line requires specific material compatibility (e.g., PE-only compatible sealing units) | High | Compatibility check |
| MFG-06 | System shall capture processing window flexibility: whether the constraint is hard (non-negotiable) or soft (preferred but adjustable) | Medium | Scoring input |
| MFG-07 | ConstraintChecker module shall evaluate each candidate trial against manufacturing constraints and return a pass/fail status per constraint dimension | High | Engine dependency |
| MFG-08 | System shall visually indicate which candidate materials are incompatible with the user's manufacturing constraints on the Candidate Alternatives screen | High | UX clarity |
| MFG-09 | System shall allow the user to modify manufacturing constraints and trigger re-evaluation of candidates | Medium | Iterative use |

---

### Module 5 — Regulatory Constraints

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| REG-01 | System shall allow the user to select applicable regulatory frameworks: UK EPR, EU PPWR, or both | High | Framework selection |
| REG-02 | System shall apply UK Extended Producer Responsibility (EPR) recyclability rules as structured logic to each candidate material | High | UK EPR rules engine |
| REG-03 | UK EPR rules shall classify each candidate material as: Recyclable (≥70% collection + sorting + reprocessing), Conditionally Recyclable, or Non-Recyclable for the purposes of packaging compliance | High | Classification logic |
| REG-04 | System shall apply EU Packaging and Packaging Waste Regulation (PPWR) recyclability thresholds to each candidate material | High | EU PPWR rules engine |
| REG-05 | EU PPWR rules shall classify candidate materials against 2030 recyclability design criteria for flexible plastic packaging | High | Threshold logic |
| REG-06 | System shall display a regulatory compliance status flag (✅ Compliant / ⚠️ Conditionally Compliant / ❌ Non-Compliant) for each candidate material per selected framework | High | UX display |
| REG-07 | ConstraintChecker module shall incorporate regulatory compliance status as a binary constraint: candidates failing mandatory regulatory requirements shall be excluded from the ranked trial list | High | Engine constraint |
| REG-08 | System shall display which regulatory rule caused a candidate to be excluded, as part of the recommendation rationale | High | Explainability |
| REG-09 | Administrator shall be able to view and update regulatory rule parameters from the Admin Panel | Medium | Admin configuration |
| REG-10 | Regulatory rules shall be stored as structured data in the JSON layer to allow future update without code changes | High | Maintainability |

---

### Module 6 — Candidate Materials

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| MAT-01 | System shall present a controlled set of candidate mono-material packaging alternatives for the user to review and select for trial generation | High | Core screen |
| MAT-02 | Candidate materials library shall include at minimum: Mono-PE (60µm), Mono-PE (80µm), Mono-PE (80µm + EVOH barrier), Mono-PE (80µm + SiOx barrier), Mono-PP (50µm), Mono-PP (60µm + barrier coating), HDPE (70µm), Bio-based Mono-PE | High | Demo dataset |
| MAT-03 | Each candidate material profile shall display: material name, layer structure, OTR value (cc/m²/day), WVTR value (g/m²/day), seal temperature range (°C), recyclability percentage (UK EPR / EU PPWR), estimated trial cost (£), and typical shelf-life suitability | High | Material profile card |
| MAT-04 | System shall display a manufacturing compatibility indicator for each candidate based on the user's entered manufacturing constraints | High | Cross-module |
| MAT-05 | System shall display a regulatory compliance status flag for each candidate based on the user's selected regulatory frameworks | High | Cross-module |
| MAT-06 | System shall provide a side-by-side comparison view for up to 3 selected candidates simultaneously | High | Comparison UX |
| MAT-07 | User shall be able to select which candidates to include in the trial generation process (minimum 1, maximum all displayed) | High | Selection UI |
| MAT-08 | System shall visually differentiate: compatible + compliant materials (highlighted), incompatible or non-compliant materials (greyed with reason badge), and conditionally compatible materials (amber status) | High | Visual clarity |
| MAT-09 | Administrator shall be able to add, edit, and deactivate materials in the materials library from the Admin Panel | Medium | Admin feature |
| MAT-10 | Materials library shall be stored in structured JSON data to allow future migration to a full materials database in Phase 2 | High | Extensibility |

---

### Module 7 — Trial Candidate Generator

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| TRIAL-01 | System shall generate a set of candidate physical trials from selected materials × applicable process parameter combinations | High | Generator core |
| TRIAL-02 | Each generated candidate trial shall include: trial ID, candidate material, process parameter set (temperature, line speed, seal conditions), performance targets, manufacturing feasibility score, estimated trial cost (£), and expected outcome description | High | Trial record |
| TRIAL-03 | Process parameter combinations shall be drawn from the controlled prototype dataset: minimum 3 parameter profiles per candidate material | High | Data layer |
| TRIAL-04 | Trial generator shall apply the ConstraintChecker to pre-filter candidates before scoring: trials failing hard manufacturing or regulatory constraints shall be excluded with reason recorded | High | Pre-filter |
| TRIAL-05 | System shall generate a minimum of 5 and maximum of 12 candidate trials per optimisation run for demonstration purposes | High | Demo scope |
| TRIAL-06 | Generated trials shall persist in the project record for the duration of the session | High | Persistence |
| TRIAL-07 | System shall display a loading indicator ("Generating candidate trials…") during trial generation | Medium | UX polish |

---

### Module 8 — Compliance-Constrained Trial Design Engine

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| ENGINE-01 | TrialOptimisationEngine shall score each feasible candidate trial against five dimensions: Expected Information Gain, Trial Cost (inverse), Performance Uncertainty Reduction, Manufacturing Feasibility Score, Regulatory Compliance Score | High | Core engine |
| ENGINE-02 | Scoring formula shall apply configurable weighting to each dimension; default weights: Information Gain 30%, Feasibility 25%, Uncertainty Reduction 20%, Regulatory 15%, Cost (inverse) 10% | High | Scoring logic |
| ENGINE-03 | Expected Information Gain shall be calculated as a function of: distance from performance target, current uncertainty level, and the degree to which the trial would resolve a known unknown | High | Gain scoring |
| ENGINE-04 | Manufacturing Feasibility Score shall be calculated as a weighted sum of individual manufacturing constraint pass scores (temperature compatibility, line-speed compatibility, material compatibility) | High | Feasibility scoring |
| ENGINE-05 | Regulatory Compliance Score shall be binary: 1.0 if fully compliant with all selected frameworks; 0.5 if conditionally compliant; 0.0 if non-compliant (non-compliant trials are excluded by TRIAL-04 pre-filter) | High | Regulatory scoring |
| ENGINE-06 | TrialOptimisationEngine shall produce a ranked candidate list ordered from highest to lowest composite score | High | Output |
| ENGINE-07 | Engine shall record the individual dimension scores and composite score for each trial for display in the recommendation rationale | High | Transparency |
| ENGINE-08 | Scoring weights shall be stored as configurable parameters to allow adjustment without code changes | Medium | Configurability |
| ENGINE-09 | Engine shall run deterministically on identical inputs — same inputs shall always produce the same ranked output | High | Consistency |
| ENGINE-10 | Engine shall complete scoring and return ranked results within 3 seconds for a candidate set of up to 12 trials | High | Performance |

---

### Module 9 — Recommendation & Explanation

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| REC-01 | RecommendationEngine shall select the highest-scoring trial from the TrialOptimisationEngine ranked list and designate it as the Primary Recommendation | High | Core output |
| REC-02 | Recommendation screen shall display the Primary Recommendation prominently with: trial name, composite score, estimated cost, expected information gain, confidence indicator | High | Display |
| REC-03 | Recommendation screen shall display up to 4 alternative ranked trials with comparative scores | High | Display |
| REC-04 | Recommendation screen shall display a feasibility status badge per trial for each constraint dimension (Manufacturing ✅/❌, Regulatory ✅/❌, Performance ✅/⚠️) | High | Constraint visibility |
| REC-05 | RecommendationEngine shall generate a plain-language rationale explanation for the Primary Recommendation | High | Explainability |
| REC-06 | Recommendation rationale shall address in plain language: why this trial was ranked first, which constraints it satisfies, what information it is expected to provide, estimated cost, and confidence level | High | Rationale content |
| REC-07 | System shall display which trials were excluded by the constraint filter and which constraint caused the exclusion | High | Transparency |
| REC-08 | Recommendation screen shall display a "Record Trial Result" call-to-action to progress to the Simulated Trial Result module | High | Workflow |
| REC-09 | System shall display a confidence level indicator for the recommendation (High / Medium / Low) based on the gap between the first and second ranked trial composite scores | Medium | Confidence UX |

---

### Module 10 — Simulated Trial Result & Re-optimisation

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| RESULT-01 | System shall provide a Trial Result entry screen for the user to record the outcome of a simulated physical trial | High | Core feature |
| RESULT-02 | Trial Result entry shall capture: Performance result (Pass / Fail), Manufacturing result (Pass / Fail), Regulatory result (Pass / Fail), Overall result (Successful / Unsuccessful), and Failure reason (free text, required if any dimension fails) | High | Result fields |
| RESULT-03 | System shall optionally capture quantitative result data: measured OTR, measured WVTR, measured seal strength, and notes | Medium | Optional detail |
| RESULT-04 | On submission of a trial result, RecommendationEngine shall incorporate the result into the evidence base and recalculate the ranking of remaining candidate trials | High | Re-optimisation |
| RESULT-05 | A trial that produced a manufacturing failure shall be assigned a reduced feasibility score in the re-optimised ranking; a full failure shall result in exclusion from the updated ranked list | High | Evidence update logic |
| RESULT-06 | Updated Recommendation screen shall display the revised ranked list with an updated Primary Recommendation and updated rationale | High | Display |
| RESULT-07 | Updated Recommendation rationale shall explicitly reference the previous trial result in the explanation ("Following the Mono-PE 80µm EVOH trial which failed on seal integrity, the ranking has been updated...") | High | Explainability |
| RESULT-08 | System shall maintain a Trial History log showing all trials run, results recorded, and recommendations generated in sequence | High | History |
| RESULT-09 | User shall be able to enter multiple trial results in sequence to demonstrate iterative evidence-driven optimisation | High | Iterative demo |
| RESULT-10 | System shall display a "Trial History" view on the Project Dashboard showing the full result log in chronological order | High | Dashboard integration |

---

### Module 11 — Project Dashboard

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| DASH-01 | System shall provide a Project Dashboard screen accessible at any point in the workflow | High | Core screen |
| DASH-02 | Dashboard shall display: project name, product type, and transition objective | High | Project summary |
| DASH-03 | Dashboard shall display a workflow progress tracker showing completion status of each stage (Specification / Requirements / Materials / Optimisation / Results) | High | Progress UX |
| DASH-04 | Dashboard shall display a Current Packaging vs. Target Packaging summary section | High | Specification summary |
| DASH-05 | Dashboard shall display a Candidate Alternatives summary: total candidates evaluated, compatible count, excluded count, and candidate status overview | High | Candidates summary |
| DASH-06 | Dashboard shall display the Current Primary Recommendation as a summary card: trial name, score, estimated cost, and rationale excerpt | High | Recommendation summary |
| DASH-07 | Dashboard shall display a Trial History section showing all completed trial result entries in chronological order | High | History display |
| DASH-08 | Dashboard shall display a Key Constraints summary: active manufacturing constraints and active regulatory constraints in a compact format | High | Constraint summary |
| DASH-09 | Dashboard data shall refresh upon return to the Dashboard screen without requiring a manual page reload | Medium | Data freshness |
| DASH-10 | Dashboard shall provide navigation links to all major workflow screens | High | Navigation hub |

---

### Module 12 — Administrator Panel

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| ADMIN-01 | Administrator shall access an Admin Panel via a dedicated admin navigation route | High | Admin feature |
| ADMIN-02 | Admin Panel shall display all registered projects across all users with status summary | High | Oversight |
| ADMIN-03 | Administrator shall be able to reset any project to a baseline demonstration state (specification pre-entered, no trial results) | High | Demo preparation |
| ADMIN-04 | Administrator shall be able to reset all demonstration projects simultaneously to baseline state | High | Batch reset |
| ADMIN-05 | Administrator shall be able to view and edit material profiles in the candidate materials library | Medium | Configuration |
| ADMIN-06 | Administrator shall be able to enable or disable individual candidate materials from the demonstration dataset | Medium | Demo control |
| ADMIN-07 | Administrator shall be able to view regulatory rule parameters and update threshold values | Medium | Rule management |
| ADMIN-08 | Administrator shall be able to configure optimisation scoring weights from the Admin Panel | Medium | Engine config |
| ADMIN-09 | Admin Panel shall display a system status summary: active sessions, number of projects, last reset timestamp | Medium | System overview |

---

## 7. UI/UX Screen Inventory

The Phase 1 prototype delivers 7 core application screens plus the Login screen and Admin Panel, totalling 9 screens.

### Screen Inventory

| Screen ID | Screen Name | Route | Role Access | Description |
|-----------|-------------|-------|-------------|-------------|
| S-00 | Login | `/login` | All | Email/password authentication |
| S-01 | Project List | `/projects` | Technical User, Admin | All user projects with status and progress |
| S-02 | Project Setup | `/projects/new` or `/projects/:id/setup` | Technical User, Admin | Create project, enter existing packaging specification, set transition objectives |
| S-03 | Requirements & Constraints | `/projects/:id/requirements` | Technical User, Admin | Performance requirements, manufacturing constraints, regulatory framework selection |
| S-04 | Candidate Alternatives | `/projects/:id/materials` | Technical User, Admin | Candidate material profiles, compatibility indicators, side-by-side comparison |
| S-05 | Trial Recommendation | `/projects/:id/recommendation` | Technical User, Admin | Ranked trial list, primary recommendation, feasibility status, rationale explanation |
| S-06 | Trial Result | `/projects/:id/trial-result` | Technical User, Admin | Simulated trial result entry form (performance, manufacturing, regulatory, notes) |
| S-07 | Updated Recommendation | `/projects/:id/updated-recommendation` | Technical User, Admin | Revised ranked list and updated rationale after trial result incorporation |
| S-08 | Project Dashboard | `/projects/:id/dashboard` | Technical User, Admin | Full project overview — specification, candidates, recommendation, trial history, constraints |
| S-09 | Admin Panel | `/admin` | Admin only | Project management, scenario reset, materials config, regulatory rules, scoring weights |

---

### S-00 — Login

**Layout:** Centred card on branded background

**Elements:**
- PolyAxis logo and product name
- Email input field
- Password input field
- "Sign In" primary button
- Error message area (invalid credentials)
- Version number in footer

**Behaviour:** Successful login redirects to S-01 Project List. Failed login shows error without revealing which field is incorrect.

---

### S-01 — Project List

**Layout:** Header with navigation; full-width project card list

**Elements:**
- Page title: "Packaging Transition Projects"
- "New Project" primary CTA button
- Project cards (one per project):
  - Project name
  - Product type badge
  - Creation date
  - Workflow progress bar (5 stages)
  - Current stage label
  - "Resume" / "View Dashboard" action buttons
- Empty state: "No projects yet — create your first packaging transition project"

---

### S-02 — Project Setup

**Layout:** Two-column form with progress stepper at top

**Sections:**

**Project Information:**
- Project name (text input, required)
- Product type (dropdown: Fresh Food / Ambient Food / Frozen Food / Consumer Goods / Industrial / Other)
- Description (textarea)
- Transition objective (textarea — "We are transitioning from [X] to [Y] in order to [Z]")

**Existing Packaging Specification:**
- Current material description (text)
- Layer structure summary (text)
- Current shelf-life (numeric, months)
- Current OTR (numeric, cc/m²/day)
- Current WVTR (numeric, g/m²/day)
- Current recyclability status (dropdown: Recyclable / Non-Recyclable / Unknown)

**Target Packaging:**
- Target material type (text)
- Target recyclability % (numeric, %)
- Target recycling stream (dropdown: UK EPR Household / UK EPR Industrial / EU PPWR / Other)
- Transition priority (dropdown: Recyclability / Cost / Performance / Regulatory)

**Navigation:** "Save & Continue to Requirements →" primary button; "Save Draft" secondary button

---

### S-03 — Requirements & Constraints

**Layout:** Tabbed layout — three tabs: Performance Requirements | Manufacturing Constraints | Regulatory Frameworks

**Tab 1 — Performance Requirements:**
- OTR target (numeric input, cc/m²/day)
- WVTR target (numeric input, g/m²/day)
- Seal strength minimum (numeric, N/15mm)
- Shelf-life requirement (numeric, months)
- Product sensitivity (dropdown: Standard / Moisture-Sensitive / Oxygen-Sensitive / Both)
- Recyclability target (numeric, %)
- Additional parameters (free text)

**Tab 2 — Manufacturing Constraints:**
- Equipment type (multi-select dropdown)
- Operating temperature range: Min °C — Max °C
- Line speed range: Min m/min — Max m/min
- Material compatibility (text input — e.g., "PE-compatible sealing unit only")
- Processing window flexibility (radio: Hard constraint / Soft preference)

**Tab 3 — Regulatory Frameworks:**
- UK EPR (toggle — ON/OFF) — if ON, UK EPR rules applied
- EU PPWR (toggle — ON/OFF) — if ON, EU PPWR rules applied
- Recyclability classification priority (dropdown: UK EPR / EU PPWR / Most Restrictive)
- Regulatory notes (free text)

**Navigation:** "Save & Continue to Candidate Alternatives →"; "← Back to Project Setup"

---

### S-04 — Candidate Alternatives

**Layout:** Header with project spec summary card; material cards grid (2 or 3 columns); comparison panel (slide-in)

**Material Card elements:**
- Material name and structure description
- OTR value badge (green/amber/red vs. target)
- WVTR value badge (green/amber/red vs. target)
- Seal temperature range
- Recyclability % badge (with UK EPR / EU PPWR flag)
- Estimated trial cost (£)
- Manufacturing compatibility badge (✅ Compatible / ⚠️ Conditional / ❌ Incompatible — with reason)
- Regulatory status badge (✅ Compliant / ⚠️ Conditional / ❌ Non-Compliant)
- "Add to Comparison" secondary button
- Selection checkbox for trial generation

**Comparison Panel (slide-in from right):**
- Side-by-side view of up to 3 selected materials
- Row-by-row comparison for each attribute
- Highlight column with best value per row

**Footer actions:** "Generate Trials & Optimise →" primary CTA (active when ≥1 material selected); candidate count indicator ("3 of 6 candidates selected")

---

### S-05 — Trial Recommendation

**Layout:** Primary recommendation card (top); ranked alternatives list (below); excluded trials section (collapsed, expandable)

**Primary Recommendation Card:**
- Trial name and material
- Composite score (large display, e.g., "87 / 100")
- Confidence badge (High / Medium / Low)
- Estimated trial cost (£)
- Expected Information Gain indicator (High / Medium / Low)
- Dimension score breakdown: Information Gain, Feasibility, Uncertainty Reduction, Regulatory, Cost (5-bar visual)
- Rationale text block (plain-language explanation, 3–5 sentences)
- Constraint status grid (Manufacturing ✅/❌, Regulatory ✅/❌, Performance ✅/⚠️)

**Alternative Trials List:**
- Ranked rows (2nd, 3rd, 4th, 5th)
- Per row: rank, trial name, composite score, estimated cost, feasibility indicators
- Expandable row: shows individual dimension scores

**Excluded Trials Section:**
- Collapsed by default; "Show excluded candidates" toggle
- Per excluded trial: name, exclusion reason (which constraint failed)

**CTA:** "Record Simulated Trial Result →" primary button

---

### S-06 — Trial Result

**Layout:** Form card with trial context summary header

**Context Header:**
- Recommended trial name (pre-populated)
- Trial cost estimate
- Performance targets reminder

**Result Entry Form:**
- Performance result: Pass / Fail (radio)
- Manufacturing result: Pass / Fail (radio)
- Regulatory result: Pass / Fail (radio)
- Overall result: Successful / Unsuccessful (radio — auto-set but editable)
- Failure reason (textarea — required if any dimension = Fail)
- Optional: Measured OTR (numeric), Measured WVTR (numeric), Measured seal strength (numeric)
- Notes (free text, optional)
- Date of trial (date picker — defaults to today)

**CTA:** "Submit Result & Re-optimise →" primary button; "← Back to Recommendation" secondary

---

### S-07 — Updated Recommendation

**Layout:** Identical structure to S-05 but with Evidence Update banner at top

**Evidence Update Banner:**
- "Recommendation updated following [Trial Name] result"
- Outcome summary: "Performance: ✅ | Manufacturing: ❌ | Regulatory: ✅ | Overall: Unsuccessful"
- "Previous recommendation has been deprioritised. Updated ranking below."

**Updated Primary Recommendation Card:**
- Same structure as S-05
- Rationale explicitly references previous trial outcome

**Updated Alternatives List:**
- Same structure as S-05
- Previous recommended trial appears with reduced score or excluded (with reason)

**CTA:** "Record Another Trial Result →" OR "View Project Dashboard →"

---

### S-08 — Project Dashboard

**Layout:** 4-column grid on desktop; single-column stack on mobile

**Section 1 — Project Header:**
- Project name, product type, transition objective
- Workflow progress bar (5 stages with completion status)

**Section 2 — Packaging Summary:**
- Existing packaging spec card (material, OTR, WVTR, shelf-life)
- Target packaging spec card (target material, recyclability %, stream)

**Section 3 — Candidates Overview:**
- Total candidates evaluated
- Compatible count, excluded count
- Status bar (visual breakdown)

**Section 4 — Current Recommendation:**
- Trial name, score, cost, confidence
- Rationale excerpt (truncated)
- "View Full Recommendation" link

**Section 5 — Key Constraints:**
- Manufacturing constraints summary (compact list)
- Regulatory frameworks active (badges)

**Section 6 — Trial History:**
- Chronological table: Trial name | Date | Performance | Manufacturing | Regulatory | Overall
- "No trials recorded yet" empty state

**Section 7 — Quick Actions:**
- Links to: Resume Requirements, View Recommendation, Record Trial Result

---

### S-09 — Admin Panel

**Layout:** Left sidebar navigation; main content area

**Sidebar navigation items:**
- All Projects
- Materials Library
- Regulatory Rules
- Scoring Weights
- System Status
- Reset Scenarios

**All Projects view:** Table of all user projects with reset action per row and batch reset button.

**Materials Library view:** List of materials with edit/disable controls.

**Regulatory Rules view:** UK EPR and EU PPWR rule parameters with edit controls.

**Scoring Weights view:** Five dimension weight sliders (must sum to 100%).

**System Status view:** Active sessions, last reset time, data file sizes.

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Requirement | Target |
|-------------|--------|
| Page load time (initial) | < 2 seconds on standard broadband |
| API response time (standard GET/POST) | < 500ms |
| Trial Optimisation Engine run time (up to 12 candidates) | < 3 seconds |
| Dashboard data load | < 1.5 seconds |
| Re-optimisation after trial result | < 3 seconds |

### 8.2 Reliability

| Requirement | Target |
|-------------|--------|
| Prototype availability during demonstration sessions | 99.5% (no unplanned downtime) |
| Data persistence | All project data persists across browser sessions via JSON file storage |
| Error handling | All API errors return structured JSON error responses with user-friendly messages on screen |
| Form state preservation | In-progress form data shall not be lost on page navigation within the same session |

### 8.3 Usability

| Requirement | Standard |
|-------------|----------|
| Responsive layout | Functional on desktop (1280px+), tablet (768px+), and mobile (375px+) |
| Navigation clarity | Active screen highlighted in navigation; breadcrumb or stage stepper visible at all times |
| Loading states | All async operations (optimisation run, data save) display a loading indicator |
| Empty states | All list and dashboard views display meaningful empty state messages with guidance |
| Validation feedback | All form validation errors displayed inline at field level with descriptive messages |
| Accessibility | Meets WCAG 2.1 AA colour contrast standards; keyboard navigation supported on primary flows |

### 8.4 Security

| Requirement | Standard |
|-------------|----------|
| Authentication | JWT-based session token; tokens expire after 60 minutes of inactivity |
| Password storage | Passwords hashed using bcrypt (minimum cost factor 10) |
| API protection | All API routes (except `/api/auth/login`) require valid session token |
| Admin route protection | All `/api/admin/*` routes restricted to Administrator role |
| Input sanitisation | All user inputs sanitised server-side before storage |
| CORS | Restricted to the configured frontend origin |

### 8.5 Maintainability

| Requirement | Standard |
|-------------|----------|
| Code structure | Modular backend services (one file per module); component-based React frontend |
| Configuration | Environment variables for: port, JWT secret, data file paths, scoring weights |
| Data extensibility | JSON data structures designed to mirror future relational database schema (field names, relationships consistent) |
| Scoring configurability | Optimisation weights configurable without code changes; stored as editable JSON |

---

## 9. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | React 18 | Component-based SPA |
| **UI Framework** | Tailwind CSS | Utility-first styling; custom PolyAxis design tokens |
| **State Management** | React Context API + useState | Lightweight state; no Redux required for Phase 1 |
| **Routing** | React Router v6 | Client-side navigation with protected route wrappers |
| **HTTP Client** | Axios | API communication with interceptors for auth token injection |
| **Backend** | Node.js + Express.js | RESTful API server |
| **Authentication** | JWT (jsonwebtoken) + bcrypt | Token-based sessions; password hashing |
| **Data Storage** | JSON File System | `projects.json`, `materials.json`, `regulations.json`, `constraints.json`, `trials.json`, `results.json`, `users.json` |
| **File I/O** | Node.js `fs` module | Synchronous reads for Phase 1; designed for PostgreSQL migration in Phase 2 |
| **Backend Modules** | PackagingEngine, ConstraintChecker, CandidateGenerator, TrialOptimisationEngine, RecommendationEngine, DashboardModule | Custom modular services |
| **Optimisation Logic** | Rule-based weighted scoring engine (JavaScript) | Configurable; designed for ML integration in Phase 2 |
| **Realtime Updates** | Interval-based data refresh | Pseudo-realtime dashboard updates; no WebSocket required in Phase 1 |
| **Deployment** | Node.js process (Express static serve for frontend build) | Single deployable unit; environment-ready configuration |
| **Environment Config** | `.env` file + `dotenv` | Port, JWT secret, data paths, scoring weights |

---

### 9.1 Module Dependency Map

```
Frontend (React)
    │
    ├── Project Management UI ──→ PackagingEngine API
    ├── Requirements & Constraints UI ──→ PackagingEngine API
    ├── Candidate Alternatives UI ──→ PackagingEngine API + ConstraintChecker
    ├── Trial Recommendation UI ──→ CandidateGenerator + TrialOptimisationEngine + RecommendationEngine
    ├── Trial Result UI ──→ RecommendationEngine (evidence update)
    ├── Updated Recommendation UI ──→ RecommendationEngine (re-optimisation output)
    └── Dashboard UI ──→ DashboardModule (aggregates all above)

Backend Services Dependency:
    CandidateGenerator ──→ ConstraintChecker ──→ PackagingEngine data
    TrialOptimisationEngine ──→ CandidateGenerator output
    RecommendationEngine ──→ TrialOptimisationEngine output
    DashboardModule ──→ PackagingEngine + RecommendationEngine + Results store
```

---

## 10. Data & Privacy

### 10.1 Data Stored

The PolyAxis Phase 1 prototype stores the following data in JSON file storage:

| Data Category | File | Contents |
|---------------|------|----------|
| User accounts | `users.json` | User ID, name, email, hashed password, role, created date |
| Projects | `projects.json` | Project ID, user ID, project name, product type, description, objective, stage progress, created/updated timestamps |
| Packaging specifications | `specifications.json` | Existing packaging data, target packaging data, shelf-life, product sensitivity — per project |
| Performance requirements | `requirements.json` | OTR, WVTR, seal strength, recyclability targets — per project |
| Manufacturing constraints | `manufacturing.json` | Equipment type, temperature range, line speed, material compatibility, constraint flexibility — per project |
| Regulatory requirements | `regulatory.json` | Selected frameworks, classification priority — per project |
| Candidate materials library | `materials.json` | Material profiles: name, structure, OTR, WVTR, recyclability, cost, compatibility data |
| Candidate trials | `trials.json` | Generated trial records: trial ID, material, process parameters, scores, ranking — per project |
| Trial results | `results.json` | Submitted trial outcomes: performance, manufacturing, regulatory, failure reason, notes — per project |
| Regulatory rules | `regulations.json` | UK EPR and EU PPWR rule parameters (admin-configurable) |
| Scoring weights | `scoring.json` | Optimisation dimension weights (admin-configurable) |

### 10.2 Data Not Stored

- No real manufacturing data or production telemetry
- No proprietary packaging formulations or trade secrets
- No payment card information or billing data
- No real regulatory filings or compliance records
- No personal data beyond demo user accounts (which use fictitious names)

### 10.3 Prototype Data Notice

All data in the Phase 1 prototype is simulated or fictitious:
- Demo user accounts use fictitious names and placeholder email addresses
- Packaging specifications are based on publicly documented material structures
- Material performance values are indicative and based on published technical literature
- Regulatory classification rules are representative of UK EPR and EU PPWR frameworks as of 2026 but are not legal advice

### 10.4 Data Architecture for Phase 2 Migration

JSON data structures are designed to mirror a future relational database schema:
- Each JSON object uses consistent field naming and ID conventions suitable for a PostgreSQL table
- Foreign key relationships (e.g., project_id on all specification records) are maintained in the JSON layer
- No JSON-specific nesting structures that would require transformation on migration
- All timestamps stored in ISO 8601 format

---

## 11. Demo Data & Simulation Layer

### 11.1 Pre-loaded Demo Projects

The following pre-configured projects are seeded for demonstration:

#### Project 1 — Fresh Food Tray Lidding Transition (Primary Demo Project)

**User:** Alex Chapman (alex.chapman@polyaxis-demo.com)

| Field | Value |
|-------|-------|
| Project name | Fresh Food Tray Lidding — PE/PA to Mono-PE |
| Product type | Fresh Food |
| Existing packaging | 80µm PE/PA laminate (12-layer co-extrusion) |
| Current OTR | 2.1 cc/m²/day |
| Current WVTR | 1.8 g/m²/day |
| Current shelf-life | 12 days (fresh produce) |
| Target packaging | Recyclable Mono-PE alternative |
| Target recyclability | ≥70% UK EPR Household stream |
| OTR target | <5.0 cc/m²/day |
| WVTR target | <3.0 g/m²/day |
| Equipment type | Blown Film Line |
| Temperature range | 180–220°C |
| Line speed | 80–120 m/min |
| Regulatory | UK EPR (mandatory) + EU PPWR (monitoring) |

**Pre-loaded trial result (Round 1):**
- Trial: Mono-PE 80µm + EVOH barrier coating
- Performance: Pass (OTR 4.2 ✓)
- Manufacturing: Fail (seal integrity inconsistent at 188°C)
- Regulatory: Pass
- Overall: Unsuccessful
- Failure reason: Seal unit temperature variance caused inconsistent seal formation at target line speed

---

#### Project 2 — Snack Pouch Transition (Secondary Demo Project)

**User:** Sarah Mitchell (sarah.mitchell@polyaxis-demo.com)

| Field | Value |
|-------|-------|
| Project name | Snack Pouch — OPP/PE to Mono-PP |
| Product type | Ambient Food |
| Existing packaging | OPP/PE laminate (2-layer) |
| Current shelf-life | 6 months |
| Target packaging | Mono-PP recyclable alternative |
| Target recyclability | ≥70% UK EPR |
| Equipment type | Cast Film Line |
| Temperature range | 160–190°C |
| Line speed | 100–140 m/min |
| Regulatory | UK EPR only |

---

#### Project 3 — Industrial Wrap Transition (Regulatory Demo Project)

**User:** James Okafor (james.okafor@polyaxis-demo.com)

| Field | Value |
|-------|-------|
| Project name | Industrial Stretch Wrap — Multi-layer to Barrier Mono-PE |
| Product type | Industrial |
| Existing packaging | Multi-layer PE/EVA composite |
| Target packaging | Barrier Mono-PE (EU PPWR compliant) |
| Target recyclability | ≥80% EU PPWR threshold |
| Equipment type | Blown Film Line |
| Regulatory | EU PPWR (mandatory) + UK EPR (monitoring) |

---

### 11.2 Candidate Materials Library

| Material ID | Material Name | OTR (cc/m²/day) | WVTR (g/m²/day) | Seal Temp (°C) | UK EPR Recyclability | Trial Cost (£) |
|-------------|--------------|-----------------|-----------------|----------------|---------------------|---------------|
| MAT-001 | Mono-PE 60µm | 8.5 | 4.2 | 110–130 | 65% (Conditional) | £1,800 |
| MAT-002 | Mono-PE 80µm | 6.8 | 3.5 | 115–135 | 68% (Conditional) | £2,100 |
| MAT-003 | Mono-PE 80µm + EVOH barrier | 1.8 | 1.2 | 120–145 | 72% (Compliant) | £2,400 |
| MAT-004 | Mono-PE 80µm + SiOx barrier | 2.4 | 1.8 | 115–140 | 74% (Compliant) | £2,600 |
| MAT-005 | Mono-PP 50µm | 12.0 | 6.5 | 130–155 | 71% (Compliant) | £1,900 |
| MAT-006 | Mono-PP 60µm + barrier coating | 4.2 | 2.8 | 135–160 | 73% (Compliant) | £2,300 |
| MAT-007 | HDPE 70µm | 5.1 | 3.1 | 125–150 | 70% (Compliant) | £2,000 |
| MAT-008 | Bio-based Mono-PE 75µm | 7.2 | 3.8 | 112–132 | 69% (Conditional) | £3,100 |

---

### 11.3 Pre-Scripted Demonstration Scenarios

#### DEMO-01 — Standard Recommendation (Core Demo)

**Setup:** Project 1 (Fresh Food Lidding) — no prior trial results  
**Expected Engine Output:** MAT-003 (Mono-PE 80µm + EVOH) recommended as Priority Trial  
**Key Demo Points:**
- Temperature range (180–220°C) eliminates Mono-PP options (seal temp too high)
- EVOH barrier achieves OTR 1.8 vs. target <5.0 — highest margin
- UK EPR 72% passes ≥70% threshold
- Rationale clearly explains: barrier performance, manufacturing compatibility, regulatory compliance, information gain

**Expected Recommendation Rationale Text:**
> "Mono-PE 80µm with EVOH barrier coating is recommended as the priority trial because it achieves the highest expected information gain for this packaging transition. Its OTR of 1.8 cc/m²/day provides a significant margin against your 5.0 cc/m²/day target, and its processing temperature range (120–145°C) is fully compatible with your blown film line operating window of 180–220°C. It achieves 72% recyclability under UK EPR household stream classification, meeting your ≥70% target. Estimated trial cost: £2,400. Confidence: High."

---

#### DEMO-02 — Manufacturing Constraint Filter (Constraint Demo)

**Setup:** Project 2 (Snack Pouch) — line speed revised to 100–140 m/min  
**Expected Engine Output:** Mono-PP 50µm ranked #1; MAT-003 EVOH and MAT-004 SiOx excluded (seal temperature above cast film line operating range)  
**Key Demo Points:**
- Manufacturing constraint engine visibly changes ranking vs. DEMO-01
- Cast film line exclusion of higher-temperature materials
- Feasibility filter working correctly

---

#### DEMO-03 — Regulatory Constraint Exclusion (Regulatory Demo)

**Setup:** Project 3 (Industrial Wrap) — EU PPWR mandatory, 80% recyclability target  
**Expected Engine Output:** MAT-001, MAT-002, MAT-008 excluded (below 70% UK EPR / EU PPWR threshold); MAT-004 (SiOx 74%) passes but ranked below MAT-003 (EVOH 72%) due to cost differential  
**Key Demo Points:**
- Regulatory constraint engine operating independently of manufacturing constraints
- EU PPWR rules applied correctly
- Excluded candidates shown with regulatory failure reason

---

#### DEMO-04 — Re-optimisation After Trial Result (Evidence Demo)

**Setup:** Continue from DEMO-01 after entering Round 1 trial result (MAT-003 EVOH — Manufacturing Fail)  
**Expected Engine Output:** MAT-003 excluded from updated ranking; MAT-004 (Mono-PE 80µm + SiOx) becomes new #1 recommendation  
**Key Demo Points:**
- Evidence-driven re-optimisation demonstrated
- Updated rationale explicitly references previous trial failure
- Iterative nature of the workflow shown

---

#### DEMO-05 — Constraint Sensitivity (Interactive Demo)

**Setup:** DEMO-01 project — live demonstration of modifying manufacturing temperature constraint  
**Demonstration Action:** Change temperature range from 180–220°C to 160–180°C live during demo  
**Expected Engine Output:** Some candidates excluded due to tightened temperature window; ranking shifts  
**Key Demo Points:**
- Real-time constraint sensitivity
- Engine responds immediately to constraint changes
- Value of structured constraint modelling vs. spreadsheet approach

---

## 12. Acceptance Criteria

### 12.1 Acceptance Criteria (Must Pass)

The prototype must satisfy all of the following criteria to be accepted as complete:

#### Authentication & Access
- [ ] Login screen loads and accepts valid credentials; redirects to Project List
- [ ] Invalid credentials display error message without revealing which field is incorrect
- [ ] Technical User cannot access Admin Panel routes; receives 403 response
- [ ] Session expires after 60 minutes of inactivity; user redirected to login

#### Project Management
- [ ] New project can be created with all required fields
- [ ] Created project appears on Project List with correct progress stage
- [ ] Project can be resumed from Project List; returns to last active screen
- [ ] Packaging specification, requirements, constraints, and regulatory fields save correctly and persist on page reload

#### Candidate Materials
- [ ] Candidate Alternatives screen displays all 8 materials with correct profiles
- [ ] Manufacturing compatibility badges correctly reflect user's entered constraints
- [ ] Regulatory compliance flags correctly reflect user's selected frameworks
- [ ] Side-by-side comparison view displays correctly for up to 3 materials

#### Trial Optimisation Engine
- [ ] "Run Optimisation" generates a ranked list of candidate trials within 3 seconds
- [ ] Materials failing manufacturing constraints are excluded with reason displayed
- [ ] Materials failing regulatory constraints are excluded with reason displayed
- [ ] Primary recommendation is the highest composite-scored candidate
- [ ] Recommendation rationale references barrier performance, manufacturing compatibility, regulatory compliance, estimated cost, and expected information gain
- [ ] Confidence indicator reflects score gap between #1 and #2 ranked trials
- [ ] Identical inputs produce identical ranking output on repeat runs

#### Simulated Trial Result & Re-optimisation
- [ ] Trial Result form accepts pass/fail inputs for all three dimensions
- [ ] Failure reason field is required when any dimension = Fail
- [ ] Submitting a trial result triggers re-optimisation within 3 seconds
- [ ] Updated Recommendation screen references previous trial result in rationale
- [ ] Trial with manufacturing failure has reduced score or is excluded in updated ranking
- [ ] Trial History log records all submitted results in chronological order

#### Project Dashboard
- [ ] Project Dashboard displays all 7 sections with correct data
- [ ] Current Recommendation summary reflects latest optimisation result
- [ ] Trial History table shows all results entered
- [ ] Key Constraints summary shows correct manufacturing and regulatory constraints

#### Admin Panel
- [ ] Administrator can log in and access Admin Panel
- [ ] Reset Scenario function resets a project to baseline state correctly
- [ ] Batch Reset function resets all demonstration projects simultaneously

#### Pre-scripted Scenarios
- [ ] DEMO-01 produces MAT-003 (Mono-PE 80µm + EVOH) as #1 recommendation
- [ ] DEMO-02 produces correct exclusions when line speed is 100–140 m/min on Cast Film Line
- [ ] DEMO-03 produces correct regulatory exclusions under EU PPWR mandatory setting
- [ ] DEMO-04 produces MAT-004 (SiOx) as updated #1 after MAT-003 manufacturing failure
- [ ] DEMO-05 produces changed ranking when temperature constraint is tightened live

#### General
- [ ] All 7 core screens load without JavaScript errors on Chrome, Firefox, and Safari
- [ ] All screens are functional on mobile (375px width) and tablet (768px width)
- [ ] All loading states display correctly during async operations
- [ ] All empty states display meaningful guidance messages
- [ ] Form validation prevents submission of missing required fields with clear error messages

---

### 12.2 Rejection Criteria (Automatic Rejection)

The prototype will be rejected if any of the following conditions are present:

| Condition | Reason |
|-----------|--------|
| Trial Optimisation Engine produces incorrect ranking on DEMO-01 scenario | Core engine validation failure |
| Regulatory constraints are not applied to candidate exclusion | Core feature failure |
| Manufacturing constraints are not applied to candidate exclusion | Core feature failure |
| Re-optimisation does not reference or incorporate previous trial result | Evidence-update logic failure |
| Admin Reset does not restore project to baseline state | Demo preparation failure |
| Any core screen produces a JavaScript error or white screen on load | Stability failure |
| Primary recommendation rationale does not explain the basis for the recommendation | Explainability requirement failure |
| Session authentication can be bypassed without valid credentials | Security failure |

---

## 13. Deliverables & Handover

### 13.1 Functional Deliverables

| Deliverable | Description |
|-------------|-------------|
| PolyAxis Phase 1 Prototype Web Application | Fully functional web application covering the complete packaging transition workflow |
| Compliance-Constrained Trial Design Engine | Node.js backend optimisation engine (TrialOptimisationEngine module) |
| Frontend Application | React + Tailwind CSS application (7 core screens + Login + Admin Panel) |
| Packaging Requirements & Performance Module | PackagingEngine backend module + Requirements & Constraints screen |
| Manufacturing & Regulatory Constraints Module | ConstraintChecker module with UK EPR and EU PPWR rule logic |
| Candidate Materials Module | Materials library + Candidate Alternatives screen with comparison interface |
| Trial Optimisation, Ranking & Recommendation Engine | TrialOptimisationEngine + RecommendationEngine modules + Recommendation screen |
| Simulated Trial Result Module & Re-optimisation Workflow | Result entry form + evidence update logic + Updated Recommendation screen |
| Project Dashboard | DashboardModule + Project Dashboard screen with full workflow overview |

### 13.2 Data Deliverables

| Deliverable | Description |
|-------------|-------------|
| Prototype Dataset | JSON data files: 8 candidate materials, 3 pre-loaded demo projects, 5 regulatory rule sets, process parameter profiles, simulated trial outcomes |
| Seed Script | Script to initialise all JSON data files to baseline demonstration state |
| Demo Operation Guide | Step-by-step guide for running each of the 5 pre-scripted demonstration scenarios, including login credentials, navigation steps, and expected outputs |

### 13.3 Technical Documentation

| Deliverable | Description |
|-------------|-------------|
| Architecture Document | Overview of system architecture, technical layers, module responsibilities, and API structure |
| Data Structure Reference | Documentation of all JSON data structures and field definitions |
| Optimisation Logic Reference | Documentation of the Compliance-Constrained Trial Design Engine scoring formula, dimension definitions, weight configuration, and example calculation |
| Setup & Deployment Guide | Instructions for installing dependencies, configuring environment variables, running the development server, and deploying the production build |
| Requirements Traceability Matrix (RTM) | Mapping of each functional requirement ID to the implemented feature, test case, and acceptance criterion |

### 13.4 Source Code

| Deliverable | Contents |
|-------------|----------|
| Frontend source | React application (`/frontend/src/`) — components, screens, hooks, context, routing, Tailwind configuration |
| Backend source | Node.js Express application (`/backend/`) — route handlers, service modules, middleware, data access layer |
| Data files | JSON prototype dataset (`/backend/data/`) |
| Configuration | `.env.example`, `package.json`, build scripts |
| README | Project overview, setup instructions, folder structure |

### 13.5 Handover Package

The complete handover package will be delivered as a `.zip` archive containing:

```
polyaxis-phase1/
├── README.md
├── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── backend/
│   ├── routes/
│   ├── services/
│   │   ├── PackagingEngine.js
│   │   ├── ConstraintChecker.js
│   │   ├── CandidateGenerator.js
│   │   ├── TrialOptimisationEngine.js
│   │   ├── RecommendationEngine.js
│   │   └── DashboardModule.js
│   ├── middleware/
│   ├── data/
│   │   ├── users.json
│   │   ├── projects.json
│   │   ├── materials.json
│   │   ├── regulations.json
│   │   └── scoring.json
│   └── package.json
├── docs/
│   ├── Architecture.md
│   ├── DataStructure.md
│   ├── OptimisationLogic.md
│   ├── DeploymentGuide.md
│   ├── DemoOperationGuide.md
│   └── RTM.md
└── scripts/
    └── seed.js
```

### 13.6 Payment Milestones

| Milestone | Amount | Trigger |
|-----------|--------|---------|
| 30% Upfront — to begin work | ₹15,000 | Project commencement (14 August 2026) |
| 70% On Completion & Delivery | ₹35,000 | Delivery of functional prototype meeting acceptance criteria |
| **Total** | **₹50,000** | |

*25% refund of advance in the event of mid-project termination.*  
*No refunds upon project completion and delivery.*

---

## 14. Glossary

| Term | Definition |
|------|------------|
| **Barrier Coating** | A thin functional coating applied to a mono-material film to improve its oxygen or moisture barrier performance, e.g., SiOx (silicon oxide) or EVOH (ethylene vinyl alcohol) |
| **Candidate Material** | A mono-material alternative packaging structure evaluated for suitability as a replacement for an existing multi-material laminate |
| **Candidate Trial** | A specific combination of a candidate material and a set of process parameters that represents a potential physical experiment to be conducted |
| **Compliance-Constrained Trial Design Engine** | The core technical innovation of PolyAxis — a rule-based optimisation engine that evaluates candidate physical trials against manufacturing and regulatory constraints, then ranks them by expected information gain, trial cost, feasibility, uncertainty reduction, and regulatory compliance |
| **Composite Score** | The weighted sum of all five dimension scores produced by the TrialOptimisationEngine for a candidate trial, used as the primary ranking value |
| **Constraint Checker (ConstraintChecker)** | The backend module responsible for validating each candidate trial against the user's defined manufacturing constraints and selected regulatory frameworks, returning a pass/fail status per dimension |
| **EU PPWR** | EU Packaging and Packaging Waste Regulation — a European Union regulatory framework establishing recyclability design criteria and targets for packaging placed on the EU market; its 2030 targets require all packaging to be recyclable |
| **EVOH** | Ethylene Vinyl Alcohol — a functional barrier material used as a layer or coating in packaging structures to provide high oxygen barrier performance; retains recyclability in mono-material structures at low EVOH content percentages |
| **Expected Information Gain** | A measure of how much useful technical information a specific physical trial is expected to produce relative to the current state of knowledge about candidate materials — higher information gain trials are prioritised by the engine |
| **Feasibility Filtering** | The pre-optimisation step in which the ConstraintChecker excludes any candidate trial that fails a hard manufacturing or mandatory regulatory constraint before scoring begins |
| **Hard Constraint** | A manufacturing or regulatory requirement that is non-negotiable — any candidate that fails it is excluded from the ranked list regardless of its performance or cost characteristics |
| **Information Gain** | See "Expected Information Gain" |
| **Laminate / Laminate Structure** | A packaging material formed from two or more layers of different materials bonded together to achieve combined performance characteristics (e.g., PE/PA laminate, OPP/PE laminate); typically non-recyclable due to multi-material composition |
| **Line Speed** | The rate at which packaging film passes through a manufacturing line, measured in metres per minute (m/min); a key manufacturing constraint affecting material processing compatibility |
| **Mono-Material** | A packaging structure composed of a single base polymer type (e.g., Mono-PE, Mono-PP), which enables recyclability through conventional sorting and reprocessing streams |
| **Mono-PE** | Mono-material polyethylene — a flexible packaging structure made entirely from polyethylene, potentially with barrier coatings or functional layers, designed to be recyclable in polyethylene recycling streams |
| **Mono-PP** | Mono-material polypropylene — a flexible packaging structure made entirely from polypropylene, potentially with barrier coatings or functional layers, designed to be recyclable in polypropylene recycling streams |
| **OTR (Oxygen Transmission Rate)** | The rate at which oxygen passes through a packaging material, measured in cc/m²/day; lower values indicate better oxygen barrier performance; critical for oxygen-sensitive products such as fresh food |
| **Phase 1 Prototype** | The technical proof-of-concept build of PolyAxis, using controlled and simulated packaging data, intended to validate the Compliance-Constrained Trial Design Engine methodology and provide a foundation for Phase 2 MVP development |
| **Process Parameter** | A manufacturing variable such as temperature, line speed, or processing window that defines the conditions under which a packaging material is converted or processed |
| **RBAC (Role-Based Access Control)** | A security model in which user permissions are assigned based on the user's role (Technical User or Administrator) rather than individual user settings |
| **Recommendation Rationale** | The plain-language explanation generated by the RecommendationEngine that describes why a specific trial was ranked first, referencing barrier performance, manufacturing compatibility, regulatory compliance, expected information gain, and estimated cost |
| **Re-optimisation** | The process of re-running the Compliance-Constrained Trial Design Engine after incorporating a simulated trial result into the evidence base, to generate an updated candidate ranking and recommendation |
| **Recyclability Target** | The minimum percentage of a packaging material that must be technically recyclable under a defined classification framework (e.g., ≥70% UK EPR household stream) |
| **SiOx** | Silicon oxide — a transparent inorganic barrier coating applied to mono-material films to improve oxygen and moisture barrier performance; considered compatible with mono-material recyclability streams |
| **Simulated Trial Result** | A user-entered outcome representing what a physical packaging trial produced (performance pass/fail, manufacturing pass/fail, regulatory pass/fail), used to update the optimisation evidence base |
| **Soft Constraint** | A manufacturing or regulatory preference that influences scoring but does not automatically exclude a candidate from the ranked list if unmet |
| **Trial Cost** | The estimated cost (£) of conducting a specific physical packaging trial, used as one of the five scoring dimensions (inverse — lower cost improves score) |
| **TrialOptimisationEngine** | The backend module that applies the Compliance-Constrained Trial Design Engine scoring logic to the pre-filtered candidate list, returning a ranked trial list with composite scores and individual dimension scores |
| **UK EPR** | UK Extended Producer Responsibility — a UK regulatory framework that places responsibility on packaging producers for end-of-life recyclability and recycling costs; includes recyclability thresholds for household and industrial packaging streams |
| **Uncertainty Reduction** | A measure of how much a specific trial is expected to reduce uncertainty about whether a candidate material will meet performance requirements — trials that resolve high-uncertainty performance dimensions are ranked more favourably |
| **WVTR (Water Vapour Transmission Rate)** | The rate at which water vapour passes through a packaging material, measured in g/m²/day; lower values indicate better moisture barrier performance; critical for moisture-sensitive products |

---

*Document prepared by Vishnu K V — Full-Stack Developer*  
*Contact: vishnu.kv8833@gmail.com | 6366030738*  
*PolyAxis Phase 1 Prototype Requirements v1.0 — 22 August 2026*
