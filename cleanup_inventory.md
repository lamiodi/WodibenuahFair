# Cleanup Inventory

## Test Files (To be deleted)
- `wodifair-app/src/test/App.test.jsx`
- `wodifair-app/src/test/Register.test.jsx`
- `wodifair-app/src/test/setup.js`
- `wodifair-backend/server.test.js`

## Documentation & Reports (To be deleted)
- `readiness-report.md`
- `deployment-checklist.md`
- `design_audit_report.md`
- `blueprint.md`

## Dev/Utility Scripts (To be deleted)
- `wodifair-backend/reset_db.js`
- `wodifair-backend/seed.js`

## Configuration Cleanup
- **wodifair-app/package.json**: Remove `vitest`, `jsdom`, `@testing-library/*`, `test` script.
- **wodifair-app/vite.config.js**: Remove `test` config block.
- **wodifair-backend/package.json**: Remove `jest`, `supertest`, `test` script.
