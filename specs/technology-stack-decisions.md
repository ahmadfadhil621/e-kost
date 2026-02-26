# Technology Stack Decisions: E-Kost MVP

## Document Purpose

This document captures the comprehensive technology stack evaluation and final decisions for E-Kost MVP, based on systematic analysis of alternatives using the "skeptical consultant" methodology.

**Date**: February 23, 2026  
**Context**: E-Kost is a mobile-first property management webapp for Indonesian market  
**Budget Constraint**: $0-10/month  
**Key Requirements**: Mobile-first (320px-480px), 2-second response time, i18n support, self-hostable authentication

---

## Decision Summary Table

| Component | Final Decision | Complexity | Runner-ups | Key Reason |
|-----------|---------------|------------|------------|------------|
| Frontend Framework | React 18 + Vite | 6/10 | Alpine.js, Lit | Developer familiarity saves 100+ hours |
| Native vs Web | React Web (PWA) | 6/10 | React Native | No native features needed, 4-6 weeks faster |
| CSS Framework | Tailwind CSS + shadcn/ui | 4/10 | Vanilla CSS, Bootstrap | Mobile-first by default, rapid prototyping |
| Backend Framework | Next.js (serverless) | 5.5/10 | Express, Fastify | $0 free tier vs $6-12/month VPS |
| Database Type | SQL (PostgreSQL) | 6/10 | MongoDB, Firebase | Financial data requires ACID guarantees |
| Database Hosting | Supabase | 3/10 | Neon, Railway | Zero DevOps, 3.5 min setup vs 82 min self-hosted |
| Authentication | Better Auth (Prisma) | 3/10 | Supabase Auth, NextAuth, Clerk | Self-hostable, email/password first-class, no vendor lock-in, built-in password hashing and database sessions |

**Overall Stack Complexity**: Medium (5-6/10)  
**Total Monthly Cost**: $0 (Vercel + Supabase free tiers)

---

## 1. Frontend Framework: React vs Alternatives

### Analysis Method
Skeptical consultant approach: "Don't use React unless it clearly wins"

### Case AGAINST React (10 points)
1. **Bundle size bloat**: 150KB+ for React + React-DOM vs 10KB for Alpine.js
2. **Complexity overkill**: 7/10 complexity for simple CRUD operations
3. **Cold start penalty**: Serverless functions load React on every cold start
4. **Ecosystem churn**: Breaking changes every 2-3 years (class components → hooks → server components)
5. **Over-engineering risk**: Encourages premature abstraction and complex state management
6. **Learning curve**: 40-60 hours to proficiency vs 8-12 hours for simpler alternatives
7. **Build tooling complexity**: Webpack/Vite configuration, JSX transpilation overhead
8. **Mobile performance**: Virtual DOM overhead on low-end Android devices
9. **SEO challenges**: Client-side rendering requires additional SSR setup
10. **Vendor lock-in**: React-specific patterns don't transfer to other frameworks

### Case FOR React (10 points)
1. **Ecosystem maturity**: 70,000+ npm packages, solutions for every problem
2. **Developer velocity**: Component reusability accelerates development 3-5x
3. **TypeScript integration**: First-class TypeScript support with excellent type inference
4. **Hiring pool**: 10x more React developers than Alpine.js or Lit
5. **Mobile-first libraries**: React Hook Form, Radix UI optimized for touch interfaces
6. **State management**: Built-in hooks (useState, useContext) sufficient for E-Kost scale
7. **Testing ecosystem**: Jest, React Testing Library, Playwright integration
8. **PWA support**: Workbox, service worker libraries well-documented for React
9. **i18n libraries**: react-i18next mature solution for language-agnostic UI
10. **Long-term stability**: Meta's backing ensures 5+ year support horizon

### Final Verdict: React
**Reason**: Developer familiarity with React saves 100+ hours of learning time, justifying the complexity despite not being the optimal technical choice for a simple CRUD app.

**Complexity**: 6/10 (Medium) for developers familiar with React  
**Runner-ups**: 
- Alpine.js (3/10 complexity, best for simple apps, but 40+ hour learning curve)
- Lit (4/10 complexity, web components standard, but smaller ecosystem)

