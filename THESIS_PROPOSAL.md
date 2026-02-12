# Boomi Log Troubleshooter: A Full-Stack Web Application for Integration Platform Log Analysis

## Master's Thesis Proposal
**Programme:** Full Stack Development  
**Institution:** [Your Finnish UAS Name]  
**Author:** Yoseph Alemmu  
**Supervisor:** [Supervisor Name]  
**Submission Date:** [Expected Date]

---

## Abstract

Enterprise integration platforms like Dell Boomi handle thousands of data transactions daily, generating extensive execution logs that contain valuable insights about system performance, bottlenecks, and errors. However, analyzing these logs manually is time-consuming and error-prone, especially when dealing with complex multi-step processes that span multiple connected systems.

This thesis presents the design and implementation of Boomi Log Troubleshooter, a full-stack web application built to simplify the analysis of Boomi integration platform logs. The application enables developers and integration specialists to upload log files, automatically identify the slowest operations, visualize process flows, and extract warnings and errors—all through an intuitive web interface.

The project demonstrates practical application of modern full-stack development principles, including a React-based frontend with Next.js, a Node.js backend with TypeScript, and PostgreSQL for data persistence. The solution is designed for self-hosted deployment on personal infrastructure using Docker containers, making it accessible for organizations that prefer to keep their log data on-premises.

