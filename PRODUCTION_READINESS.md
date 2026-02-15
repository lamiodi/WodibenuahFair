# Production Readiness & Runbook

## 1. Deployment Architecture
- **Frontend**: Vercel (Static/Vite)
- **Backend**: Render (Node.js Web Service)
- **Database**: PostgreSQL (Supabase/External)
- **CI/CD**: GitHub Actions (Tests & Linting) + Platform Auto-Deploy

## 2. CI/CD Pipeline
- **Trigger**: Push to `main` branch.
- **Jobs**:
  - `test-frontend`: Runs `npm run lint`, `npx vitest run`, `npm run build`.
  - `test-backend`: Runs `npm run lint`.
- **Deployment**: Automatic upon successful merge to `main` via Vercel/Render integrations.

## 3. Monitoring & Alerting (Configuration Required)
- **Uptime**: Configure **UptimeRobot** or **Better Stack** to ping:
  - Frontend: `https://wodibenuah-fair.vercel.app`
  - Backend Health: `https://wodibenuahfair.onrender.com/`
- **Error Tracking**:
  - Backend: `console.error` logs to Render Dashboard. *Recommendation: Integrate Sentry.*
  - Frontend: *Recommendation: Integrate Sentry.*

## 4. Security Measures
- **Helmet**: Enabled on backend to secure HTTP headers.
- **Rate Limiting**: Configured for API routes (100 req/15min).
- **CORS**: Restricted to production domains in `server.js`.
- **Dependencies**: `npm audit` run regularly.
- **Secrets**: Managed via Render/Vercel Dashboards (NOT in repo).

## 5. Disaster Recovery Runbook

### Incident: Deployment Failed
1. Check GitHub Actions logs for build/test failures.
2. If failed on Vercel/Render: Check platform logs.
3. **Rollback**:
   - **Vercel**: Go to Deployments -> Click "..." on previous working deployment -> "Redeploy" or "Promote to Production".
   - **Render**: Go to Dashboard -> Events -> Click "Rollback" to previous successful deploy.

### Incident: Database Connection Error
1. Verify `DATABASE_URL` in Render Environment.
2. Check Supabase status page.
3. Check backend logs for connection timeout details.

### Incident: API High Latency
1. Check Render metrics for CPU/RAM usage.
2. Scale up service instance type if hitting limits.
3. Check database query performance (add indexes if needed).

## 6. Testing Strategy
- **Unit Tests**: Run `npx vitest run` in `wodifair-app`.
- **Load Testing**: Use k6 script below.

### Load Test Script (k6)
Save as `loadtest.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '10s', target: 0 },
  ],
};

export default function () {
  let res = http.get('https://wodibenuahfair.onrender.com/');
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
```
Run with: `k6 run loadtest.js`