---

## 2. React Native vs React Web

### Analysis Method
Evaluation of native vs web for mobile-first requirements

### Case AGAINST React Native (7 points)
1. **Learning curve**: 2-4 weeks to learn platform-specific APIs (iOS/Android)
2. **Ecosystem limitations**: Fewer libraries than React web, platform-specific bugs
3. **Platform-specific code**: Separate iOS/Android builds, different debugging tools
4. **Deployment complexity**: App store submissions (1-2 hours) vs web deploy (5 minutes)
5. **No web version**: Desktop managers likely need web access, React Native doesn't provide this
6. **Build tooling**: Xcode, Android Studio, native dependencies increase complexity
7. **Update friction**: App store review delays vs instant web updates

### Case FOR React Web + PWA (7 points)
1. **No native features needed**: E-Kost doesn't require camera, GPS, or offline-first
2. **Faster time-to-market**: 4-6 weeks faster than React Native
3. **Single codebase**: One deployment target, no platform-specific code
4. **Instant updates**: Deploy fixes in 5 minutes vs 1-2 day app store review
5. **Desktop compatibility**: Property managers can use desktop when available
6. **PWA capabilities**: Add to home screen, offline support via service workers
7. **Lower complexity**: 6/10 vs 8/10 for React Native

### Final Verdict: React Web (Vite + PWA)
**Reason**: E-Kost doesn't need native features, React Native adds 4-6 weeks to timeline without clear benefit.

**Complexity**: 6/10 (Medium)  
**Alternative**: React Native only if camera/GPS/offline-first becomes critical

---

## 3. CSS Framework: Tailwind vs Alternatives

### Recommendation: Tailwind CSS + shadcn/ui + Lucide React

### Why Tailwind Wins
1. **Mobile-first by default**: `sm:`, `md:` breakpoints match E-Kost constraints (320px-480px)
2. **Rapid prototyping**: Utility classes enable fast iteration without context switching
3. **Zero runtime overhead**: All CSS generated at build time (16-32KB total)
4. **Consistent design system**: Spacing scale (4px, 8px, 16px) ensures 44x44px touch targets
5. **shadcn/ui integration**: Pre-built accessible components (forms, dialogs, cards)
6. **Lucide React icons**: 1,000+ icons at 24KB, perfect for mobile status indicators

### Complexity: Low-Medium (4/10)
**Learning curve**: 2-4 hours to functional productivity  
**Alternative**: Vanilla CSS (3/10 complexity, but 3x slower development)

---

## 4. Backend Framework: Next.js vs Express

### Analysis Method
Skeptical consultant approach: "Don't use Next.js for backend unless it clearly wins"

### Case AGAINST Next.js Backend (10 points)
1. **Cold start latency**: 500ms-2s cold starts vs 50-200ms for Express on VPS
2. **Vendor lock-in**: Vercel-specific features (Edge Runtime, Middleware) don't port to other hosts
3. **Debugging complexity**: Serverless logs scattered across function invocations
4. **Cost at scale**: $20/month at 1M requests vs $6/month VPS for Express
5. **Limited control**: Can't optimize Node.js flags, memory limits, or connection pooling
6. **Timeout constraints**: 10-second max execution time on free tier
7. **Stateless constraints**: No in-memory caching, every request is isolated
8. **Framework overhead**: Next.js abstractions add complexity to simple REST APIs
9. **Testing friction**: Serverless functions harder to test locally than Express routes
10. **Migration cost**: Moving from Vercel to self-hosted requires rewriting deployment

### Case FOR Next.js Backend (10 points)
1. **Zero infrastructure cost**: Vercel free tier = $0/month vs $6-12/month VPS
2. **Instant deployment**: Git push = automatic deploy in 2 minutes
3. **Zero DevOps**: No server management, no SSL certificates, no monitoring setup
4. **File-based routing**: `pages/api/tenants.ts` = automatic `/api/tenants` endpoint
5. **TypeScript by default**: Shared types between frontend and backend
6. **Automatic scaling**: Handles traffic spikes without configuration
7. **Edge network**: Global CDN reduces latency for Indonesian users
8. **Built-in middleware**: CORS, body parsing, error handling included
9. **Development speed**: Hot reload, instant feedback loop
10. **Security defaults**: HTTPS, CORS, rate limiting built-in