**Keywords:** Full-stack development, log analysis, data visualization, React, Next.js, Node.js, Dell Boomi, integration platforms

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Background and Motivation](#2-background-and-motivation)
3. [Problem Statement](#3-problem-statement)
4. [Objectives and Scope](#4-objectives-and-scope)
5. [Literature Review](#5-literature-review)
6. [Methodology](#6-methodology)
7. [Technical Architecture](#7-technical-architecture)
8. [Implementation Plan](#8-implementation-plan)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment Strategy](#10-deployment-strategy)
11. [Expected Outcomes](#11-expected-outcomes)
12. [Limitations and Future Work](#12-limitations-and-future-work)
13. [Timeline and Milestones](#13-timeline-and-milestones)
14. [References](#14-references)

---

## 1. Introduction

Working with enterprise integration platforms is rarely straightforward. These systems connect different applications, databases, and services, orchestrating data flows that can involve dozens of steps and multiple external APIs. When something goes wrong—or when performance starts to degrade—the first place developers turn to is the execution logs.

The problem is that these logs are often dense, verbose, and difficult to parse by hand. A single process execution might generate hundreds of lines of output, and finding the root cause of a performance issue means sifting through timestamps, shape names, document counts, and execution times scattered across the file. What should take minutes can easily consume hours.

This thesis addresses that challenge by building a web-based tool specifically designed for analyzing Boomi integration platform logs. Rather than requiring users to install desktop software or learn command-line tools, the application provides a simple drag-and-drop interface where users can upload their log files and immediately see actionable insights.

The choice to build this as a full-stack web application reflects both practical and academic considerations. From a practical standpoint, web applications are accessible from any device with a browser, require no installation, and can be easily shared across teams. From an academic perspective, building a complete application from frontend to backend to deployment provides an opportunity to demonstrate competency across the entire software development lifecycle.

### 1.1 Personal Motivation

My interest in this project stems from direct experience working with Boomi integrations in a professional setting. I've spent countless hours manually scanning through log files, trying to identify which shapes were taking too long or which connectors were throwing errors. The existing approach—copying logs into a text editor and using find-and-replace to locate patterns—felt antiquated and inefficient.

I initially built a Python prototype to automate some of this analysis, and it proved useful enough that colleagues started asking for access. That prototype became the starting point for this thesis: the goal is to transform a simple script into a production-ready web application that others can use.

### 1.2 Document Structure

The remainder of this proposal is organized as follows. Section 2 provides background on Boomi and the challenges of log analysis. Section 3 formally states the problem this thesis addresses. Section 4 outlines the objectives and defines the project scope. Section 5 reviews relevant literature and existing tools. Section 6 describes the methodology used for development. Sections 7 through 10 cover the technical architecture, implementation plan, testing approach, and deployment strategy. Section 11 discusses expected outcomes, Section 12 acknowledges limitations, and Section 13 presents the project timeline.

---

## 2. Background and Motivation

### 2.1 Integration Platforms and Their Role

Modern enterprises rarely operate with a single, monolithic system. Instead, they rely on ecosystems of specialized applications: CRM systems for customer data, ERP systems for operations, e-commerce platforms for sales, and countless SaaS tools for everything from marketing to human resources. Getting these systems to work together requires integration—automated processes that move data between applications, transform formats, and ensure consistency.

Dell Boomi is one of the leading integration platforms as a service (iPaaS) solutions. It provides a visual development environment where developers can design integration processes by connecting "shapes"—reusable components that perform specific tasks like making HTTP requests, transforming data, or routing documents based on conditions. These processes are then deployed to runtime environments called Atoms, which execute the integrations.

### 2.2 The Logging Challenge

When a Boomi process runs, it generates logs that record each step of the execution. These logs include timestamps, the names of shapes being executed, document counts, execution times, and any warnings or errors that occurred. For debugging and performance optimization, these logs are essential.

However, the logs are designed for machines as much as for humans. A typical log file might look like this:

```
2024-01-15T10:23:45Z INFO Connector [Sales] HTTP.01 Customer API: Executing Shape with 150 document(s)
2024-01-15T10:23:47Z INFO Connector [Sales] HTTP.01 Customer API: http Connector Shape executed successfully in 2345 ms.
2024-01-15T10:23:47Z INFO Decision: Executing Shape with 150 document(s)
2024-01-15T10:23:47Z INFO Decision: Decision Shape executed successfully in 12 ms.
2024-01-15T10:23:47Z WARNING Connector [Sales] Map.02 Transform: Field 'postal_code' is null
```

Extracting useful information from hundreds or thousands of such lines requires either specialized tools or significant manual effort. Questions like "which shape took the longest?" or "how many warnings occurred?" require careful parsing and aggregation.

### 2.3 Current Approaches and Their Limitations

In practice, developers use a variety of ad-hoc methods to analyze Boomi logs:

1. **Manual inspection**: Opening log files in text editors and using search functionality to find patterns. This is error-prone and time-consuming.

2. **Spreadsheet import**: Copying logs into Excel or Google Sheets and using formulas to extract data. This works for simple cases but breaks down with complex log formats.

3. **Custom scripts**: Writing one-off Python or shell scripts to parse specific patterns. These scripts are rarely maintained or shared.

4. **Boomi's built-in tools**: The Boomi platform includes some monitoring capabilities, but they're focused on real-time operations rather than historical log analysis.

None of these approaches provides a streamlined, reusable solution for log analysis. There's a clear opportunity for a purpose-built tool.

---

## 3. Problem Statement

Despite the critical importance of log analysis for maintaining and optimizing integration processes, there is no widely available, easy-to-use web application specifically designed for analyzing Boomi execution logs. Developers are forced to rely on general-purpose tools or manual techniques that are inefficient and error-prone.

This thesis addresses the following research question:

> **How can a full-stack web application be designed and implemented to enable efficient analysis of Boomi integration platform logs, providing actionable insights about performance bottlenecks and errors through an intuitive user interface?**

Secondary questions include:

- What are the essential features required for effective log analysis?
- How should the application be architected to balance functionality with deployment simplicity?
- What visualization techniques best communicate log analysis results to users?
- How can the application be designed for self-hosted deployment on personal infrastructure?

---

## 4. Objectives and Scope

### 4.1 Primary Objectives

This thesis aims to achieve the following objectives:

1. **Design and implement a full-stack web application** that can analyze Boomi log files and present results through a modern, responsive user interface.

2. **Port existing Python parsing logic to JavaScript/TypeScript**, demonstrating the ability to translate algorithms between programming languages while maintaining correctness.

3. **Create interactive data visualizations** that help users quickly understand process flows and identify performance issues.

4. **Implement user authentication and data persistence**, allowing users to save and retrieve past analyses.

5. **Deploy the application to a self-hosted environment** using Docker containers and a deployment platform (Coolify), demonstrating practical DevOps skills.

6. **Document the development process thoroughly**, providing insights into design decisions, challenges encountered, and lessons learned.

### 4.2 Scope

The project scope includes:

**In Scope:**
- File upload and parsing of `.txt` and `.log` files
- Extraction of execution times, process flows, warnings, and errors
- Interactive visualization of results using charts and diagrams
- User registration and authentication
- Saving analysis results to a database
- Viewing history of past analyses
- Responsive design for desktop and tablet devices
- Docker-based deployment
- Basic API documentation

**Out of Scope:**
- Real-time log streaming from Boomi
- Integration with Boomi's API for process metadata
- Mobile-native applications
- Multi-tenant enterprise features (organization management, RBAC)
- Machine learning-based anomaly detection
- Support for log formats from other integration platforms

### 4.3 Deliverables

The project will produce the following deliverables:

1. A functioning web application deployed to a personal VPS
2. Source code repository with version history
3. Technical documentation including API specifications
4. User documentation explaining how to use the application
5. This thesis document describing the development process and outcomes

---

## 5. Literature Review

### 5.1 Log Analysis and Observability

The field of log analysis has evolved significantly over the past decade. Traditional approaches focused on simple text search and pattern matching, but modern observability platforms like the ELK stack (Elasticsearch, Logstash, Kibana), Splunk, and Datadog offer sophisticated querying, visualization, and alerting capabilities (Sridharan, 2018).

However, these enterprise-grade solutions come with significant complexity and cost. They're designed for organizations processing millions of log entries per day across hundreds of services. For a focused use case like Boomi log analysis, a simpler, purpose-built tool may be more appropriate.

### 5.2 Full-Stack JavaScript Development

The JavaScript ecosystem has matured to support complete application development from frontend to backend. Node.js, released in 2009, enabled JavaScript execution outside the browser, and subsequent frameworks have simplified server-side development (Tilkov & Vinoski, 2010).

React, developed by Facebook and released in 2013, introduced a component-based approach to building user interfaces that has become the dominant paradigm for frontend development (Gackenheimer, 2015). Next.js, built on top of React, adds server-side rendering, routing, and API capabilities, enabling developers to build full applications within a single framework.

### 5.3 Data Visualization for Web Applications

Effective data visualization transforms raw numbers into understandable insights. D3.js (Data-Driven Documents) has become the standard library for building custom visualizations in JavaScript, offering fine-grained control over SVG elements and animations (Bostock, Ogievetsky, & Heer, 2011).

For common chart types, higher-level libraries like Recharts and Chart.js provide simpler APIs at the cost of some flexibility. The choice between low-level and high-level libraries depends on the specific visualization requirements and available development time.

### 5.4 Self-Hosted Deployment

While cloud platforms like AWS, Azure, and Google Cloud dominate enterprise deployments, there's growing interest in self-hosted solutions. Tools like Docker simplify application packaging, and platforms like Coolify, CapRover, and Dokku provide PaaS-like experiences on personal infrastructure (Merkel, 2014).

Self-hosting offers advantages in terms of data control, predictable costs, and independence from cloud vendors. For applications handling potentially sensitive log data, keeping everything on controlled infrastructure may be a requirement.

---

## 6. Methodology

This project follows an iterative development approach, combining elements of agile methodology with the structured documentation requirements of academic work.

### 6.1 Development Approach

Rather than attempting to design the entire system upfront, the project proceeds in phases:

1. **Foundation**: Set up the project structure, tooling, and development environment.
2. **Core Features**: Implement the essential functionality—file upload, parsing, and basic visualization.
3. **Enhancement**: Add authentication, data persistence, and improved visualizations.
4. **Polish**: Refine the user interface, add error handling, and improve performance.
5. **Deployment**: Containerize the application and deploy to production.

Each phase concludes with working software that can be demonstrated and evaluated. This approach reduces risk by validating assumptions early and allows for course correction based on feedback.

### 6.2 Technology Selection Criteria

Technology choices are guided by the following criteria:

1. **Simplicity**: Prefer straightforward solutions over complex ones. The application runs on a single VPS, so distributed systems patterns are unnecessary.

2. **Familiarity**: Choose technologies with strong documentation and community support, reducing the time spent troubleshooting obscure issues.

3. **Maintainability**: Select stable, well-maintained libraries that will continue to receive updates and security patches.

4. **Deployment friendliness**: Favor technologies that work well in containerized environments and don't require complex infrastructure.

### 6.3 Documentation Practice

Throughout development, decisions and rationale are documented in the code repository. This includes:

- Commit messages that explain not just what changed, but why
- README files for each major component
- Inline comments for non-obvious code
- A development journal capturing challenges and solutions

This documentation serves both as a reference during development and as raw material for the thesis.

---

## 7. Technical Architecture

### 7.1 Architecture Overview

The application follows a straightforward client-server architecture. A Next.js application serves both the frontend user interface and backend API endpoints. PostgreSQL provides data persistence, and the entire system runs in Docker containers.

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Frontend (Next.js)                   │ │
│  │    ┌──────────┐ ┌──────────┐ ┌───────────────────────┐ │ │
│  │    │  Upload  │ │ Analysis │ │       History         │ │ │
│  │    │   Page   │ │  Results │ │        Page           │ │ │
│  │    └──────────┘ └──────────┘ └───────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/JSON
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Server                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    API Routes                           │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐  │ │
│  │  │   /auth    │ │  /analyze  │ │     /analyses      │  │ │
│  │  └────────────┘ └────────────┘ └────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Parsing Library                         │ │
│  │   (TypeScript port of Python parsing logic)             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL                              │
│   ┌──────────┐ ┌──────────────┐ ┌───────────────────────┐  │
│   │  Users   │ │   Analyses   │ │     Sessions          │  │
│   └──────────┘ └──────────────┘ └───────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Technology Stack

The final technology stack balances capability with simplicity:

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend Framework** | Next.js 14 | Server and client components, built-in routing, API routes |
| **Language** | TypeScript | Type safety, better tooling, catches errors early |
| **Styling** | CSS Modules + Vanilla CSS | No build complexity, full control, works everywhere |
| **Charts** | Recharts | Simple API for common chart types, React-native |
| **Process Flow** | D3.js | Flexible enough for custom flow diagrams |
| **Database** | PostgreSQL | Reliable, well-documented, handles JSON well |
| **ORM** | Prisma | Type-safe queries, excellent developer experience |
| **Authentication** | NextAuth.js | Works seamlessly with Next.js, multiple providers |
| **Validation** | Zod | Runtime validation with TypeScript integration |
| **Containerization** | Docker | Standard for deployment, works with Coolify |

### 7.3 Database Schema

The database schema is intentionally minimal, storing only what's necessary for the application's features:

```
┌─────────────────────┐       ┌──────────────────────────┐
│       User          │       │        Analysis          │
├─────────────────────┤       ├──────────────────────────┤
│ id (PK)             │───┐   │ id (PK)                  │
│ email               │   │   │ userId (FK)              │──┐
│ name                │   └──▶│ filename                 │  │
│ password (hashed)   │       │ fileSize                 │  │
│ createdAt           │       │ status                   │  │
│ updatedAt           │       │ processName              │  │
└─────────────────────┘       │ totalExecutionTime       │  │
                              │ results (JSON)           │  │
                              │ processFlow (JSON)       │  │
                              │ warnings (JSON)          │  │
                              │ createdAt                │  │
                              │ completedAt              │  │
                              └──────────────────────────┘  │
                                           │                │
                                           └────────────────┘
```

The `results`, `processFlow`, and `warnings` fields use PostgreSQL's native JSON type. This approach keeps the schema simple while allowing complex nested data storage.

### 7.4 File Handling

Log files are processed in memory during analysis. Given the typical size of Boomi logs (usually under 10MB), streaming parsing isn't necessary for the MVP. The workflow is:

1. User uploads file via HTML form
2. Server receives file in memory
3. Parsing functions process the content
4. Results are stored in database as JSON
5. Original file is discarded (not stored)

This approach avoids the complexity of file storage while still preserving analysis results for later reference.

---

## 8. Implementation Plan

The implementation is divided into five phases, each producing working software that builds on the previous phase. Time estimates assume part-time development alongside other responsibilities.

### Phase 1: Project Foundation (Estimated: 1 week)

**Objective:** Establish the project structure, development environment, and basic application skeleton.

#### Tasks:

| # | Task | Description | Est. Hours |
|---|------|-------------|------------|
| 1.1 | Initialize Next.js project | Create new Next.js 14 project with TypeScript, App Router | 2 |
| 1.2 | Configure development tools | ESLint, Prettier, Git hooks, VS Code settings | 2 |
| 1.3 | Set up CSS architecture | Create CSS design tokens, global styles, CSS modules structure | 3 |
| 1.4 | Create basic layout | Header, navigation, main content area, responsive grid | 4 |
| 1.5 | Set up PostgreSQL | Docker Compose for local database, Prisma configuration | 3 |
| 1.6 | Define database schema | User and Analysis models in Prisma | 2 |
| 1.7 | Documentation | README, environment setup instructions | 2 |

**Phase 1 Subtotal: 18 hours**

**Deliverables:**
- Initialized Git repository with proper .gitignore
- Next.js application running locally
- PostgreSQL database with initial schema
- Basic page layout with placeholder content

---

### Phase 2: Core Parsing Logic (Estimated: 1.5 weeks)

**Objective:** Port the Python parsing logic to TypeScript and integrate it with the API.

#### Tasks:

| # | Task | Description | Est. Hours |
|---|------|-------------|------------|
| 2.1 | Create MinHeap utility | TypeScript implementation of min-heap for top-N tracking | 2 |
| 2.2 | Port time extractor | Convert `find_largest_ms_times` to TypeScript | 4 |
| 2.3 | Port shape name extractor | Convert `extract_shape_name` function | 2 |
| 2.4 | Port process flow extractor | Convert `extract_process_flow` function | 4 |
| 2.5 | Port warnings extractor | Convert `extract_warnings_and_severe_logs` function | 2 |
| 2.6 | Create unified parser module | Combine all extractors into single API | 2 |
| 2.7 | Write unit tests | Test parsing functions with sample log data | 4 |
| 2.8 | Create analyze API endpoint | POST /api/analyze that accepts file upload | 3 |
| 2.9 | Handle file validation | Check file type, size limits, error handling | 2 |
| 2.10 | Integration testing | End-to-end test of upload and parse flow | 3 |

**Phase 2 Subtotal: 28 hours**

**Deliverables:**
- Complete TypeScript parsing library
- Unit tests with sample log files
- Working API endpoint that returns analysis results
- Error handling for invalid files

---

### Phase 3: User Interface (Estimated: 2 weeks)

**Objective:** Build the frontend components for uploading files and displaying results.

#### Tasks:

| # | Task | Description | Est. Hours |
|---|------|-------------|------------|
| 3.1 | File upload component | Drag-and-drop zone with progress indicator | 4 |
| 3.2 | Upload page | Form for file selection and analysis options | 3 |
| 3.3 | Loading state | Animated spinner during analysis processing | 2 |
| 3.4 | Results summary card | Total execution time, file info, summary stats | 3 |
| 3.5 | Execution times table | Sortable table of slowest operations | 4 |
| 3.6 | Execution times chart | Bar chart visualization of top times | 3 |
| 3.7 | Process flow visualization | D3.js-based flowchart of process steps | 8 |
| 3.8 | Warnings sidebar | Collapsible panel showing warnings/errors | 3 |
| 3.9 | Export functionality | Download results as JSON/CSV | 3 |
| 3.10 | Error handling UI | User-friendly error messages and recovery | 2 |
| 3.11 | Responsive design | Test and fix layout on different screen sizes | 4 |
| 3.12 | Dark mode support | CSS variables for light/dark themes | 3 |

**Phase 3 Subtotal: 42 hours**

**Deliverables:**
- Complete upload and analysis workflow
- Interactive visualizations
- Responsive design working on desktop and tablet
- Dark mode toggle

---

### Phase 4: Authentication and Persistence (Estimated: 1.5 weeks)

**Objective:** Add user accounts, login functionality, and the ability to save and view past analyses.

#### Tasks:

| # | Task | Description | Est. Hours |
|---|------|-------------|------------|
| 4.1 | NextAuth.js setup | Configure authentication with credentials provider | 4 |
| 4.2 | Registration page | User signup form with validation | 3 |
| 4.3 | Login page | User login form with error handling | 2 |
| 4.4 | Password hashing | bcrypt integration for secure password storage | 1 |
| 4.5 | Session management | Middleware for protected routes | 2 |
| 4.6 | Save analysis results | Store analysis in database after processing | 3 |
| 4.7 | Analysis history page | List view of user's past analyses | 4 |
| 4.8 | Analysis detail page | View saved analysis with all visualizations | 4 |
| 4.9 | Delete analysis | Allow users to remove saved analyses | 2 |
| 4.10 | User profile page | Basic profile with email and account settings | 3 |
| 4.11 | Logout functionality | Clear session and redirect | 1 |

**Phase 4 Subtotal: 29 hours**

**Deliverables:**
- User registration and login
- Protected routes requiring authentication
- Persistent storage of analysis results
- History page with past analyses

---

### Phase 5: Deployment and Polish (Estimated: 1 week)

**Objective:** Prepare the application for production deployment and add final polish.

#### Tasks:

| # | Task | Description | Est. Hours |
|---|------|-------------|------------|
| 5.1 | Create Dockerfile | Multi-stage build for production image | 3 |
| 5.2 | Docker Compose setup | Production configuration with PostgreSQL | 2 |
| 5.3 | Environment configuration | Secure handling of secrets and config | 2 |
| 5.4 | Coolify deployment | Configure and deploy to VPS | 4 |
| 5.5 | SSL/HTTPS setup | Configure Let's Encrypt certificates | 1 |
| 5.6 | Performance review | Check and optimize slow pages | 3 |
| 5.7 | Security review | Check for common vulnerabilities | 2 |
| 5.8 | SEO optimization | Meta tags, Open Graph, sitemap | 2 |
| 5.9 | Landing page | Public homepage explaining the application | 3 |
| 5.10 | Final testing | Complete walkthrough of all features | 3 |

**Phase 5 Subtotal: 25 hours**

**Deliverables:**
- Production-ready Docker images
- Application deployed and accessible via HTTPS
- Landing page for new visitors
- Performance optimizations applied

---

### Total Implementation Estimate

| Phase | Hours | Calendar Time |
|-------|-------|---------------|
| Phase 1: Foundation | 18 | 1 week |
| Phase 2: Parsing | 28 | 1.5 weeks |
| Phase 3: UI | 42 | 2 weeks |
| Phase 4: Auth & Persistence | 29 | 1.5 weeks |
| Phase 5: Deployment | 25 | 1 week |
| **Total** | **142 hours** | **7 weeks** |

*Note: Calendar time assumes approximately 20 hours per week of development time.*

---

## 9. Testing Strategy

### 9.1 Unit Testing

Individual functions, particularly the parsing logic, are tested in isolation using Jest. Sample log files representing various edge cases ensure the parsing handles real-world input correctly.

Test categories include:
- Valid log files with expected patterns
- Edge cases (empty files, no matches, unusual formats)
- Large files to verify performance
- Malformed input to verify error handling

### 9.2 Integration Testing

API endpoints are tested to verify that file uploads, authentication, and database operations work correctly together. These tests use a test database that's reset between test runs.

### 9.3 End-to-End Testing

Playwright provides browser automation for testing complete user workflows:
- Upload a file and view results
- Register, login, and logout
- Save and retrieve analysis history
- Verify responsive design on different viewports

### 9.4 Manual Testing

Certain aspects require manual verification:
- Visual appearance and animations
- Cross-browser compatibility
- Accessibility (keyboard navigation, screen reader compatibility)
- Performance perception on actual log files

---

## 10. Deployment Strategy

### 10.1 Infrastructure

The application runs on a personal VPS managed through Coolify. Coolify provides a Docker-based deployment platform with built-in support for:
- Automatic HTTPS with Let's Encrypt
- GitHub integration for continuous deployment
- Environment variable management
- Resource monitoring

### 10.2 Container Architecture

The production deployment uses two containers:

1. **Application Container**: Next.js application serving both frontend and API
2. **Database Container**: PostgreSQL with persistent volume storage

```yaml
# Simplified docker-compose for production concept
services:
  app:
    build: .
    environment:
      - DATABASE_URL=postgresql://...
      - NEXTAUTH_SECRET=...
    ports:
      - "3000:3000"
    depends_on:
      - db
  
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=boomi_logs
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=...

volumes:
  postgres_data:
```

### 10.3 Backup Strategy

Database backups are automated using a cron job that runs pg_dump daily and stores snapshots for 30 days. This protects against data loss while keeping storage requirements reasonable.

### 10.4 Monitoring

Basic monitoring is achieved through:
- Coolify's built-in resource monitoring
- Next.js built-in logging
- PostgreSQL query logging for performance issues

For a personal project, this level of monitoring is sufficient. Enterprise deployments might add dedicated monitoring tools.

---

## 11. Expected Outcomes

Upon completion, this project will demonstrate:

1. **Full-stack development proficiency**: The ability to design and implement a complete web application from database to user interface.

2. **Algorithm translation skills**: Successfully porting parsing algorithms from Python to TypeScript while maintaining correctness.

3. **Modern React development**: Effective use of Next.js 14 features including Server Components, App Router, and API routes.

4. **Data visualization capability**: Creating interactive visualizations that help users understand complex data.

5. **DevOps competency**: Containerizing and deploying applications to self-hosted infrastructure.

6. **Software engineering practices**: Writing clean, maintainable code with appropriate testing and documentation.

The resulting application will be a genuinely useful tool for Boomi developers, not just an academic exercise. It solves a real problem that I've encountered in my own work, and feedback from colleagues will help validate its utility.

---

## 12. Limitations and Future Work

### 12.1 Known Limitations

This project intentionally limits scope to remain achievable within thesis timeframes:

- **Single-user focus**: While authentication is implemented, features like team sharing and organization management are not included.

- **File-based only**: The application processes uploaded files rather than connecting directly to Boomi for real-time log streaming.

- **Boomi-specific**: The parsing logic targets Boomi's log format and would require modification for other platforms.

- **Limited scalability**: The architecture suits personal or small team use; high-traffic deployments would need additional infrastructure.

### 12.2 Future Enhancements

With additional time, the following features could be added:

- **Real-time streaming**: WebSocket connection for live log monitoring
- **Comparative analysis**: Side-by-side comparison of multiple log files
- **Trend analysis**: Track performance over time with historical data
- **Team features**: Share analyses with colleagues, role-based access
- **Boomi API integration**: Fetch process metadata for richer context
- **Custom patterns**: User-configurable regex for non-standard log formats

---

## 13. Timeline and Milestones

| Week | Dates | Milestone | Deliverable |
|------|-------|-----------|-------------|
| 1 | Week 1 | Project Foundation | Development environment, database, basic layout |
| 2-3 | Weeks 2-3 | Core Parsing | TypeScript parsing library, API endpoint |
| 4-5 | Weeks 4-5 | User Interface | Upload flow, visualizations, responsive design |
| 6-7 | Weeks 6-7 | Auth & Persistence | User accounts, saved analyses |
| 8 | Week 8 | Deployment | Production deployment on VPS |
| 9-10 | Weeks 9-10 | Documentation | Thesis writing, final revisions |
| 11 | Week 11 | Presentation | Demo preparation, submission |

---

## 14. References

Bostock, M., Ogievetsky, V., & Heer, J. (2011). D3: Data-Driven Documents. *IEEE Transactions on Visualization and Computer Graphics*, 17(12), 2301-2309.

Gackenheimer, C. (2015). *Introduction to React*. Apress.

Merkel, D. (2014). Docker: Lightweight Linux Containers for Consistent Development and Deployment. *Linux Journal*, 2014(239).

Sridharan, C. (2018). *Distributed Systems Observability*. O'Reilly Media.

Tilkov, S., & Vinoski, S. (2010). Node.js: Using JavaScript to Build High-Performance Network Programs. *IEEE Internet Computing*, 14(6), 80-83.

---

## Appendix A: Proposed Project Structure

```
boomi-log-troubleshooter/
├── prisma/
│   └── schema.prisma
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── analyze/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   └── analysis/[id]/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── analyze/route.ts
│   │   │   └── analyses/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── analysis/
│   │   ├── common/
│   │   ├── layout/
│   │   └── ui/
│   ├── lib/
│   │   ├── parser/
│   │   ├── auth/
│   │   ├── db/
│   │   └── utils/
│   ├── hooks/
│   └── types/
├── tests/
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

---

## Appendix B: Sample Log Format

The application is designed to parse logs with this general structure:

```
YYYY-MM-DDTHH:MM:SSZ LEVEL Component: Message
```

Examples:
```
2024-01-15T10:23:45Z INFO Connector [Sales] HTTP.01 Customer API: Executing Shape with 150 document(s)
2024-01-15T10:23:47Z INFO Connector [Sales] HTTP.01 Customer API: http Connector Shape executed successfully in 2345 ms.
2024-01-15T10:23:47Z WARNING Connector [Sales] Map.02 Transform: Field 'postal_code' is null
2024-01-15T10:23:48Z SEVERE Connection Error: Failed to connect to endpoint
```

---

*This proposal was prepared as part of the requirements for the Master's Thesis in Full Stack Development.*
