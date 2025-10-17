# AI Code Snippet Manager - Development Context

## 📚 Documentation

Please read these documents before starting any development:

1. **MVP.md** - Located in `docs/MVP.md`
   - Defines minimum viable product scope
   - Lists what's IN and OUT of scope
   - Success criteria

2. **PRD.md** - Located in `docs/PRD.md`
   - Complete product requirements
   - User stories and functional requirements
   - Technical specifications
   - Non-functional requirements

3. **TAD.md** - Located in `docs/TAD.md`
   - System architecture
   - Component design
   - Database schema
   - Security architecture
   - AI integration patterns
   - Deployment strategy

## 🛠️ Technology Stack

**Frontend:**
- Astro 5.x (Static Site Generator with Islands Architecture)
- React 19 (for interactive components only)
- TypeScript (strict mode)
- Tailwind CSS (utility-first styling)

**Backend Services:**
- Supabase Auth (authentication)
- Supabase PostgreSQL (database with Row-Level Security)
- OpenAI API gpt-5-mini (AI features)

**Development:**
- Prism.js (syntax highlighting)
- Playwright (E2E testing)
- ESLint + Prettier (code quality)

**Deployment:**
- Vercel (hosting)
- GitHub Actions (CI/CD)

## 🗄️ Database Schema

```sql
CREATE TABLE snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
```

## 🎨 Design Principles

1. **Islands Architecture**: Only interactive components should use React
2. **Type Safety**: Use TypeScript strict mode everywhere
3. **Security First**: Row-Level Security for all data access
4. **Performance**: Page loads <2s, AI calls <3s
5. **Mobile First**: Responsive design using Tailwind

## 🔑 Environment Variables

```
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
PUBLIC_APP_URL=http://localhost:4321
```

## ✅ Certification Requirements

**Mandatory:**
- ✅ User authentication (Supabase Auth)
- ✅ CRUD operations (snippets)
- ✅ Business logic (AI features)
- ✅ PRD + documentation
- ✅ E2E tests (Playwright)
- ✅ CI/CD pipeline (GitHub Actions)

**Optional (for distinction):**
- ✅ Public URL (Vercel)
- ✅ Additional features (search, copy, syntax highlighting)

## 📝 Development Priorities

1. **Authentication** (2-3h)
2. **CRUD Operations** (4-5h)
3. **AI Features** (3-4h)
4. **Search & Filter** (2h)
5. **Testing** (2-3h)
6. **CI/CD & Deployment** (2h)

## 🚫 Out of Scope for MVP

- Social features (sharing, profiles)
- Advanced AI (code review, bug detection)
- External integrations (GitHub Gists, VSCode)
- Folders/collections
- Versioning/history
- Custom themes

## 💡 Important Notes

- Focus on MVP features only
- Keep code simple and maintainable
- Follow the architecture in TAD.md
- Write tests for critical paths
- Document as you go

---

When implementing features, always refer to:
- MVP.md for scope boundaries
- PRD.md for detailed requirements
- TAD.md for implementation patterns

# AI Rules
## DATABASE

### Guidelines for SQL

#### POSTGRES

- Use connection pooling to manage database connections efficiently
- Implement JSONB columns for semi-structured data instead of creating many tables for {{flexible_data}}
- Use materialized views for complex, frequently accessed read-only data

## CODING_PRACTICES

### Guidelines for VERSION_CONTROL

#### GIT

- Use conventional commits to create meaningful commit messages
- Use feature branches with descriptive names following {{branch_naming_convention}}
- Write meaningful commit messages that explain why changes were made, not just what
- Keep commits focused on single logical changes to facilitate code review and bisection
- Use interactive rebase to clean up history before merging feature branches
- Leverage git hooks to enforce code quality checks before commits and pushes


### Guidelines for DOCUMENTATION

#### DOC_UPDATES

- Update relevant documentation in /docs when modifying features
- Keep README.md in sync with new capabilities
- Maintain changelog entries in CHANGELOG.md

## FRONTEND

### Guidelines for REACT

#### REACT_CODING_STANDARDS

- Use functional components with hooks instead of class components
- Implement React.memo() for expensive components that render often with the same props
- Utilize React.lazy() and Suspense for code-splitting and performance optimization
- Use the useCallback hook for event handlers passed to child components to prevent unnecessary re-renders
- Prefer useMemo for expensive calculations to avoid recomputation on every render
- Implement useId() for generating unique IDs for accessibility attributes
- Use the new use hook for data fetching in React 19+ projects
- Leverage Server Components for {{data_fetching_heavy_components}} when using React with Next.js or similar frameworks
- Consider using the new useOptimistic hook for optimistic UI updates in forms
- Use useTransition for non-urgent state updates to keep the UI responsive

## DEVOPS

### Guidelines for CI_CD

#### GITHUB_ACTIONS

- Check if `package.json` exists in project root and summarize key scripts
- Check if `.nvmrc` exists in project root
- Check if `.env.example` exists in project root to identify key `env:` variables
- Always use terminal command: `git branch -a | cat` to verify whether we use `main` or `master` branch
- Always use `env:` variables and secrets attached to jobs instead of global workflows
- Always use `npm ci` for Node-based dependency setup
- Extract common steps into composite actions in separate files
- Once you're done, as a final step conduct the following: for each public action always use <tool>"Run Terminal"</tool> to see what is the most up-to-date version (use only major version) - extract tag_name from the response:
- ```bash curl -s https://api.github.com/repos/{owner}/{repo}/releases/latest ```

## TESTING

### Guidelines for E2E

#### PLAYWRIGHT

- Initialize configuration only with Chromium/Desktop Chrome browser
- Use browser contexts for isolating test environments
- Implement the Page Object Model for maintainable tests
- Use locators for resilient element selection
- Leverage API testing for backend validation
- Implement visual comparison with expect(page).toHaveScreenshot()
- Use the codegen tool for test recording
- Leverage trace viewer for debugging test failures
- Implement test hooks for setup and teardown
- Use expect assertions with specific matchers
- Leverage parallel execution for faster test runs