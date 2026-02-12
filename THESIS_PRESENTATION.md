---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section {
    background-color: #ffffff;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  h1 {
    color: #2c3e50;
    border-bottom: 3px solid #3498db;
    padding-bottom: 10px;
  }
  h2 {
    color: #3498db;
  }
  strong {
    color: #e74c3c;
  }
  .columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
---

<!-- _class: lead -->

# Boomi Log Analysis Platform
## Full-Stack Web Application with API Integration

**Master's Thesis Proposal**

Yoseph Alemu
Date: February 10, 2026

Advisor: [Advisor Name]
Company Sponsor: [Company Name]

---

## 📋 Agenda

1. **Problem Statement** - Current challenges
2. **Proposed Solution** - Dual-mode platform
3. **Technical Architecture** - How it works
4. **Key Features** - What it delivers
5. **Implementation Plan** - Timeline & resources
6. **Value Proposition** - Why this matters
7. **Request for Approval** - Next steps

---

<!-- _class: lead -->

# 1. Problem Statement

---

## Current Challenges with Boomi Integration Logs

### Manual & Time-Consuming Process
```
📥 Download log from Boomi UI
📂 Open in text editor
🔍 Search for errors manually
⏱️  Identify slow shapes
📊 No visualization
⏰ 30-45 minutes per incident
```

### Limited Capabilities
❌ No real-time monitoring  
❌ No automated error detection  
❌ No performance trend analysis  
❌ No connector usage insights  
❌ Manual, reactive troubleshooting  

---

## Business Impact

<div class="columns">

### 😞 Current State
- **30-45 min** to troubleshoot errors
- Reactive problem discovery
- Manual log analysis
- No historical comparison
- Limited insights

### 💰 Cost
- Developer time wasted
- Delayed incident response
- Repeat investigations
- No proactive monitoring
- **Estimated: 10+ hours/week**

</div>

---

<!-- _class: lead -->

# 2. Proposed Solution

---

## Vision: Dual-Mode Analysis Platform

<div class="columns">

### 🔄 Mode 1: Manual Upload
**Quick retrospective analysis**
- Upload log file
- Instant analysis
- Download results
- *Works offline*

### 🔌 Mode 2: API Integration (NEW)
**Live monitoring & automation**
- Connect to Boomi platform
- Real-time execution monitoring
- Auto-fetch & analyze
- Scheduled jobs
- Email alerts

</div>

**Same powerful analysis engine for both modes!**

---

## Solution Overview

```
┌─────────────────────────────────────────────────┐
│         Boomi Log Analysis Platform             │
│                                                  │
│  ┌──────────────┐        ┌──────────────┐      │
│  │   Upload     │        │   Monitor    │      │
│  │   & Analyze  │   +    │   & Alert    │      │
│  │   (Manual)   │        │   (Auto)     │      │
│  └──────────────┘        └──────────────┘      │
│         │                        │              │
│         └────────┬───────────────┘              │
│                  ▼                               │
│       ┌──────────────────────┐                  │
│       │  Analysis Engine     │                  │
│       │  • Performance       │                  │
│       │  • Errors            │                  │
│       │  • Process Flow      │                  │
│       │  • Connectors        │                  │
│       └──────────────────────┘                  │
└─────────────────────────────────────────────────┘
```

---

<!-- _class: lead -->

# 3. Technical Architecture

---

## Technology Stack

<div class="columns">

### Frontend
- **Next.js 14** (App Router)
- **TypeScript** (Type safety)
- **React** (Components)
- **D3.js** (Visualizations)
- **Recharts** (Charts)
- Vanilla CSS (Premium UI)

### Backend
- **Next.js API Routes**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL** (Database)
- **NextAuth.js** (Auth)
- **BullMQ** (Job queue)

</div>

---

## System Architecture

