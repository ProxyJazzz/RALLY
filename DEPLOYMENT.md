# RALLY — Deployment & Operations Guide

> **Deployment Manual & Infrastructure Operations**  
> **Target Environment:** Local Docker Compose & AWS ECS Fargate (`us-east-1`)

---

## 1. Local Development Quickstart

### Prerequisites
- Python 3.12+
- Node.js 20+ & npm 9+
- Docker & Docker Compose v2

### One-Command Startup
To start the FastAPI API Gateway (:8000), Streamable HTTP MCP Server (:8001), and React Command Center (:5173):

```bash
git clone https://github.com/ProxyJazzz/RALLY.git
cd RALLY
./start.sh
```

### Manual Service Boot

#### 1. Start PostgreSQL
```bash
docker compose up -d postgres
```

#### 2. Run Database Migrations
```bash
cd apps/api
source .venv/bin/activate
alembic upgrade head
cd ../..
```

#### 3. Run FastAPI Gateway
```bash
cd apps/api
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 4. Run MCP Streamable HTTP Server
```bash
python -m rally_mcp.server
# Listens on http://127.0.0.1:8001/mcp
```

#### 5. Run React Frontend
```bash
cd apps/web
npm install
npm run dev
# Accessible at http://localhost:5173
```

---

## 2. AWS Production Deployment (AWS CDK)

All cloud infrastructure is declared in TypeScript using AWS CDK (`infra/`).

### Infrastructure Stack Sequence

The deployment strictly respects cross-stack dependency chains:
1. `RallyNetworkStack`: Dedicated VPC (`10.0.0.0/16`) across 2 AZs with public and private isolated subnets (0 NAT Gateways).
2. `RallyEndpointsStack`: Private VPC Interface Endpoints for Bedrock, Secrets Manager, ECR, CloudWatch Logs, and S3 Gateway.
3. `RallyDatabaseStack`: Amazon RDS PostgreSQL 16.x instance (`db.t4g.micro`, SSL enforced) and AWS Secrets Manager credentials.
4. `RallyEcrStack`: Amazon ECR repository for `rally-api` container images.
5. `RallyComputeStack`: Public Application Load Balancer and ECS Fargate single-task service in isolated subnets.

### Deployment Steps

#### Step 1: Synthesize CloudFormation Templates
```bash
cd infra
npm install
npx cdk synth
```

#### Step 2: Deploy Infrastructure
```bash
npx cdk deploy --all --require-approval never
```

#### Step 3: Build & Push Production Container Image
```bash
# Authenticate Docker to AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 043914966140.dkr.ecr.us-east-1.amazonaws.com

# Build multi-stage production image
docker build -t rally-api:latest -f apps/api/Dockerfile.prod apps/api

# Tag and push
docker tag rally-api:latest 043914966140.dkr.ecr.us-east-1.amazonaws.com/rally-api:latest
docker push 043914966140.dkr.ecr.us-east-1.amazonaws.com/rally-api:latest
```

#### Step 4: Force ECS Service Rollout
```bash
aws ecs update-service \
  --cluster rally-production-cluster \
  --service RallyFargateService \
  --force-new-deployment \
  --region us-east-1
```

---

## 3. Production Health Probes & Monitoring

Container orchestrators route traffic using dedicated probes:

| Route | Purpose | HTTP Success |
| :--- | :--- | :--- |
| `GET /liveness` | Process health probe for ALB target group | `200 {"status":"alive"}` |
| `GET /readiness` | Dependency readiness probe (DB, MCP, Bedrock) | `200 {"status":"ready"}` |
| `GET /health` | Service version and environment metadata | `200 {"status":"ok"}` |
| `GET /health/database`| Real roundtrip DB `SELECT 1` with latency metrics | `200 {"status":"ok","latency_ms":...}` |

---

## 4. Teardown
To cleanly destroy all AWS resources created for the hackathon without orphaned assets:
```bash
cd infra
npx cdk destroy --all --force
```
