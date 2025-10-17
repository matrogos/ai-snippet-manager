# Authentication Testing Guide

## ✅ Authentication Flow Test Checklist

### Prerequisites
- ✅ Dev server running at `http://localhost:4321/`
- ✅ Database schema executed in Supabase
- ✅ Supabase environment variables configured in `.env.local`

---

## Test 1: Landing Page
**URL:** `http://localhost:4321/`

**Expected:**
- [ ] Page loads without errors
- [ ] Shows "AI-Powered Code Snippet Manager" heading
- [ ] "Get Started" button links to `/register`
- [ ] "Login" button links to `/login`
- [ ] Three feature cards visible (AI Descriptions, Code Explanations, Smart Tagging)

---

## Test 2: Registration Flow
**URL:** `http://localhost:4321/register`

**Test Case 2.1: Valid Registration**
1. Navigate to `/register`
2. Enter email: `test@example.com`
3. Enter password: `password123` (min 8 chars)
4. Confirm password: `password123`
5. Click "Create account"

**Expected:**
- [ ] Form validates successfully
- [ ] Loading state shows "Creating account..."
- [ ] Success message appears: "Account created!"
- [ ] Auto-redirects to `/login` after 2 seconds

**Test Case 2.2: Password Validation**
1. Enter password: `short` (less than 8 chars)
2. Try to submit

**Expected:**
- [ ] Error message: "Password must be at least 8 characters long"

**Test Case 2.3: Password Mismatch**
1. Enter password: `password123`
2. Confirm password: `different123`
3. Try to submit

**Expected:**
- [ ] Error message: "Passwords do not match"

**Test Case 2.4: Invalid Email**
1. Enter email: `notanemail`
2. Try to submit

**Expected:**
- [ ] Error message: "Please enter a valid email address"

**Test Case 2.5: Duplicate Email**
1. Try to register with same email again
2. Submit

**Expected:**
- [ ] Supabase error message about duplicate email

---

## Test 3: Login Flow
**URL:** `http://localhost:4321/login`

**Test Case 3.1: Valid Login**
1. Navigate to `/login`
2. Enter email: `test@example.com`
3. Enter password: `password123`
4. Click "Login"

**Expected:**
- [ ] Loading state shows "Logging in..."
- [ ] Successfully redirects to `/dashboard`
- [ ] Dashboard shows user email
- [ ] Dashboard shows "No snippets yet" message

**Test Case 3.2: Invalid Credentials**
1. Enter email: `test@example.com`
2. Enter password: `wrongpassword`
3. Try to login

**Expected:**
- [ ] Error message from Supabase (invalid credentials)

**Test Case 3.3: Non-existent User**
1. Enter email: `doesnotexist@example.com`
2. Enter password: `password123`
3. Try to login

**Expected:**
- [ ] Error message from Supabase (invalid credentials)

---

## Test 4: Protected Routes (Middleware)
**Test Case 4.1: Access Dashboard Without Login**
1. Open new incognito/private window
2. Navigate directly to `http://localhost:4321/dashboard`

**Expected:**
- [ ] Automatically redirects to `/login`
- [ ] Cannot access dashboard when not authenticated

**Test Case 4.2: Access Login When Already Logged In**
1. While logged in, navigate to `/login`

**Expected:**
- [ ] Automatically redirects to `/dashboard`
- [ ] Cannot access login page when already authenticated

**Test Case 4.3: Access Register When Already Logged In**
1. While logged in, navigate to `/register`

**Expected:**
- [ ] Automatically redirects to `/dashboard`
- [ ] Cannot access register page when already authenticated

---

## Test 5: Logout Flow
**Test Case 5.1: Logout**
1. While logged in at `/dashboard`
2. Click "Logout" button in navigation

**Expected:**
- [ ] User is logged out
- [ ] Redirects to `/login`
- [ ] Cannot access `/dashboard` anymore (redirects to login)

---

## Test 6: Session Persistence
**Test Case 6.1: Refresh Page**
1. Login successfully
2. Refresh the page

**Expected:**
- [ ] User remains logged in
- [ ] Dashboard still accessible
- [ ] No need to login again

**Test Case 6.2: New Tab**
1. While logged in
2. Open new tab
3. Navigate to `http://localhost:4321/dashboard`

**Expected:**
- [ ] User is still logged in
- [ ] Dashboard accessible immediately

---

## Troubleshooting

### Registration fails with no error
- Check Supabase dashboard → Authentication → Users
- Verify email confirmation is disabled for testing
- Check browser console for errors

### Login fails immediately
- Verify Supabase URL and Anon Key in `.env.local`
- Check browser console for CORS or network errors
- Verify Supabase project is active

### Middleware not redirecting
- Check browser console for errors
- Verify middleware is configured in `src/middleware.ts`
- Hard refresh the page (Ctrl+Shift+R)

### Dashboard shows "No snippets" but errors in console
- This is expected - we haven't built snippet CRUD yet
- As long as you see your email and the page loads, auth is working

---

## ✅ Success Criteria

All tests pass when:
- [x] Can register new account
- [x] Can login with valid credentials
- [x] Cannot login with invalid credentials
- [x] Cannot access protected routes when logged out
- [x] Cannot access auth pages when logged in
- [x] Can logout successfully
- [x] Session persists across page refreshes

---

## Next Steps After Testing

Once authentication is confirmed working:
1. Mark Phase 2 as complete ✅
2. Move to Phase 4: Snippet CRUD
3. Build snippet creation, editing, and listing features