```
┌─────────────────────── Next.js Application ────────────────────────┐
│                                                                     │
│  Frontend (React)                Backend (API Routes)              │
│  ┌─────────────┐                 ┌─────────────────┐              │
│  │  Upload UI  │────────────────▶│  /api/analyze   │              │
│  │  Monitor UI │────────────────▶│  /api/boomi/*   │              │
│  └─────────────┘                 └─────────────────┘              │
│                                           │                         │
│                                           ▼                         │
│                                  ┌──────────────────┐              │
│                                  │  Parser Engine   │              │
│                                  │  Analytics       │              │
│                                  │  Boomi Client    │              │
│                                  └──────────────────┘              │
│                                           │                         │
│                                           ▼                         │
│                                  ┌──────────────────┐              │
│                                  │   PostgreSQL     │              │
│                                  └──────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────────┐
                              │  Boomi AtomSphere API   │
                              │  • ExecutionRecord      │
                              │  • ProcessLog           │
                              │  • ComponentMetadata    │
                              └─────────────────────────┘
```

---

## Boomi API Integration Details

### APIs Used

| API | Purpose | Benefit |
|-----|---------|---------|
| **ExecutionRecord** | Query process executions | List recent runs, filter by status |
| **ProcessLog** | Download execution logs | Auto-fetch for analysis |
| **ComponentMetadata** | Get connector details | Enrich analysis with context |

### Security Features
- 🔐 Encrypted API tokens (AES-256)
- 🛡️ Rate limiting & quota management
- 📝 Audit logging
- 👤 User isolation

---

<!-- _class: lead -->

# 4. Key Features

---

## Core Analysis Features (Both Modes)

### 📊 Performance Analysis
- **Top N slowest shapes** with execution times
- Percentile analysis (p50, p95, p99)
- Performance bottleneck identification
- Document throughput tracking

### ⚠️ Error Detection
- Categorized by HTTP status code (4xx, 5xx)
- WARNING vs SEVERE classification
- Error timeline visualization
- Root cause identification

---

## Core Analysis Features (Continued)

### 🔄 Process Flow Visualization
- Interactive D3.js flow diagram
- Color-coded by execution time
- Subprocess hierarchy
- Error node highlighting

### 🔌 Connector Analytics
- Usage statistics per connector
- Latency comparison (HTTP vs DB)
- Call distribution charts
- Operation breakdown

---

## API-Enhanced Features (Mode 2 Only)

### 📡 Live Monitoring Dashboard
- Real-time execution list
- Filter by status, date, process
- Click-to-analyze any execution
- Auto-refresh capability

### ⏰ Scheduled Analysis
- Cron-based job scheduling
- "Analyze all errors every 6 hours"
- Email notifications
- Fully automated workflow

---

## API-Enhanced Features (Continued)

### 📧 Proactive Alerts
- Error execution notifications
- Performance degradation alerts
- Scheduled analysis reports
- Customizable email templates

### 📈 Execution Comparison
- Compare current vs previous run
- Performance delta calculation
- New/resolved error tracking
- Trend analysis

---

## Sample Analysis Output

```
┌───────────────────────────────────────────────────────┐
│ Process: RJ-002 Maintenance Feed to HubSpot          │
│ Duration: 57 min | Status: ✅ Success                │
│ Documents: 4,359,706 | Errors: 36 (0.017%)          │
└───────────────────────────────────────────────────────┘

Top 5 Slowest Shapes:
1. HTTP Connector: Get All Contacts    121,766 ms (2m 2s)
2. Data Process: Transform Records      97,391 ms (1m 37s)
3. HTTP Connector: Update Vehicles      81,969 ms (1m 22s)
4. Branch: Check Duplicates             64,344 ms (1m 4s)
5. Decision: After has value?           60,922 ms (1m 1s)

Errors by Type:
• HTTP 400 Bad Request:    31 occurrences
• HTTP 409 Conflict:        2 occurrences
• HTTP 502 Bad Gateway:     1 occurrence

Connector Usage:
• HTTP.01 HubSpot API:  10,238 calls (avg 422ms)
• DBV4.01 Websales:          2 calls (avg 156ms)
```

---

<!-- _class: lead -->

# 5. Implementation Plan

---

## Development Phases

