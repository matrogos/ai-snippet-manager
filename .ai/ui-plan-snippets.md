# UI Architecture for AI Code Snippet Manager

## 1. UI Structure Overview

The user interface is built around code snippet management with AI-powered features accessible after authentication. The structure includes authentication views, a dashboard for browsing snippets, snippet creation/editing with AI assistance, and detailed snippet views. The entire interface uses responsive design based on Tailwind CSS, ready-made components from Shadcn/ui, and React for interactive elements.

## 2. List of Views

### Landing Page
- **Path:** `/`
- **Main Purpose:** Introduce the application and drive user registration.
- **Key Information:** Hero section with value proposition, key features overview, call-to-action buttons (Login, Sign Up).
- **Key Components:** Hero section, feature cards, navigation header with auth buttons, footer.
- **UX, Accessibility & Security:** Clear value proposition, high contrast buttons, responsive design, keyboard navigation.

### Authentication Views
- **Paths:** `/login` and `/register`
- **Main Purpose:** Enable user login and registration.
- **Key Information:** Forms with email and password fields; authentication error messages; password reset link (login only).
- **Key Components:** Login/registration forms, validation component, buttons, error messages, loading states.
- **UX, Accessibility & Security:** Simple forms, clear error messages, keyboard support, JWT security, password strength indicator (registration), "Remember me" option (login).

### Dashboard (Snippet List)
- **Path:** `/dashboard`
- **Main Purpose:** Browse, search, filter, and manage all user's code snippets.
- **Key Information:** List of snippets with title, language, tags, preview; search bar; language filter; create new button.
- **Key Components:** 
  - Search input with real-time filtering
  - Language filter dropdown (multi-select)
  - Tag filter chips
  - Snippet cards grid/list
  - "New Snippet" button
  - Empty state component (no snippets yet)
  - Pagination controls
- **UX, Accessibility & Security:** 
  - Responsive grid layout
  - Clear visual hierarchy
  - Keyboard shortcuts (Ctrl+K for search)
  - Loading skeletons during data fetch
  - Sort options (newest, oldest, title)
  - Clear filter indicators

### Create Snippet View
- **Path:** `/snippet/new`
- **Main Purpose:** Create a new code snippet with optional AI assistance.
- **Key Information:** Form with title, code editor, language selector, description field, tags input; AI panel with three buttons.
- **Key Components:**
  - Snippet form (title, code, language, description, tags)
  - Code editor with syntax highlighting (Prism.js)
  - Language selector dropdown (13 languages)
  - Tags input (chip-based, add/remove)
  - AI Panel with three buttons:
    - "Generate Description" - auto-generates snippet description
    - "Explain Code" - provides step-by-step explanation
    - "Suggest Tags" - recommends relevant tags
  - Save button (validates before submit)
  - Cancel button (returns to dashboard)
  - Loading states for AI operations
  - Toast notifications for success/error
- **UX, Accessibility & Security:**
  - Auto-save draft every 30 seconds
  - Client-side validation (title non-empty, code non-empty, language selected)
  - Clear AI loading indicators (<3 second target)
  - Confirmation dialog if leaving with unsaved changes
  - Syntax highlighting updates in real-time
  - Accessible code editor with proper ARIA labels

### Snippet Detail View
- **Path:** `/snippet/[id]`
- **Main Purpose:** View full snippet with all details including AI-generated content.
- **Key Information:** Complete snippet display with syntax-highlighted code, title, language badge, tags, description, AI description, AI explanation.
- **Key Components:**
  - Snippet header (title, language badge, created/updated dates)
  - Code display with syntax highlighting and line numbers
  - Copy to clipboard button (one-click)
  - Tags display (clickable for search)
  - Description section (user-provided)
  - AI Description section (if generated)
  - AI Explanation section (if generated, expandable/collapsible)
  - Action buttons: Edit, Delete (with confirmation)
  - Back to dashboard link
- **UX, Accessibility & Security:**
  - Clear visual separation between user and AI content
  - Copy confirmation toast
  - Delete confirmation modal
  - Responsive code display (horizontal scroll for long lines)
  - Keyboard navigation (Tab through interactive elements)
  - Print-friendly view

### Edit Snippet View
- **Path:** `/snippet/edit/[id]`
- **Main Purpose:** Modify existing snippet with ability to regenerate AI content.
- **Key Information:** Pre-filled form with existing snippet data; ability to modify all fields and re-trigger AI features.
- **Key Components:** Same as Create Snippet View, but:
  - Form pre-populated with existing data
  - "Regenerate" buttons for AI features (updates existing AI content)
  - "Save Changes" button instead of "Create"
  - Option to clear AI-generated content
