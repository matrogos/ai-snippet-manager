# Product Requirements Document (PRD)
## AI Code Snippet Manager

**Version:** 1.0  
**Date:** October 11, 2025  
**Status:** Draft  
**Author:** Development Team

---

## 1. Executive Summary

AI Code Snippet Manager is a web application designed to help developers organize, document, and retrieve code snippets efficiently. By leveraging AI technology, the application automatically generates descriptions, explanations, and tags for code snippets, eliminating the manual documentation burden that causes developers to abandon their snippet collections.

**Key Value Proposition:** Save time on documentation while maintaining a well-organized, searchable code snippet library that grows more valuable over time.

---

## 2. Problem Statement

### Current Situation
Developers frequently encounter and solve similar coding problems throughout their careers. They often save useful code snippets in:
- Text files scattered across their file system
- Comments in various projects
- Notes in applications like Notion, Evernote, or OneNote
- Browser bookmarks to Stack Overflow answers
- Email drafts sent to themselves

### The Problem
1. **Lack of Centralization:** Snippets are scattered across multiple locations, making them hard to find when needed
2. **Missing Context:** Without documentation, developers forget what a snippet does or when to use it
3. **Time-Consuming Documentation:** Manually documenting each snippet is tedious and often skipped
4. **Poor Searchability:** Without proper tags and descriptions, finding the right snippet becomes difficult
5. **Lost Value:** Valuable solutions are forgotten or recreated from scratch, wasting time

### Impact
- Developers spend **15-30 minutes per day** searching for previously solved problems
- Valuable code snippets are lost or forgotten
- Knowledge is not retained effectively across projects
- Productivity decreases due to reinventing solutions

---

## 3. Target Users

### Primary Persona: Alex - The Practical Developer
- **Age:** 25-40
- **Experience:** 2-10 years of professional development
- **Technical Level:** Intermediate to Advanced
- **Work Environment:** Works on multiple projects simultaneously
- **Pain Points:**
  - Constantly searches for code snippets solved before
  - Forgets the context of saved code
  - Wastes time recreating solutions
- **Goals:**
  - Quick access to previously solved problems
  - Minimal effort to maintain snippet collection
  - Better code organization

### Secondary Persona: Sarah - The Learning Developer
- **Age:** 20-30
- **Experience:** 0-2 years, bootcamp graduate or junior developer
- **Technical Level:** Beginner to Intermediate
- **Work Environment:** Learning multiple technologies simultaneously
- **Pain Points:**
  - Overwhelmed by amount of new information
  - Struggles to understand and remember code patterns
  - Needs explanations for code snippets
- **Goals:**
  - Build a personal knowledge base
  - Understand code patterns deeply
  - Learn from well-documented examples

---

## 4. Goals and Objectives

### Business Goals
1. Create a viable MVP in 15-18 hours of development time
2. Achieve 75% weekly user retention within first 3 months
3. Demonstrate clear value through AI-powered features
4. Build a foundation for future premium features

### User Goals
1. Reduce time spent searching for previously solved problems by 70%
2. Maintain a well-documented snippet collection with minimal effort
3. Understand code snippets through AI-generated explanations
4. Quickly find relevant snippets using intelligent search and tagging

### Technical Goals
1. Deliver a fast, responsive web application (<3 second load times)
2. Achieve 95% uptime
3. Process AI requests in under 3 seconds
4. Ensure data security and user privacy

---

## 5. User Stories

### Authentication
- As a developer, I want to register with my email so that I can securely store my snippets
- As a user, I want to log in to access my snippet collection from any device
- As a user, I want to reset my password if I forget it

### Snippet Management
- As a developer, I want to add a code snippet with its programming language so that it's properly highlighted
- As a user, I want to view all my snippets in an organized list so I can browse my collection
- As a developer, I want to edit my snippets so I can improve or update them
- As a user, I want to delete snippets I no longer need to keep my collection clean
- As a developer, I want to see syntax highlighting on my code so it's easy to read

### AI Features
- As a busy developer, I want AI to automatically describe what my snippet does so I don't have to write documentation
- As a learning developer, I want AI to explain my code line-by-line so I can understand it better
- As a user, I want AI to suggest relevant tags so my snippets are properly categorized without manual work
- As a developer, I want to regenerate AI descriptions if the first attempt isn't satisfactory