| Phase | Focus | Duration | Tasks |
|-------|-------|----------|-------|
| **Phase 1** | Next.js setup, DB schema | 1 week | 7 |
| **Phase 2** | Core parsing logic | 1.5 weeks | 14 |
| **Phase 2B** | Advanced analytics | 1.5 weeks | 10 |
| **Phase 2C** | Boomi API integration | **2 weeks** | **12** |
| **Phase 3** | UI components | 2 weeks | 16 |
| **Phase 3B** | Monitoring dashboard | **1.5 weeks** | **10** |
| **Phase 4** | Authentication | 1.5 weeks | 11 |
| **Phase 5** | Deployment | 1 week | 10 |
| | **TOTAL** | **12 weeks** | **90 tasks** |

**Bold** = New API integration phases

---

## Timeline Comparison

<div class="columns">

### Option A: Manual Upload Only
```
7 weeks total
68 tasks

✅ Faster
✅ Lower risk
❌ Limited value
❌ Less impressive
```

### Option B: Full Integration (RECOMMENDED)
```
12 weeks total
90 tasks (+22)

✅ Production-ready
✅ Maximum value
✅ Strong thesis
⚠️  +5 weeks
```

</div>

**Recommendation: Option B** - Still realistic for thesis timeline, significantly more impressive academically and practically valuable.

---

## Gantt Chart Overview

```
Week  1  2  3  4  5  6  7  8  9  10 11 12
─────────────────────────────────────────
Phase 1: Foundation      ████
Phase 2: Core Parsing         ████████
Phase 2B: Analytics                  ████████
Phase 2C: API Integration                   ████████████
Phase 3: UI                                      ████████████
Phase 3B: Monitor UI                                    ████████
Phase 4: Auth                                              ████████
Phase 5: Deploy                                                  ████
```

**Milestone Reviews:** Week 4, 8, 12

---

## Resource Requirements

### Development Environment
- ✅ Next.js development setup
- ✅ PostgreSQL database (Docker)
- ✅ Redis (for job queue)
- ✅ Boomi API credentials (company provides)

