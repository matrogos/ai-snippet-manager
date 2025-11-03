# GitHub Actions Workflows

## Pull Request CI Workflow

The `pull-request.yml` workflow runs automatically on all pull requests to `main` and `develop` branches.

### Workflow Steps

```
1. Lint Code
   ├── ESLint validation
   └── TypeScript type checking

2. Parallel Jobs (after lint passes)
   ├── Unit Tests
   │   ├── Run tests with coverage
   │   ├── Upload coverage artifacts
   │   └── Comment coverage percentage on PR
   │
   └── E2E Tests
       ├── Install Playwright browsers (chromium)
       ├── Set up test environment
       ├── Run E2E test suite
       └── Upload test results and coverage

3. Status Comment (only if all previous jobs pass)
   ├── Aggregate results from all jobs
   ├── Post/update status comment on PR
   └── Fail workflow if any job failed
```

### Required GitHub Secrets

Configure these secrets in your repository settings (`Settings` → `Secrets and variables` → `Actions` → `Environments` → `integration`):

#### Supabase Configuration
- `PUBLIC_SUPABASE_URL` - Your Supabase project URL
  - Example: `https://xxxxxxxxxxxxx.supabase.co`
  - Get from: https://app.supabase.com/project/_/settings/api

- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Get from: https://app.supabase.com/project/_/settings/api

- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for test data management)
  - Get from: https://app.supabase.com/project/_/settings/api
  - ⚠️ **Keep this secret!** Has admin access to bypass RLS

#### Test User Credentials
- `TEST_USER_EMAIL` - Email for test user account
  - Example: `e2e-test@example.com`
  - Create this user in your test Supabase project

- `TEST_USER_PASSWORD` - Password for test user
  - Example: `Test1234!`
  - Should match the test user's password

- `TEST_USER_ID` - UUID of the test user
  - Example: `8c48b15d-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
  - Get from Supabase Auth users table

#### OpenAI Configuration
- `OPENAI_API_KEY` - OpenAI API key for AI features
  - Example: `sk-proj-...`
  - Get from: https://platform.openai.com/api-keys
  - ⚠️ Optional for E2E tests if AI features are not tested

### Environment Setup

The workflow uses the `integration` environment for E2E tests. To set this up:

1. Go to `Settings` → `Environments`
2. Create a new environment named `integration`
3. Add all the secrets listed above to this environment
4. (Optional) Configure environment protection rules:
   - Required reviewers
   - Wait timer
   - Deployment branches

### Artifacts

The workflow uploads the following artifacts (available for 7 days):

- **unit-coverage**: Unit test coverage reports
- **e2e-results**: E2E test results and Playwright HTML report
- **e2e-coverage**: E2E test coverage (if configured)

### Viewing Results

After the workflow completes:

1. **PR Comment**: A bot will post/update a comment with the overall status
2. **Actions Tab**: View detailed logs in the Actions tab
3. **Checks**: View status in the PR's "Checks" section
4. **Artifacts**: Download coverage reports from the workflow run page

### Local Testing

Test the workflow locally before pushing:

```bash
# Lint
npm run lint
npm run type-check

# Unit tests
npm run test:coverage

# E2E tests (requires .env.test)
npm run test:e2e:validate
npm run test:e2e
```

### Troubleshooting

#### E2E Tests Failing

1. **Check test environment secrets**: Ensure all secrets are correctly set in the `integration` environment
2. **Verify test user exists**: The test user must exist in your test Supabase project
3. **Check browser installation**: Playwright should auto-install chromium
4. **Review test logs**: Check the uploaded artifacts for detailed error messages

#### Coverage Not Showing

1. **Unit tests**: Ensure `vitest` is configured to generate coverage
2. **E2E tests**: Coverage for E2E is optional, check playwright config

#### Status Comment Not Posted

1. **Check permissions**: Workflow needs `pull-requests: write` permission
2. **Check job status**: Status comment only runs if lint passes
3. **Review bot comments**: Look for existing bot comments that may be updated

### Modifying the Workflow

When making changes to `pull-request.yml`:

1. Test locally first
2. Create a draft PR to test the workflow
3. Review the Actions logs for any errors
4. Update this README if adding new requirements

### Performance Optimization

Current workflow features:

- ✅ npm caching for faster installs
- ✅ Parallel unit and E2E tests
- ✅ Only chromium browser installed (not all browsers)
- ✅ 10-minute timeout for E2E tests
- ✅ Conditional status comment (only on lint success)

Typical run times:
- Lint: ~1-2 minutes
- Unit tests: ~2-3 minutes
- E2E tests: ~3-5 minutes
- **Total**: ~5-7 minutes (parallel execution)

### CI/CD Best Practices

This workflow follows these best practices:

1. **Fail Fast**: Linting runs first, fast feedback on code quality
2. **Parallel Execution**: Unit and E2E tests run simultaneously
3. **Environment Isolation**: E2E uses dedicated `integration` environment
4. **Artifact Preservation**: Test results and coverage saved for debugging
5. **Clear Feedback**: PR comments provide at-a-glance status
6. **Security**: Secrets properly scoped to environments
7. **Timeout Protection**: E2E tests have 10-minute timeout
8. **Dependency Caching**: npm cache speeds up installations