- **UX, Accessibility & Security:**
  - Same as Create view
  - Visual indicator that AI content can be regenerated
  - Track changes and warn if leaving without saving
  - Preserve original AI content until user confirms regeneration

### User Profile (Optional for MVP)
- **Path:** `/profile`
- **Main Purpose:** Manage account information and settings.
- **Key Information:** User email, account creation date, logout button.
- **Key Components:** Profile information display, logout button, future: preferences, dark mode toggle.
- **UX, Accessibility & Security:** Secure logout, simple interface, confirmation before logout.

## 3. User Journey Map

1. **First Visit:** User lands on the landing page and sees the value proposition.
2. **Registration:** User clicks "Sign Up" and is taken to registration page. After successful registration, they're redirected to the dashboard.
3. **Empty State:** New user sees empty dashboard with prominent "Create Your First Snippet" button.
4. **Create First Snippet:** 
   - User clicks "New Snippet" button
   - Fills in title and pastes code
   - Selects programming language
   - Clicks "Generate Description" - AI creates a summary
   - Reviews AI description, optionally clicks "Explain Code" for deeper understanding
   - Clicks "Suggest Tags" - AI proposes relevant tags
   - Reviews and accepts/modifies suggested tags
   - Saves the snippet
5. **Dashboard View:** User returns to dashboard and sees their newly created snippet.
6. **Search & Filter:** As collection grows:
   - User searches by title or tags
   - Filters by programming language
   - Sorts by date or title
7. **View Details:** User clicks on a snippet card to see full details with syntax highlighting.
8. **Edit Snippet:** User clicks "Edit" button, modifies code or regenerates AI content, saves changes.
9. **Delete Snippet:** User clicks "Delete" button, confirms in modal, snippet is removed.
10. **Copy & Use:** User clicks "Copy Code" button from detail view, pastes into their IDE.
11. **Error Handling:** If AI service fails, user sees friendly error message with option to retry or skip AI features.

## 4. Layout and Navigation Structure

### Main Navigation
- **Location:** Top navigation bar (sticky), visible after login
- **Navigation Elements:**
  - Logo/Brand (links to dashboard)
  - "Dashboard" link
  - "New Snippet" button (prominent, primary color)
  - Search bar (global, Ctrl+K shortcut)
  - User menu (dropdown):
    - Profile
    - Settings (future)
    - Logout
- **Responsive Behavior:** 
  - Desktop: Full horizontal navigation
  - Tablet: Condensed with icons
  - Mobile: Hamburger menu with drawer

### Layout Structure
- **Public Layout** (Landing, Login, Register):
  - Simple header with logo and auth buttons
  - Full-width content area
  - Footer with links

- **Authenticated Layout** (Dashboard, Create, Edit, Detail):
  - Sticky top navigation
  - Optional sidebar (future: for categories/collections)
  - Main content area with max-width container
  - Consistent spacing and padding

### Breadcrumbs
- **Usage:** Shown on Detail and Edit views
- **Example:** Dashboard > JavaScript > Array Sorting Function

## 5. Key Components

### Authentication Components
- **LoginForm:** Email/password inputs, submit button, "Forgot password?" link, error display
- **RegisterForm:** Email, password, confirm password inputs, password strength indicator, terms acceptance
- **FormInput:** Reusable input component with label, validation, error state
- **FormButton:** Styled button with loading state

### Snippet Display Components
- **SnippetCard:** 
  - Compact view for dashboard
  - Shows: title, language badge, tags (first 3), code preview (first 3 lines), date
  - Hover state with quick actions (view, edit, delete)
- **SnippetList:** 
  - Container for snippet cards
  - Supports grid or list view toggle
  - Handles empty state
  - Loading skeleton states
- **CodeDisplay:**
  - Syntax-highlighted code using Prism.js
  - Line numbers
  - Copy button overlay
  - Language indicator
  - Horizontal scroll for long lines

### Form Components
- **SnippetForm:**
  - Title input
  - Code textarea/editor
  - Language selector (searchable dropdown)
  - Description textarea
  - Tags input (chip-based, type and Enter to add)
  - Form validation feedback
- **CodeEditor:**
  - Textarea with Prism.js integration
  - Tab key handling
  - Auto-indentation
  - Line numbers
  - Syntax highlighting preview

