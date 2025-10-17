# AI Code Snippet Manager - Development Context

## 📋 Quick Reference

**Project Duration:** 15-18 hours
**Certification:** AI for Developers
**Deadline:** November 16, 2025 (first deadline)

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
- Astro 4.x (Static Site Generator with Islands Architecture)
- React 18 (for interactive components only)
- TypeScript (strict mode)
- Tailwind CSS (utility-first styling)

**Backend Services:**
- Supabase Auth (authentication)
- Supabase PostgreSQL (database with Row-Level Security)
- OpenAI API GPT-3.5-turbo (AI features)

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