### Search and Organization
- As a user, I want to search snippets by title so I can quickly find what I need
- As a developer, I want to filter snippets by programming language so I can focus on relevant code
- As a user, I want to search by tags so I can find related snippets
- As a developer, I want to copy code to clipboard with one click so I can use it immediately

---

## 6. Functional Requirements

### 6.1 User Authentication

**FR-1.1: User Registration**
- System shall allow users to register with email and password
- Email must be validated (valid format)
- Password must be at least 8 characters
- System shall send confirmation email
- Users cannot register with duplicate emails

**FR-1.2: User Login**
- System shall authenticate users with email and password
- System shall maintain user session
- System shall provide "Remember me" functionality
- Failed login attempts shall be logged

**FR-1.3: Password Reset**
- System shall provide password reset via email
- Reset link shall expire after 24 hours
- Users shall be able to set new password through reset link

### 6.2 Snippet CRUD Operations

**FR-2.1: Create Snippet**
- Users shall be able to create new snippets with:
  - Title (required, max 255 characters)
  - Code content (required)
  - Programming language (required, from predefined list)
  - Manual description (optional)
  - Manual tags (optional)
- System shall validate required fields
- System shall auto-save as draft every 30 seconds

**FR-2.2: Read Snippets**
- Users shall see list of all their snippets
- List shall display: title, language, tags, creation date
- Users shall be able to view full snippet details
- Snippet detail view shall include:
  - Title
  - Code with syntax highlighting
  - Language
  - Description (manual and/or AI-generated)
  - AI explanation (if generated)
  - Tags
  - Creation and update timestamps

**FR-2.3: Update Snippet**
- Users shall be able to edit all snippet fields
- System shall track last update timestamp
- Changes shall be saved immediately upon user action

**FR-2.4: Delete Snippet**
- Users shall be able to delete snippets
- System shall ask for confirmation before deletion
- Deletion shall be permanent (no recovery in MVP)

**FR-2.5: Syntax Highlighting**
- System shall apply syntax highlighting to code based on selected language
- Supported languages: JavaScript, TypeScript, Python, Java, C#, C++, Go, Rust, PHP, Ruby, SQL, HTML, CSS
- Code shall be displayed in monospace font
- Line numbers shall be visible

### 6.3 AI Features

**FR-3.1: Generate Description**
- Users shall trigger AI description generation via button
- System shall send code and language to AI API
- AI shall return 1-2 sentence description
- Description shall be stored in database
- Users shall be able to regenerate description
- Users shall be able to edit AI-generated description
- Generation shall complete in <3 seconds (95th percentile)

**FR-3.2: Explain Code**
- Users shall trigger code explanation via button
- System shall send code and language to AI API
- AI shall return line-by-line or block-by-block explanation
- Explanation shall be stored in database
- Users shall be able to regenerate explanation
- Explanation shall be formatted for readability

**FR-3.3: Suggest Tags**
- Users shall trigger tag suggestion via button
- System shall send code and language to AI API
- AI shall return 3-5 relevant tags
- Tags shall be presented for user approval
- Users shall be able to accept all, some, or none
- Users shall be able to add custom tags
- Tags shall be stored as array in database

### 6.4 Search and Filtering

**FR-4.1: Search**
- Users shall search snippets by:
  - Title (partial match, case-insensitive)
  - Tags (exact match)
  - Description content (partial match)
- Search shall return results in real-time
- Search results shall be ranked by relevance

**FR-4.2: Filtering**
- Users shall filter snippets by:
  - Programming language (multi-select)
  - Date range (created/updated)
- Filters shall be combinable
- Active filters shall be clearly visible
- Users shall be able to clear filters

**FR-4.3: Copy to Clipboard**
- Each snippet shall have "Copy Code" button
- Button click shall copy code to clipboard
- System shall show confirmation message
- Feature shall work across all modern browsers

---

## 7. Non-Functional Requirements

### 7.1 Performance
- **NFR-1.1:** Page load time shall be <2 seconds (95th percentile)
- **NFR-1.2:** AI operations shall complete in <3 seconds (95th percentile)
- **NFR-1.3:** Search results shall appear in <500ms
- **NFR-1.4:** Application shall support up to 1000 snippets per user without performance degradation