### Final Verdict: Next.js (Serverless)
**Reason**: $0 budget constraint is decisive. Vercel free tier sufficient for MVP (100GB bandwidth, 100 serverless function invocations/hour).

**Complexity**: 5.5/10 (Medium) for API routes only  
**Learning curve**: 20-30 hours  
**Migration strategy**: Use Next.js free tier for MVP, migrate to Express VPS when revenue > $10,000/month

### Cost Analysis
- **Next.js (Vercel)**: $0/month free tier → $20/month Pro tier at 1M requests
- **Express (VPS)**: $6-12/month minimum → $10-20/month at scale
- **Crossover point**: 12-18 million requests/month (40,000-60,000 properties)

### Implementation Simplicity Comparison
Next.js wins 8/10 categories:
- File-based routing: Next.js (zero config) vs Express (manual route definitions)
- TypeScript: Next.js (built-in) vs Express (manual setup)
- Deployment: Next.js (git push) vs Express (SSH, PM2, nginx)
- CORS: Next.js (one-line config) vs Express (middleware setup)
- Environment variables: Next.js (`.env.local`) vs Express (dotenv + manual loading)
- Hot reload: Next.js (built-in) vs Express (nodemon setup)
- Error handling: Next.js (automatic 500 pages) vs Express (manual middleware)
- API testing: Next.js (fetch `/api/route`) vs Express (supertest setup)

**Runner-ups**:
- Express (4/10 complexity, better performance, but $6-12/month cost)
- Fastify (5/10 complexity, fastest Node.js framework, but same VPS cost as Express)

---

## 5. Database Type: SQL vs NoSQL

### Analysis Method
Skeptical consultant approach: "Don't use SQL unless it clearly wins"

### Case AGAINST SQL (10 points)
1. **Schema rigidity**: Migrations required for every schema change
2. **ORM complexity**: Prisma/TypeORM adds 20-30 hours learning curve
3. **Migration overhead**: Up/down migrations, rollback strategies, version control
4. **Connection pooling**: Serverless requires connection pooling (PgBouncer, Prisma Data Proxy)
5. **Join complexity**: Multi-table queries require understanding of JOIN types
6. **Vertical scaling limits**: Single-server bottleneck at high scale
7. **Development friction**: Schema changes require migration generation and testing
8. **Type mismatches**: SQL types don't map cleanly to JavaScript types
9. **Query optimization**: Requires understanding of indexes, query plans, EXPLAIN
10. **Backup complexity**: Point-in-time recovery requires WAL archiving

### Case FOR SQL (10 points)
1. **ACID guarantees**: Financial data (payments) requires transactional consistency
2. **Referential integrity**: Foreign keys prevent orphaned payments or invalid room assignments
3. **Mature tooling**: 40+ years of SQL optimization, monitoring, and debugging tools
4. **Complex queries**: Outstanding balance calculation requires JOINs and aggregations
5. **Data consistency**: Strong consistency model prevents race conditions
6. **Schema validation**: Database enforces data types, constraints, and uniqueness
7. **Reporting capabilities**: SQL excels at analytical queries (payment history, occupancy rates)
8. **Migration safety**: Schema migrations provide audit trail and rollback capability
9. **Developer familiarity**: SQL is universal skill, easier to hire for
10. **Ecosystem maturity**: PostgreSQL extensions (JSON, full-text search) provide NoSQL flexibility

### Final Verdict: SQL (PostgreSQL)
**Reason**: Financial data requires ACID guarantees, relationships are core to E-Kost domain (tenant → room → payments), complex queries are frequent (outstanding balance = rent - SUM(payments)).

**Complexity**: 6/10 (Medium) general, 5.5/10 for E-Kost (simple 3-table schema)  
**Learning curve**: 20-30 hours for SQL + Prisma

**Runner-ups**:
- MongoDB (4/10 complexity, flexible schema, but no referential integrity)
- Firebase Firestore (3/10 complexity, real-time updates, but weak query capabilities)

---

