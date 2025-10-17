# AI Code Snippet Manager 🚀

A web application for organizing and documenting code snippets with AI-powered descriptions, explanations, and automatic tagging.

## 📋 Project Overview

This project is built for the **AI for Developers** certification program. It demonstrates the integration of AI capabilities into a practical developer tool.

**Key Features:**
- 🔐 User authentication and secure snippet storage
- ✍️ Create, read, update, and delete code snippets
- 🤖 AI-powered description generation
- 📖 AI code explanations (line-by-line)
- 🏷️ Automatic tag suggestions
- 🔍 Search and filter by language, tags, or title
- 🎨 Syntax highlighting for 13+ programming languages
- 📱 Responsive design

## 🛠️ Tech Stack

**Frontend:**
- [Astro](https://astro.build/) - Static site generator with Islands Architecture
- [React](https://react.dev/) - UI components
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling

**Backend Services:**
- [Supabase](https://supabase.com/) - Authentication & PostgreSQL database
- [OpenAI API](https://platform.openai.com/) - AI features (GPT-3.5-turbo)

**Development Tools:**
- [Prism.js](https://prismjs.com/) - Syntax highlighting
- [Playwright](https://playwright.dev/) - E2E testing
- [GitHub Actions](https://github.com/features/actions) - CI/CD
- [Vercel](https://vercel.com/) - Hosting

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-snippet-manager.git
   cd ai-snippet-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your credentials in `.env.local`:
   - `PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `OPENAI_API_KEY` - Your OpenAI API key

4. **Set up the database**
   - Create a new project in [Supabase](https://app.supabase.com/)
   - Run the SQL schema from `docs/database-schema.sql` in the Supabase SQL editor

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:4321](http://localhost:4321) in your browser.

## 📚 Documentation

- **[MVP.md](docs/MVP.md)** - Minimum Viable Product specification
- **[PRD.md](docs/PRD.md)** - Product Requirements Document
- **[TAD.md](docs/TAD.md)** - Technical Architecture Document
- **[Database Schema](docs/database-schema.sql)** - PostgreSQL schema with RLS policies

## 🧪 Testing

```bash
# Run E2E tests
npm run test

# Run tests in UI mode
npm run test:ui

# Run tests in headed mode
npm run test -- --headed
```

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy!

3. **Configure Environment Variables in Vercel**
   - Add all variables from `.env.example`
   - Redeploy if needed

## 📖 Usage

1. **Sign up** for an account
2. **Create a snippet** with code, title, and language
3. **Generate AI description** to automatically document what the code does
4. **Get explanations** for complex code sections
5. **Add tags** automatically or manually
6. **Search and filter** to quickly find snippets later
7. **Copy to clipboard** with one click

## 🏗️ Project Structure

```
ai-snippet-manager/
├── .claude/              # Claude Code context files
├── docs/                 # Project documentation
├── src/
│   ├── components/       # React components
│   │   ├── auth/        # Authentication components
│   │   ├── snippets/    # Snippet CRUD components
│   │   ├── ai/          # AI feature components
│   │   └── ui/          # Reusable UI components
│   ├── layouts/         # Astro layouts
│   ├── pages/           # Astro pages and API routes
│   ├── lib/             # Utilities and clients
│   ├── types/           # TypeScript type definitions
│   ├── styles/          # Global styles
│   └── config/          # Configuration files
├── tests/               # E2E tests
└── public/              # Static assets
```

## 🎯 Features

### Authentication
- Email/password registration and login
- Secure session management with Supabase Auth
- Protected routes

### Snippet Management
- Create, read, update, delete snippets
- Syntax highlighting for 13+ languages
- Code editor with line numbers

### AI Features
- **Auto-generate descriptions** - Get a concise summary of what your code does
- **Explain code** - Line-by-line explanations for better understanding
- **Suggest tags** - Automatic categorization based on code analysis

### Organization
- Search by title, tags, or description
- Filter by programming language
- Full-text search capabilities

## 🔒 Security

- Row-Level Security (RLS) in PostgreSQL
- JWT-based authentication
- HTTPS-only in production
- Input validation and sanitization
- API key protection via environment variables

## 📊 Success Metrics

- 80% of snippets have AI-generated descriptions
- 60% of users use "Explain Code" weekly
- 75% weekly user retention
- <3 second AI response time
- 95% uptime

## 🤝 Contributing

This is a certification project and is not open for contributions. However, feel free to fork it for your own use!

## 📄 License

MIT License - feel free to use this code for learning purposes.

## 👨‍💻 Author

Your Name - [GitHub](https://github.com/YOUR_USERNAME)

## 🙏 Acknowledgments

- Built for the **AI for Developers** certification program
- Powered by [Anthropic Claude](https://www.anthropic.com/claude)
- UI inspired by modern developer tools

## 📞 Support

For issues related to this project, please open an issue on GitHub.

---

**Status:** ✅ MVP Complete  
**Version:** 1.0.0  
**Last Updated:** October 2025