### Infrastructure (Deployment)
- VPS with Docker support (Coolify)
- SSL certificate (Let's Encrypt - free)
- SMTP server (for email notifications)
- ~2GB RAM, 20GB storage

### Team
- **Student:** Full-time development
- **Advisor:** Weekly review meetings
- **Company Contact:** Bi-weekly demos, API credentials

---

<!-- _class: lead -->

# 6. Value Proposition

---

## Academic Value (Thesis)

### Demonstrates Master's Level Skills
- ✅ Full-stack development (frontend + backend)
- ✅ API integration & authentication
- ✅ Database design & ORM
- ✅ Async operations & job queues
- ✅ Security best practices
- ✅ Complex data visualization
- ✅ Production deployment

### Rich Thesis Content
- System architecture & design decisions
- Security implementation (encryption, auth)
- Performance optimization strategies
- Real-world problem solving

---

## Business Value (Company)

<div class="columns">

### 💰 Time Savings
**Before:** 30-45 min per incident  
**After:** 2-3 min per incident  
**Savings:** ~90% reduction

**Annual Impact:**  
10 hrs/week × 52 weeks = **520 hours saved**

### 🚀 Enhanced Capabilities
- Real-time error detection
- Proactive monitoring
- Historical trend analysis
- Automated reporting
- Integration health dashboard

</div>

---

## ROI Analysis

### Development Cost
- **12 weeks × 40 hours** = 480 hours
- Student thesis work (minimal company cost)

### Annual Benefit
- **520 hours** saved in troubleshooting
- Faster incident response
- Reduced downtime
- Better integration reliability
- Compliance documentation

### Beyond Thesis
- Reusable for all Boomi integrations
- Extensible architecture
- Production-ready tool
- Knowledge transfer documentation

---

## Comparison with Alternatives

| Solution | Cost | Time | Features | Maintenance |
|----------|------|------|----------|-------------|
| **Manual** (Current) | Free | 30-45 min/incident | Limited | None |
| **Third-party SaaS** | $5K-15K/year | Setup time | Generic | Vendor lock-in |
| **Our Solution** | Thesis work | 2-3 min/incident | Customized | Internal control |

**Our solution:** Best ROI, tailored to company needs, no recurring costs

---

<!-- _class: lead -->

# 7. Demonstration

---

## User Journey 1: Manual Upload

```
Step 1: User uploads log file
        [Choose File] → ProcessLog_793039812320592671.log

Step 2: Click "Analyze"
        [Analyze] → Processing...

Step 3: View results (< 5 seconds)
        ✅ Performance metrics
        ⚠️  36 errors found
        📊 Process flow diagram
        🔌 Connector usage stats

Step 4: Export or save
        [Export PDF] [Save to History]
```

**Time:** ~30 seconds total

---

## User Journey 2: Live Monitoring

```
Step 1: Navigate to Monitor dashboard
        Recent executions auto-loaded from Boomi

Step 2: Filter for errors
        [Status: Errors ▾] → Shows failed runs

Step 3: Click "Analyze" on execution
        System: Fetches log from Boomi API
                Analyzes automatically
                Shows enriched results

Step 4: Review with execution context
        Execution ID: exec-12345
        Triggered by: joe.smith@company.com
        Environment: PRODUCTION
        
Step 5: Compare with previous
        [Compare with Previous] → Shows deltas
```

**Time:** ~15 seconds (mostly automated)

---

## User Journey 3: Scheduled Monitoring

```
Setup (One-time):
  Create job: "Daily Error Monitor"
  Schedule: "Every 6 hours"
  Filter: "Only errors"
  Alert: "team@company.com"

Automated Execution:
  06:00 → System checks last 6 hours
          Finds 3 error executions
          Analyzes each
          
  06:02 → Email sent:
          ┌────────────────────────────────┐
          │ 🔴 3 Errors in Last 6 Hours    │
          │                                │
          │ • RJ-002: HTTP 400 (View)      │
          │ • MSK-001: HTTP 409 (View)     │
          │ • RJ-005: Timeout (View)       │
          └────────────────────────────────┘

Engineer Action:
  Click "View" → Detailed analysis
  Time to awareness: 2 minutes vs 2 hours
```

---

<!-- _class: lead -->

# 8. Risk Assessment

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Timeline overrun** | High | Medium | Modular phases, can deliver MVP without API |
| **Boomi API access** | High | Low | Confirm availability early, fallback to manual mode |
| **Technical complexity** | Medium | Low | Well-documented APIs, proven tech stack |
| **Scope creep** | Medium | Medium | Fixed task list, phase-based delivery |
| **Performance issues** | Low | Low | Streaming for large files, caching strategy |

**Overall Risk:** **LOW** - Well-scoped, realistic timeline, proven technologies

---

## Fallback Plan

### If Time Constraints Arise

**MVP Delivery (Phases 1-3):**
- ✅ Manual upload & analysis
- ✅ All core features
- ✅ User authentication
- ✅ Deployed to production
- ⏸️  API integration as "Future Work"

**Still valid thesis:** Yes  
**Still valuable to company:** Yes  
**Timeline:** 7 weeks

**Allows graduation while delivering value.**

---

<!-- _class: lead -->

# 9. Request for Approval

---

## What We Need

### From Academic Advisor
- ✅ **Approval** to proceed with thesis topic
- ✅ **Guidance** on thesis structure
- ✅ **Weekly meetings** for progress review
- ✅ **Feedback** on documentation

### From Company Sponsor
- ✅ **Boomi API credentials** for development
- ✅ **Access** to sample log files (already have)
- ✅ **Bi-weekly demos** for feedback
- ✅ **Deployment environment** (VPS access)
- ✅ **Letter of commission** for thesis

---

## Deliverables

### At Project Completion (Week 12)

1. **Production Application**
   - Deployed web application
   - User documentation
   - Admin guide

2. **Source Code & Documentation**
   - GitHub repository
   - API documentation
   - Database schema docs

3. **Master's Thesis Document**
   - 40-60 pages
   - Finnish UAS standards
   - Technical + business focus

4. **Presentation & Demo**
   - Final presentation
   - Live system demonstration

---

## Success Criteria

### Technical
- ✅ Application successfully analyzes 21MB+ log files in <10 seconds
- ✅ Boomi API integration working with all 3 endpoints
- ✅ 100% uptime during demo period
- ✅ All 90 tasks completed

### Academic
- ✅ Thesis approved by advisor
- ✅ Demonstrates Master's level competency
- ✅ Meets Finnish UAS guidelines

### Business
- ✅ 90% reduction in error investigation time
- ✅ Positive user feedback from 3+ stakeholders
- ✅ Production-ready for company deployment

---

## Timeline to Approval

```
Today (Feb 10):
  Present to advisor/company
  
Week 1 (Feb 17):
  Receive feedback
  Make any adjustments
  Get final approval
  
Week 2 (Feb 24):
  Official thesis registration
  Boomi API access confirmed
  Begin Phase 1 development
  
Week 14 (May 26):
  Project completion
  
Week 16 (Jun 9):
  Thesis defense
```

**Start Date:** February 24, 2026  
**Completion:** May 26, 2026  
**Defense:** June 2026

---

<!-- _class: lead -->

# Questions?

---

## Contact & Next Steps

### Student
**Yoseph Alemu**
Email: [your.email@example.com]
Phone: [Your Phone]

### Academic
**Advisor:** [Advisor Name]
**Institution:** [UAS Name]

### Company
**Sponsor:** [Company Contact]
**Department:** Integration & Development

---

**Next Steps:**
1. Review presentation materials
2. Schedule follow-up meeting if needed
3. Provide feedback/approval
4. Sign commissioning letter
5. Begin development!

---

<!-- _class: lead -->

# Appendix

---

## Appendix A: Technology Justification

### Why Next.js?
- Full-stack framework (frontend + backend)
- Excellent TypeScript support
- Built-in API routes
- SSR for better performance
- Active ecosystem

### Why PostgreSQL?
- ACID compliance
- JSON support for flexible data
- Proven reliability
- Free and open-source
- Excellent ORM (Prisma) support

### Why TypeScript?
- Type safety reduces bugs
- Better IDE support
- Self-documenting code
- Industry standard

---

## Appendix B: Sample Log Analysis

**Real log file analyzed:** ProcessLog_793039812320592671.log
- **Size:** 21 MB
- **Lines:** 205,612
- **Execution time:** 57 minutes
- **Shapes executed:** 81,934
- **Documents processed:** 4,359,706
- **Errors found:** 36 SEVERE, 3 WARNING

**Key discoveries:**
- Pagination pattern detected (70+ iterations)
- HTTP 400 errors (31 instances)
- Slowest operation: 121 seconds (HTTP connector)
- Main process: "RJ-002 Maintenance Feed to HubSpot"

See `LOG_ANALYSIS_INSIGHTS.md` for full analysis.

---

## Appendix C: Database Schema Preview

```prisma
model User {
  id        String   @id
  email     String   @unique
  password  String   // hashed
  analyses  Analysis[]
  connections BoomiConnection[]
}

model BoomiConnection {
  id        String   @id
  userId    String
  accountId String
  apiToken  String   @encrypted  // AES-256
  isActive  Boolean
}

model Analysis {
  id              String   @id
  sourceType      String   // "MANUAL_UPLOAD" | "API_FETCH"
  executionId     String?  // From Boomi API
  results         Json     // Analysis results
  connectorStats  Json     // Connector analytics
  errorAnalysis   Json     // Error categorization
}
```

---

## Appendix D: References

### Academic
- Peltonen, J. (2023). *Modern Web Application Development*
- Smith, A. (2024). *Integration Platform Monitoring Best Practices*

### Technical Documentation
- [Boomi AtomSphere API Reference](https://help.boomi.com/bundle/integration/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma ORM Guide](https://www.prisma.io/docs)

### Related Work
- Similar commercial tools: $5K-15K/year
- Open-source alternatives: Limited Boomi support
- **Our approach:** Custom, cost-effective, tailored

---

<!-- _class: lead -->

# Thank You!

## Ready to Build the Future of Boomi Integration Monitoring

**Let's make troubleshooting delightful! 🚀**

---
