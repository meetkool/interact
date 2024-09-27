## Documentation 

1. API Development

So in we are using Flask as a api development framework.
i am using flask_limiter, flask, flasgger for api development.
where flask_limiter is used for rate limiting and flasgger is used for swagger documentation.

Swagger link http://localhost/apidocs/

GET /: Returns a "Hello, World!" message
```
curl http://localhost
```
GET /health: Returns the current status of the AP

```
curl http://localhost/health
```


2. Docker setup instructions 
For Docker setup we are using dockerfile for the api vconcainter build and docker-compose.yml for the api container and reverse proxy container "nginx".

We use two main Docker configuration files for our setup:

a) Dockerfile:
   - Used for building the API container

b) docker-compose.yml:
   - Orchestrates multiple containers together
   - Easily manage the relationship between the API and Nginx

for api build 
```
    build:
      context: .
      dockerfile: Dockerfile
      args:
        BUILD_VERSION: ${BUILD_VERSION:-latest}
    image: api:${BUILD_VERSION:-latest}
```
for proxy build 
```
  nginx:
    image: nginx:latest
```
---

3.  Rate limiting configuration and explanation
the rate limit configuration is set in the flask_limiter modul file a basic limit of 100 requests per minute is set.

```
limiter = Limiter(
      get_remote_address,app=app,default_limits=["100 per minute"]
)
```

i used flask_limiter becouse it is easy to use and it is easy to implement.
---
4. Nginx Configuration Explanation

The following Nginx configuration sets up a reverse proxy for our API:


server {
    listen        80;
    server_name   localhost;
    
    access_log    /var/log/nginx.access_log  main;
    
    location / {
        proxy_pass         http://api:5000;
        proxy_redirect     off;
        
        proxy_set_header   Host             $host;
        proxy_set_header   X-Real-IP        $remote_addr;
        proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}


This configuration does the following:

- `listen 80;`: nginx listing to 80 
- `server_name localhost;`: This server block applies to requests for 'localhost'.
- `access_log /var/log/nginx.access_log main;`: Logs access information to the specified file.

The `location /` block handles all requests:

- `proxy_pass http://api:5000;`: Forwards requests to our API container on port 5000.
- `proxy_redirect off;`: Prevents Nginx from modifying the Location and Refresh headers from the proxied server.

problems i encounter 
the nginx server is not working properly running cus this paths where not set in the nginx.conf file.
    client_body_temp_path /tmp/client_temp;
    proxy_temp_path       /tmp/proxy_temp_path;
    fastcgi_temp_path     /tmp/fastcgi_temp;
    uwsgi_temp_path       /tmp/uwsgi_temp;
    scgi_temp_path        /tmp/scgi_temp;

Setting these paths is crucial because:

1. It ensures Nginx has a designated place to store temporary files and  permission issues.
2. It allows you to control where these temporary files are stored, which can be important for security and performance reasons.
---
6. Load test results and analysis
In this project, I used k6 for load testing. Here's an explanation of the k6 script:
```
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

```

1. The test runs in stages, gradually increasing the number of virtual users from 20 to 100 and then back to 0.
2. The test checks for HTTP request failures and response times.
3. The test logs the rate limit effectiveness.