## 6. Database Hosting: Supabase vs Alternatives

### Analysis Method
Skeptical consultant approach: "Don't use Supabase unless it clearly wins"

### Case AGAINST Supabase (10 points)
1. **Vendor lock-in**: Supabase-specific features (Auth, Storage, Realtime) don't port to other hosts
2. **Free tier limits**: 500 MB storage, pauses after 1 week inactivity
3. **Performance limitations**: Shared CPU on free tier, unpredictable latency
4. **No control over configuration**: Can't tune PostgreSQL parameters (work_mem, shared_buffers)
5. **Cold start delays**: Database pauses after inactivity, 10-30 second wake-up time
6. **Limited backup control**: 7-day backup retention on free tier
7. **Connection limit**: 60 concurrent connections on free tier
8. **Geographic limitations**: Limited region selection, may not have Indonesia data center
9. **Pricing jumps**: Free tier → $25/month Pro tier (no middle ground)
10. **Feature bloat**: Includes Storage, Realtime that E-Kost doesn't need in MVP

### Case FOR Supabase (10 points)
1. **Zero DevOps**: 3.5 minutes setup vs 82 minutes self-hosted PostgreSQL
2. **Automatic backups**: Daily backups included, no manual setup
3. **Built-in admin UI**: Visual table editor, SQL editor, no need for pgAdmin
4. **Connection pooling**: PgBouncer included, solves serverless connection issues
5. **Generous free tier**: 500 MB sufficient for 1,000 tenants + 10,000 payments
6. **Prisma integration**: Official Prisma support, connection string works out-of-box
7. **Real-time capabilities**: Built-in for future features (live balance updates)
8. **Auth decoupled**: Authentication handled by Better Auth (not Supabase Auth), keeping database hosting independent from auth provider
9. **Cost savings**: $0/month vs $10-20/month self-hosted (saves $120-240/year)
10. **Community support**: 70,000+ GitHub stars, extensive documentation

### Final Verdict: Supabase
**Reason**: Zero DevOps (3.5 min setup vs 82 min self-hosted), $0 cost for MVP, automatic backups, connection pooling for serverless.

**Complexity**: 3/10 (Low)  
**Learning curve**: 4-6 hours  
**Time to functional productivity**: 4-6 hours

**Cost Savings**: $60-72/year during MVP phase, $1,020-1,992/year total including maintenance time

**Migration Path**: Free tier → Pro tier ($25/month) or self-hosted ($10-20/month) when revenue > $10,000/month

### Comparison with Alternatives

| Provider | Free Tier | Pausing | Complexity | Best For |
|----------|-----------|---------|------------|----------|
| Supabase | 500 MB, 1 week pause | Yes | 3/10 | All-in-one (auth, storage, realtime) |
| Neon | 3 GB, no pause | No | 3/10 | Pure PostgreSQL, better free tier |
| Railway | No free tier | N/A | 4/10 | Standard PostgreSQL, $10/month |
| PlanetScale | 5 GB, no pause | No | 4/10 | MySQL, serverless-first |

**Why Supabase Wins**: Largest community (70k+ stars), excellent Prisma integration, zero DevOps, and built-in connection pooling for serverless. Auth is handled by Better Auth (not Supabase Auth), so Supabase is used purely as a managed PostgreSQL host.

**Runner-ups**:
- Neon (3/10 complexity, better free tier: 3 GB + no pausing, but PostgreSQL-only)
- Railway (4/10 complexity, standard PostgreSQL, but $10/month minimum)

---

## 7. Authentication: Better Auth vs Alternatives

### Context
E-Kost requires authentication in MVP for account creation, login, session management, and profile display. A key architectural goal is self-hostability and vendor independence — the system should run without dependency on any external auth service.

### Candidates Evaluated
1. **Better Auth** — Open-source auth library with first-class email/password and database sessions
2. **Supabase Auth** — Managed auth service bundled with Supabase
3. **Auth.js (NextAuth v5)** — Open-source auth library, primarily designed for OAuth
4. **Clerk** — Managed auth service with generous free tier