### 7.2 Security
- **NFR-2.1:** All passwords shall be hashed using industry-standard algorithms
- **NFR-2.2:** All API communications shall use HTTPS
- **NFR-2.3:** User sessions shall expire after 7 days of inactivity
- **NFR-2.4:** SQL injection protection shall be implemented
- **NFR-2.5:** XSS protection shall be implemented
- **NFR-2.6:** Users shall only access their own snippets (row-level security)

### 7.3 Availability
- **NFR-3.1:** System uptime shall be >95%
- **NFR-3.2:** Scheduled maintenance windows shall be communicated 48 hours in advance
- **NFR-3.3:** System shall gracefully handle AI API failures with appropriate error messages

### 7.4 Usability
- **NFR-4.1:** Application shall be responsive (mobile, tablet, desktop)
- **NFR-4.2:** UI shall follow WCAG 2.1 Level AA accessibility guidelines
- **NFR-4.3:** Error messages shall be clear and actionable
- **NFR-4.4:** Primary user flows shall require no more than 3 clicks

### 7.5 Scalability
- **NFR-5.1:** Architecture shall support horizontal scaling
- **NFR-5.2:** Database queries shall use proper indexing
- **NFR-5.3:** AI API calls shall be rate-limited per user

---

## 8. Technical Requirements

### 8.1 Technology Stack
- **Frontend:** Astro + React + TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** Supabase Auth
- **Database:** Supabase (PostgreSQL)
- **AI Provider:** OpenAI API (GPT-4 or GPT-3.5-turbo)
- **Syntax Highlighting:** Prism.js
- **Testing:** Playwright (E2E)
- **CI/CD:** GitHub Actions
- **Hosting:** Vercel

### 8.2 Database Schema

```sql
-- Users table (managed by Supabase Auth)

-- Snippets table
CREATE TABLE snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  code TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  description TEXT,
  ai_description TEXT,
  ai_explanation TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_snippets_user_id ON snippets(user_id);
CREATE INDEX idx_snippets_language ON snippets(language);
CREATE INDEX idx_snippets_tags ON snippets USING GIN(tags);
CREATE INDEX idx_snippets_created_at ON snippets(created_at DESC);

-- Row Level Security
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snippets"
  ON snippets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snippets"
  ON snippets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snippets"
  ON snippets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snippets"
  ON snippets FOR DELETE
  USING (auth.uid() = user_id);
```

### 8.3 AI Integration

**API Provider:** OpenAI
**Model:** GPT-3.5-turbo (cost-effective) or GPT-4 (higher quality)
**Rate Limits:** 60 requests per minute per user
**Error Handling:** Retry logic with exponential backoff

**Prompt Templates:**

1. **Description Generation:**
```
Analyze this {language} code and provide a concise 1-2 sentence description of what it does. Focus on the main functionality.

Code:
{code}

Description:
```

2. **Code Explanation:**
```
Explain this {language} code step by step. Break down the logic and explain what each important section does.

Code:
{code}

Explanation:
```

3. **Tag Suggestion:**
```
Suggest 3-5 relevant tags for this {language} code snippet. Tags should describe the functionality, patterns, or technologies used. Return only comma-separated tags.

Code:
{code}

Tags:
```

### 8.4 API Endpoints (if needed)

```
POST /api/ai/describe
POST /api/ai/explain
POST /api/ai/suggest-tags
```

---

## 9. Success Metrics

### 9.1 AI Feature Adoption
- **Metric:** % of snippets with AI-generated descriptions
- **Target:** 80%
- **Measurement:** Count of snippets with ai_description field populated

- **Metric:** % of users using "Explain Code" weekly
- **Target:** 60%
- **Measurement:** Weekly active users who trigger explanation feature

- **Metric:** % of AI-generated tags accepted
- **Target:** 70%
- **Measurement:** Accepted tags / Total suggested tags

### 9.2 User Engagement
- **Metric:** Average snippets added per user (first week)
- **Target:** 5-10 snippets
- **Measurement:** Count of snippets created within 7 days of registration

- **Metric:** Weekly retention rate
- **Target:** 75%
- **Measurement:** Users who return at least once per week

- **Metric:** Average session duration
- **Target:** 10+ minutes
- **Measurement:** Time from login to logout/session end

### 9.3 Technical Performance
- **Metric:** Application uptime
- **Target:** 95%
- **Measurement:** Uptime monitoring service

- **Metric:** AI response time (95th percentile)
- **Target:** <3 seconds
- **Measurement:** Server-side logging

