import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  
    { duration: '1m', target: 20 },   
    { duration: '30s', target: 50 },  
    { duration: '1m', target: 50 },   
    { duration: '30s', target: 100 }, 
    { duration: '1m', target: 100 },  
    { duration: '30s', target: 0 },   
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   
    http_req_duration: ['p(95)<500'], 
  },
};

export default function () {
  
  let res = http.get('http://localhost/');
  check(res, { 
    'status was 200': (r) => r.status == 200,
    'rate limit not exceeded': (r) => r.status != 429
  });
  

  res = http.get('http://localhost/health');
  check(res, { 
    'status was 200': (r) => r.status == 200,
    'rate limit not exceeded': (r) => r.status != 429
  });

  sleep(1);
}

export function setup() {
  console.log('Setting up load test...');
}

export function teardown(data) {
  console.log('Tearing down load test...');
  console.log('Rate limit effectiveness:', data.rate_limit_effectiveness);
}

let rate_limit_effectiveness = new Rate('rate_limit_effectiveness');


export function handleSummary(data) {
  rate_limit_effectiveness.add(data.metrics.http_reqs.values.rate > 100);
  return {
    rate_limit_effectiveness: rate_limit_effectiveness.rate,
  };
}