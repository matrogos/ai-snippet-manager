# Application - AI Code Snippet Manager (MVP)

## Main Problem
Developers regularly save code snippets in various places - note-taking apps, text files, code comments - but quickly lose context about what the code does and when to use it. Lack of centralization and documentation causes valuable solutions to get lost in the chaos of files. Additionally, manually describing each snippet is time-consuming and often postponed "for later", leaving snippets without context.

The application solves this problem through:
- Central place to store all snippets
- Automatic generation of descriptions and explanations by AI
- Intelligent tagging that makes it easier to find code later

## Minimum Feature Set

### User Authentication
- Registration and login (email/password)
- Basic user session management
- Password reset

### Snippet Management (CRUD)
- **Create:** Adding new snippet with code, programming language, and title
- **Read:** Browsing list of all user's snippets in card or table format
- **Update:** Editing existing snippets
- **Delete:** Removing unnecessary snippets
- **Syntax highlighting:** Code syntax coloring for readability

### AI Features
- **Description Generation:** Automatic creation of concise (1-2 sentence) description of snippet functionality
- **Code Explanation:** Detailed, line-by-line explanation of how the code works
- **Tag Suggestions:** Automatic suggestion of 3-5 relevant tags based on code analysis

### Basic Additional Features
- Search snippets by title and tags
- Filter by programming language
- Copy code to clipboard with one click
- Responsive user interface

## What's NOT in MVP Scope

### Advanced AI Features
- AI Code Review with optimization suggestions
- Automatic bug detection in code
- Refactoring suggestions

### Social Features
- Sharing snippets with other users
- Public user profiles
- Comment and rating system
- Forking others' snippets

### External Integrations
- Import from GitHub Gists
- VSCode integration (extension)
- Sync with other tools (Notion, Confluence)
- Export to PDF/Markdown

### Advanced Organization
- Collections/folders for snippets
- Hierarchical tagging
- Marking favorite snippets
- Usage statistics for snippets

### Premium Features
- Custom color themes
- Advanced search (regex, full-text search)
- Snippet change history (versioning)
- Backup and restore

## Success Criteria

### AI Feature Adoption
- **80% of snippets** have AI-generated descriptions
- **60% of users** use "Explain Code" feature at least once per week
- **70% of AI-generated tags** are accepted without modification

### User Engagement
- Users add an average of **5-10 snippets in the first week** of use
- **75% of users** return to the application at least once per week
- Average application usage time is **10+ minutes per session**

### Technical Functionality
- **95% uptime** for the application
- AI description generation takes **less than 3 seconds**
- All key features covered by E2E tests

### Business Value
- **60% of users** on free accounts actively use the application after one month
- Users find saved snippets on average in **less than 30 seconds**
- **NPS (Net Promoter Score) > 40** in the first 3 months

---

**Version:** 1.0  
**Date:** 2025-10-11  
**Estimated implementation time:** 15-18h