### AI Integration Components
- **AIPanel:**
  - Three primary buttons vertically stacked or horizontal on desktop
  - Each button shows loading spinner during AI processing
  - Results display inline below buttons
  - Error handling with retry option
- **AIDescriptionDisplay:** Shows AI-generated description with edit capability
- **AIExplanationDisplay:** Collapsible section showing step-by-step code explanation
- **TagSuggestions:** Chip-based display with accept/reject for each suggested tag

### Search & Filter Components
- **SearchBar:**
  - Input with search icon
  - Real-time filtering
  - Clear button (X)
  - Keyboard shortcut hint (Ctrl+K)
- **LanguageFilter:**
  - Multi-select dropdown
  - Shows count of snippets per language
  - "Select All" / "Clear All" options
- **TagFilter:**
  - Popular tags display as chips
  - Type to search for other tags
  - Applied filters shown with X to remove
- **SortDropdown:** Sort by newest, oldest, title A-Z

### Utility Components
- **CopyButton:** One-click copy to clipboard with visual feedback
- **ConfirmDialog:** Modal for destructive actions (delete snippet)
- **Toast:** Non-blocking notifications for success/error messages
- **LoadingSkeleton:** Placeholder UI during data loading
- **EmptyState:** Friendly message with action button when no snippets exist
- **Badge:** Visual indicator for language, tags, status

### Navigation Components
- **Navbar:** Top navigation with logo, links, search, user menu
- **UserMenu:** Dropdown with profile options and logout
- **MobileMenu:** Drawer-style navigation for mobile devices
- **Breadcrumbs:** Navigation path display

## 6. Design System

### Colors
- **Primary:** Blue (#0ea5e9) - CTAs, active states
- **Secondary:** Gray - text, borders
- **Success:** Green - successful operations
- **Error:** Red - errors, validation failures
- **Warning:** Yellow - AI processing, warnings
- **Code Background:** Dark gray (#1e1e1e) for code blocks

### Typography
- **Headings:** Sans-serif (Inter), bold, varying sizes
- **Body:** Sans-serif (Inter), regular weight
- **Code:** Monospace (Fira Code), for code display

### Spacing
- Consistent 8px grid system
- Component padding: 16px, 24px, 32px
- Section margins: 32px, 48px, 64px

### Interactive States
- **Hover:** Subtle background change, pointer cursor
- **Focus:** 2px outline with primary color, visible focus ring
- **Active:** Slightly darker background
- **Disabled:** Reduced opacity (0.5), not-allowed cursor
- **Loading:** Spinner or skeleton, pointer-events disabled

### Responsive Breakpoints
- **Mobile:** < 640px (1 column)
- **Tablet:** 640px - 1024px (2 columns)
- **Desktop:** > 1024px (3 columns)

## 7. Accessibility Considerations

- **Keyboard Navigation:** All interactive elements accessible via Tab, Enter, Escape
- **Screen Readers:** Proper ARIA labels, semantic HTML, alt text for icons
- **Color Contrast:** WCAG 2.1 Level AA compliance (4.5:1 for text)
- **Focus Indicators:** Visible focus rings on all interactive elements
- **Error Handling:** Clear, actionable error messages, associated with form fields
- **Skip Links:** "Skip to main content" for keyboard users

## 8. Performance Considerations

- **Code Splitting:** Lazy load routes and heavy components (code editor, AI panel)
- **Image Optimization:** Use optimized formats, lazy loading
- **Debouncing:** Search input debounced to reduce API calls
- **Caching:** Cache snippet list, invalidate on mutations
- **Pagination:** Load snippets in chunks (20 per page)
- **Syntax Highlighting:** Load language definitions on-demand

## 9. Error States

- **Network Error:** "Unable to connect. Check your internet connection."
- **API Error:** "Something went wrong. Please try again."
- **Validation Error:** Inline messages below invalid fields
- **AI Service Error:** "AI service temporarily unavailable. You can still create snippets manually."
- **Not Found:** 404 page with link back to dashboard
- **Unauthorized:** Redirect to login with message

## 10. Future Enhancements (Post-MVP)

- **Dark Mode:** Toggle in user preferences
- **Code Editor Themes:** Multiple syntax highlighting themes
- **Snippet Collections:** Organize snippets into folders
- **Public Sharing:** Generate shareable links for snippets
- **Export:** Download snippets as files (MD, PDF)
- **Keyboard Shortcuts:** Full keyboard navigation (Vim-style optional)
- **Favorites:** Star important snippets
- **Recent Snippets:** Quick access widget on dashboard