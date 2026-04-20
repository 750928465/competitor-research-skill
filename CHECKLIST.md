# Pre-Release Checklist

Use this checklist before pushing to GitHub or releasing a new version.

## Code Quality

- [x] All code builds successfully (`npm run build`)
- [x] No TypeScript errors
- [x] Code follows project style guidelines
- [ ] All functions have appropriate comments
- [ ] No console.log statements in production code
- [ ] No TODO comments without associated issues

## Documentation

- [x] README.md is complete and accurate
- [x] QUICKSTART.md provides clear getting started steps
- [x] CONTRIBUTING.md explains contribution process
- [x] DEPLOYMENT.md covers deployment options
- [x] All API endpoints are documented
- [x] Environment variables are documented

## Security

- [x] No API keys in code
- [x] `.env.local` is in `.gitignore`
- [x] `config/runtime.local.yaml` is in `.gitignore`
- [x] Sensitive files are not committed
- [ ] Dependencies have no known vulnerabilities (`npm audit`)
- [ ] HTTPS is enforced in production

## Configuration

- [x] `.env.example` exists with all required variables
- [x] `.gitignore` is comprehensive
- [x] `.dockerignore` is present
- [x] `package.json` has correct metadata
- [x] LICENSE file is present

## Testing

- [ ] Unit tests pass (if applicable)
- [ ] Integration tests pass (if applicable)
- [x] Manual testing completed
- [ ] Cross-browser testing done
- [ ] Mobile responsiveness verified

## CI/CD

- [x] GitHub Actions workflow is configured
- [ ] Build passes in CI
- [ ] Deployment pipeline is tested

## Git

- [ ] All changes are committed
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main
- [ ] No merge conflicts
- [ ] `.git` directory is not included in deployments

## Release

- [ ] Version number updated in `package.json`
- [ ] CHANGELOG.md updated (if exists)
- [ ] Release notes prepared
- [ ] Tags created for release
- [ ] GitHub release created

## Post-Release

- [ ] Deployment successful
- [ ] Application is accessible
- [ ] API endpoints respond correctly
- [ ] Error monitoring is active
- [ ] Documentation is published

## Optional Enhancements

- [ ] Add screenshots to README
- [ ] Create demo video
- [ ] Set up analytics
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Add performance monitoring
- [ ] Set up automated backups

---

## Quick Commands

```bash
# Check for security vulnerabilities
npm audit

# Fix auto-fixable vulnerabilities
npm audit fix

# Build the project
npm run build

# Run linter
npm run lint

# Check TypeScript
npx tsc --noEmit

# Test Docker build
docker build -t competitor-research-skill ./frontend

# Check for outdated dependencies
npm outdated
```

## Before Pushing to GitHub

```bash
# Ensure no sensitive data
git status
git diff

# Check .gitignore is working
git check-ignore -v frontend/.env.local
git check-ignore -v config/runtime.local.yaml

# Review all changes
git log --oneline -10

# Push to GitHub
git push origin main
```

## Notes

- Mark items as complete with `[x]`
- Add notes for any skipped items
- Update this checklist as project evolves