- **Metric:** E2E test coverage
- **Target:** 100% of critical paths
- **Measurement:** Test suite report

### 9.4 Business Value
- **Metric:** Monthly active users (30-day retention)
- **Target:** 60%
- **Measurement:** Users active 30+ days after registration

- **Metric:** Average time to find snippet
- **Target:** <30 seconds
- **Measurement:** User survey + analytics

- **Metric:** Net Promoter Score (NPS)
- **Target:** >40
- **Measurement:** Quarterly user survey

---

## 10. Timeline and Milestones

### Phase 1: Foundation (Weekend 1 - 6-8 hours)
**Milestone:** Basic application with auth and CRUD
- Setup project (Astro + React + TypeScript)
- Configure Supabase (auth + database)
- Implement login/registration
- Implement basic snippet CRUD
- Add syntax highlighting

### Phase 2: AI Integration (Weekend 2 - 5-6 hours)
**Milestone:** AI features working
- Integrate OpenAI API
- Implement description generation
- Implement code explanation
- Implement tag suggestions
- Add search and filtering
- UI/UX improvements

### Phase 3: Quality & Deployment (Week 3 - 4-5 hours)
**Milestone:** Production-ready application
- Write E2E tests (Playwright)
- Setup CI/CD pipeline (GitHub Actions)
- Deploy to Vercel
- Write documentation (README, setup guide)
- Final testing and bug fixes

**Total Estimated Time:** 15-18 hours

---

## 11. Out of Scope (Not in MVP)

### AI Features
- Advanced code review with refactoring suggestions
- Automatic bug detection
- Code optimization recommendations
- Multi-language code translation

### Social Features
- Sharing snippets with other users
- Public snippet profiles
- Commenting on snippets
- Forking/cloning snippets
- User profiles

### Integrations
- GitHub Gists import
- VSCode extension
- Browser extension
- Notion/Confluence sync
- Export to PDF/Markdown

### Advanced Organization
- Folders/collections
- Snippet versioning
- Hierarchical tagging
- Favorite snippets
- Usage statistics
- Related snippets suggestions

### Premium Features
- Custom themes
- Advanced search (regex, full-text)
- Bulk operations
- Backup/restore
- API access
- Team workspaces

---

## 12. Future Considerations

### Post-MVP Phase 1 (Next 20 hours)
- Favorite snippets
- Snippet collections/folders
- Dark mode
- Advanced search
- Export functionality

### Post-MVP Phase 2 (Next 30 hours)
- GitHub Gists integration
- VSCode extension
- Snippet versioning
- Public sharing links
- Team collaboration features

### Monetization Strategy (Future)
- Free tier: 100 snippets, 50 AI requests/month
- Pro tier ($5/month): Unlimited snippets, 500 AI requests/month
- Team tier ($15/user/month): Shared snippets, unlimited AI

---

## 13. Risks and Mitigation

### Technical Risks

**Risk:** AI API costs higher than expected
- **Mitigation:** Use GPT-3.5-turbo instead of GPT-4, implement rate limiting
- **Probability:** Medium
- **Impact:** Medium

**Risk:** AI response quality inconsistent
- **Mitigation:** Implement prompt engineering best practices, allow regeneration
- **Probability:** Medium
- **Impact:** Medium

**Risk:** Performance issues with large snippet collections
- **Mitigation:** Implement pagination, proper indexing, lazy loading
- **Probability:** Low
- **Impact:** High

### Business Risks

**Risk:** Low user adoption
- **Mitigation:** Focus on clear value proposition, great UX, target developer communities
- **Probability:** Medium
- **Impact:** High

**Risk:** Competition from established tools
- **Mitigation:** Emphasize AI features as differentiator, focus on simplicity
- **Probability:** High
- **Impact:** Medium

---

## 14. Assumptions and Dependencies

### Assumptions
- Users have stable internet connection
- Users are comfortable with English AI responses
- Users trust AI-generated content
- OpenAI API remains accessible and affordable

### Dependencies
- Supabase service availability
- OpenAI API availability
- Vercel hosting service
- Third-party libraries (Prism.js, Tailwind)

---

## 15. Approval and Sign-off

**Document Status:** Draft  
**Next Review Date:** TBD  
**Approved By:** TBD  

---

**Document Version History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-11 | Development Team | Initial draft |