### Case FOR Better Auth (selected)
1. **Email/password is first-class**: Built-in password hashing, not a second-class "Credentials" provider
2. **Database sessions built-in**: Server-side sessions via Prisma adapter, no JWT-only limitation
3. **Self-hostable**: No external service dependency — works with any Postgres instance
4. **No vendor lock-in**: Auth data lives in the same Prisma-managed database as domain data
5. **Prisma adapter**: Auth tables (User, Session, Account) managed by Prisma alongside Tenant, Room, Payment
6. **OAuth extensible**: Can add Google, GitHub, etc. later via config — no architectural change
7. **Simpler API**: Less boilerplate than Auth.js for email/password flows
8. **Free forever**: No MAU limits, no rate limits, no project pausing

### Case AGAINST Supabase Auth (rejected)
1. **Vendor lock-in**: Auth tied to Supabase infrastructure, not portable to self-hosted Postgres
2. **Split data model**: User data in Supabase `auth.users` schema (not Prisma-managed) while domain data in `public` schema
3. **RLS dependency**: Encourages Row-Level Security patterns that don't port to self-hosted
4. **Free tier limits**: Project pausing after inactivity, rate limits
5. **No Prisma control**: Cannot manage auth tables via Prisma migrations
6. **Cross-schema friction**: Joining auth users to domain entities requires workarounds

### Case AGAINST Auth.js / NextAuth (rejected)
1. **Credentials provider is second-class**: Intentionally limited — pushed toward JWT-only sessions
2. **No built-in password hashing**: Must manually configure bcrypt
3. **Database sessions don't work with Credentials**: OAuth-first design penalizes email/password
4. **Verbose configuration**: Callbacks, providers, adapters require significant boilerplate
5. **v5 documentation gaps**: Newer version, some patterns not well-documented

### Final Verdict: Better Auth
**Reason**: Portable, first-class email/password support, and extensible. Auth data lives in the same Prisma-managed database as domain data, enabling fully self-hosted deployments with no external service dependencies. OAuth providers can be added later via configuration without architectural changes.

**Complexity**: 3/10 (Low)
**Learning curve**: 2-4 hours
**Setup time**: ~30 minutes (library install + Prisma schema + config)

**Runner-ups**:
- Supabase Auth (2/10 complexity, fastest setup, but vendor lock-in and split data model)
- Auth.js (6/10 complexity, mature ecosystem, but email/password is second-class)
- Clerk ($25/month, best UX, but managed service with vendor dependency)

---

## Final Technology Stack

### Frontend
- **Framework**: React 18 + Vite
- **Bundle optimization**: Preact (via alias for 70% smaller bundle)
- **Styling**: Tailwind CSS + shadcn/ui
- **Forms**: React Hook Form + Zod
- **i18n**: react-i18next
- **Date handling**: date-fns
- **Icons**: Lucide React

### Backend
- **Framework**: Next.js API Routes (Vercel serverless)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Validation**: Zod (shared with frontend)

### Authentication
- **Provider**: Better Auth (with Prisma adapter for database sessions)

### Deployment
- **Hosting**: Vercel (free tier)
- **Database**: Supabase (free tier)
- **Total Cost**: $0/month for MVP

### Complexity Summary
- React: 6/10 (Medium)
- Tailwind CSS: 4/10 (Low-Medium)
- Next.js: 5.5/10 (Medium for API routes only)
- SQL + Prisma: 6/10 (Medium), 5.5/10 for E-Kost (simple schema)
- Better Auth: 3/10 (Low)
- **Overall**: Medium (5-6/10)

### Learning Time Estimates
- React (if new): 40-60 hours
- React (if familiar): 0 hours (already known)
- Tailwind CSS: 2-4 hours
- Next.js API routes: 20-30 hours
- SQL + Prisma: 20-30 hours
- Better Auth: 2-4 hours
- **Total (familiar with React)**: 44-68 hours
- **Total (new to React)**: 84-128 hours

---

## Key Decision Factors

### 1. Budget Constraint ($0-10/month)
- Eliminated Express (requires $6-12/month VPS)
- Chose Next.js serverless (Vercel free tier)
- Chose Supabase (free tier vs $10-20/month self-hosted)

