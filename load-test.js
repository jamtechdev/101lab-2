/**
 * k6 Load Test for 101lab / GreenBidz
 *
 * Tests:
 *  - Website pages (static frontend)
 *  - Backend API: https://api.101recycle.greenbidz.com/api/v1/
 *
 * Run:
 *   k6 run load-test.js                         <- default 50 users
 *   k6 run --vus 200 --duration 1m load-test.js <- custom
 *   k6 run --vus 500 --duration 30s load-test.js <- stress test
 */

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Custom metrics ────────────────────────────────────────────────────────
const errorRate   = new Rate('errors');
const apiLatency  = new Trend('api_latency',  true);
const pageLatency = new Trend('page_latency', true);

// ─── Config ────────────────────────────────────────────────────────────────
const SITE_URL   = 'https://101lab.co';  // SSL cert is valid for 101lab.co
const API_BASE   = 'https://api.101recycle.greenbidz.com/api/v1';
const SITE_TYPE  = 'LabGreenbidz';
const X_SYS_KEY  = 'fa39812fec';

// ─── Test stages ───────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 50  },  // warm up: ramp to 50 users
    { duration: '1m',  target: 200 },  // load test: 200 users
    { duration: '30s', target: 500 },  // stress test: peak 500 users
    { duration: '30s', target: 0   },  // cool down
  ],
  thresholds: {
    // 95% of requests must complete within 3s
    http_req_duration: ['p(95)<3000'],
    // Less than 5% errors
    errors: ['rate<0.05'],
    // API calls should be under 2s
    api_latency: ['p(95)<2000'],
    // Page loads should be under 4s
    page_latency: ['p(95)<4000'],
  },
};

const apiHeaders = {
  'Content-Type': 'application/json',
  'x-system-key': X_SYS_KEY,
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function apiGet(path, params = {}) {
  const query = Object.keys(params).length
    ? '?' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
    : '';
  const url = `${API_BASE}${path}${query}`;
  const res = http.get(url, { headers: apiHeaders, tags: { type: 'api' } });
  apiLatency.add(res.timings.duration);
  errorRate.add(res.status >= 400);
  console.log(`API ${res.status} ${path} (${res.timings.duration}ms)`);
  return res;
}

function pageGet(path) {
  const res = http.get(`${SITE_URL}${path}`, { tags: { type: 'page' } });
  pageLatency.add(res.timings.duration);
  errorRate.add(res.status >= 400);
  console.log(`PAGE ${res.status} ${path} (${res.timings.duration}ms)`);
  return res;
}

// ─── Main test scenario ────────────────────────────────────────────────────
export default function () {

  // 1. Frontend pages
  group('Frontend Pages', () => {
    const home = pageGet('/');
    check(home, { 'homepage 200': (r) => r.status === 200 });
    sleep(1);

    const marketplace = pageGet('/marketplace');
    check(marketplace, { 'marketplace 200': (r) => r.status === 200 || r.status === 304 });
    sleep(1);
  });

  // 2. Public product/batch APIs (no auth needed)
  group('Public API - Batches', () => {
    const batches = apiGet('/batch/fetch', {
      platform: SITE_TYPE,
      page: 1,
      limit: 20,
    });
    check(batches, { 'batches list ok': (r) => r.status === 200 });
    sleep(0.5);

    // Auction groups homepage
    const groups = apiGet('/auction-group/home', {
      site_id: SITE_TYPE,
    });
    check(groups, { 'auction groups ok': (r) => r.status === 200 });
    sleep(0.5);
  });

  // 3. Simulate buyer browsing flow
  group('Buyer Browse Flow', () => {
    // Product categories
    const categories = apiGet('/product/lab/category', {
      language: 'en',
    });
    check(categories, { 'categories ok': (r) => r.status === 200 });
    sleep(0.5);

    // Batch products (public listing)
    const products = apiGet('/batch/products/all', {
      type: SITE_TYPE,
      page: 1,
      limit: 20,
    });
    check(products, { 'products list ok': (r) => r.status === 200 });
    sleep(0.5);
  });

  // 4. Health / status check — use a known good endpoint
  group('Server Health', () => {
    const health = apiGet('/batch/fetch', { platform: SITE_TYPE, page: 1, limit: 1 });
    check(health, { 'server reachable': (r) => r.status === 200 });
  });

  sleep(1);
}

// ─── Summary output ────────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    'load-test-result.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const reqs   = data.metrics.http_reqs?.values?.count ?? 0;
  const fails  = data.metrics.http_req_failed?.values?.rate ?? 0;
  const p95    = data.metrics.http_req_duration?.values?.['p(95)'] ?? 0;
  const rps    = data.metrics.http_reqs?.values?.rate ?? 0;

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  101lab Load Test — Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total requests : ${reqs}
  Requests/sec   : ${rps.toFixed(1)}
  Error rate     : ${(fails * 100).toFixed(2)}%
  p95 response   : ${p95.toFixed(0)}ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ PASS if:
     - p95 < 3000ms
     - error rate < 5%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