### 2. Developer Familiarity
- React familiarity saved 100+ hours vs learning Alpine.js/Lit
- Justified React's 6/10 complexity despite not being optimal for simple CRUD

### 3. Mobile-First Requirements
- Tailwind CSS mobile-first by default (320px-480px)
- React Hook Form optimized for touch interfaces
- PWA capabilities for "add to home screen"

### 4. Time-to-Market
- React Web 4-6 weeks faster than React Native
- Next.js instant deployment vs Express DevOps setup
- Supabase 3.5 min setup vs 82 min self-hosted

### 5. Financial Data Requirements
- SQL ACID guarantees for payment transactions
- Referential integrity for tenant → room → payment relationships
- PostgreSQL mature tooling for financial reporting

### 6. Future-Proofing
- Better Auth handles MVP authentication with room to grow (OAuth providers addable via config)
- PostgreSQL scales to 40,000-60,000 properties
- Migration path: Free tier → Pro tier or self-hosted at $10k+/month revenue

---

## Migration Triggers

### When to Migrate from Supabase Free Tier
- **Storage**: Approaching 500 MB limit (estimated at 2,000-3,000 tenants)
- **Inactivity**: Database pausing becomes problematic (daily active users)
- **Performance**: Shared CPU causing >2 second response times
- **Action**: Upgrade to Supabase Pro ($25/month) or migrate to self-hosted ($10-20/month)

### When to Migrate from Next.js Serverless
- **Cost**: Exceeding Vercel free tier (100GB bandwidth, 100 function invocations/hour)
- **Latency**: Cold starts causing >2 second response times
- **Scale**: 12-18 million requests/month (40,000-60,000 properties)
- **Action**: Migrate to Express on VPS ($10-20/month)

### When to Reconsider React
- **Performance**: Virtual DOM overhead on low-end devices
- **Bundle size**: 150KB+ causing slow initial load
- **Action**: Consider Preact (already planned), Svelte, or Alpine.js

---

## Risks and Mitigations

### Risk 1: Supabase Free Tier Pausing
- **Impact**: Database pauses after 1 week inactivity, 10-30 second wake-up
- **Mitigation**: Cron job to ping database daily, or upgrade to Pro tier ($25/month)
- **Likelihood**: High if no daily active users

### Risk 2: Vercel Free Tier Limits
- **Impact**: 100GB bandwidth/month, 100 function invocations/hour
- **Mitigation**: Monitor usage, optimize images, implement caching
- **Likelihood**: Medium at 100-200 active properties

### Risk 3: React Complexity for New Developers
- **Impact**: 40-60 hour learning curve for new team members
- **Mitigation**: Comprehensive documentation, code reviews, pair programming
- **Likelihood**: High if hiring junior developers

### Risk 4: Vendor Lock-in (Vercel + Supabase)
- **Impact**: Migration cost if pricing becomes prohibitive
- **Mitigation**: Use Prisma (database-agnostic), standard Next.js (portable to other hosts), Better Auth (self-hostable, no Supabase Auth dependency)
- **Likelihood**: Low (migration path exists at $10k+/month revenue; auth is already vendor-independent)

---

## Success Metrics

### Technical Metrics
- **Response time**: <2 seconds for status updates and balance calculations
- **Mobile performance**: Lighthouse score >90 on mobile
- **Bundle size**: <200KB initial load (React + Tailwind + app code)
- **Database queries**: <100ms for CRUD operations

### Business Metrics
- **Cost**: $0/month for first 100-200 properties
- **Development speed**: MVP delivered in 4-6 weeks
- **Maintenance**: <5 hours/month DevOps time
- **Scalability**: Support 1,000 tenants, 500 rooms, 10,000 payments

---

## Conclusion

The final stack prioritizes **zero cost** and **developer familiarity** over optimal technical choices. React's 6/10 complexity is justified by 100+ hours of saved learning time. Next.js serverless and Supabase free tiers enable $0/month operation during MVP phase.

The stack is designed for **migration flexibility**: Prisma abstracts database, Next.js API routes are portable, and clear migration triggers ($10k+/month revenue) guide future scaling decisions.

**Total complexity**: Medium (5-6/10), manageable for developers familiar with React and basic SQL.
