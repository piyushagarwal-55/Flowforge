# Archestra Local Setup Guide

## Overview

This guide shows you how to set up a local Archestra instance and deploy Orchestrix workflows to it.

---

## Prerequisites

- Docker installed and running
- Orchestrix backend and frontend running
- At least 4GB RAM available for Archestra

---

## Step 1: Start Local Archestra Instance

### Quick Start (Docker)

Run Archestra locally using Docker:

```bash
docker pull archestra/platform:latest

docker run -p 9000:9000 -p 3000:3000 \
  -e ARCHESTRA_QUICKSTART=true \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v archestra-postgres-data:/var/lib/postgresql/data \
  -v archestra-app-data:/app/data \
  archestra/platform
```

**Windows (PowerShell):**
```powershell
docker pull archestra/platform:latest

docker run -p 9000:9000 -p 3000:3000 `
  -e ARCHESTRA_QUICKSTART=true `
  -v /var/run/docker.sock:/var/run/docker.sock `
  -v archestra-postgres-data:/var/lib/postgresql/data `
  -v archestra-app-data:/app/data `
  archestra/platform
```

### What This Does

- **Port 3000**: Archestra Admin UI
- **Port 9000**: Archestra API
- **ARCHESTRA_QUICKSTART**: Enables quick-start mode with auto-configuration
- **Volumes**: Persists data across container restarts

### Verify Archestra is Running

Wait for the startup message:
```
Welcome to Archestra! <3
> Frontend: http://localhost:3000
> Backend:  http://localhost:9000
```

Then visit:
- Admin UI: http://localhost:3000
- API Health: http://localhost:9000/health

---

## Step 2: Create Archestra API Key

### Via Admin UI

1. Open http://localhost:3000
2. Login with default credentials:
   - Email: `admin@localhost.ai`
   - Password: `password`
3. Navigate to **Settings → API Keys**
4. Click **Create API Key**
5. Give it a name: "Orchestrix Integration"
6. Copy the generated API key (starts with `archestra_`)

### Via API (Alternative)

```bash
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@localhost.ai","password":"password"}'

# Use the returned token to create an API key
curl -X POST http://localhost:9000/api/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"name":"Orchestrix Integration"}'
```

---

## Step 3: Configure Orchestrix

### Update Backend Environment

Edit `backend-core/.env`:

```env
# Archestra Configuration
ARCHESTRA_ENDPOINT=http://localhost:9000
ARCHESTRA_API_KEY=archestra_oStLwETyecseLkiKrjDppTQFibKiKvWaeukVxJPZUzFbHIASSgFsqzqimouGeJVJ
ARCHESTRA_DEPLOYMENT_ENDPOINT=http://localhost:9000/api/agents
```

Replace `archestra_oStLwETyecseLkiKrjDppTQFibKiKvWaeukVxJPZUzFbHIASSgFsqzqimouGeJVJ` with your actual API key.

### Restart Orchestrix Backend

```bash
cd backend-core
npm run dev
```

---

## Step 4: Deploy Your First Workflow

### 1. Create a Workflow in Orchestrix

1. Open Orchestrix UI: http://localhost:5000
2. Type: "create a sign up api with JWT"
3. Wait for AI to generate the workflow
4. Click "Start Runtime"
5. Test with "Run" button

### 2. Deploy to Archestra

1. Click **"Deploy to Archestra"** button (purple)
2. Wait for deployment (2-3 seconds)
3. Success modal shows:
   - Agent ID
   - Public endpoint
   - Dashboard URL

### 3. Verify in Archestra

1. Open Archestra UI: http://localhost:3000
2. Navigate to **Agents**
3. You should see your deployed agent
4. Click on it to view details

---

## Step 5: Test the Deployed Agent

### Via curl

```bash
curl -X POST http://localhost:9000/api/agents/<agent-id>/invoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-api-key>" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "name": "Test User"
  }'
```

### Via Archestra UI

1. Open the agent in Archestra UI
2. Go to **Test** tab
3. Enter test input
4. Click **Invoke**
5. See the response

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR LOCAL MACHINE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   Orchestrix     │         │   Archestra      │         │
│  │   (Port 5000)    │         │   (Port 3000)    │         │
│  │                  │         │                  │         │
│  │  - UI            │         │  - Admin UI      │         │
│  │  - Workflow      │         │  - Agent Mgmt    │         │
│  │    Builder       │         │  - Monitoring    │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                    │
│           │                            │                    │
│  ┌────────▼─────────┐         ┌───────▼──────────┐         │
│  │   Orchestrix     │  Deploy │   Archestra      │         │
│  │   Backend        ├────────►│   API            │         │
│  │   (Port 4000)    │         │   (Port 9000)    │         │
│  │                  │         │                  │         │
│  │  - AI Generation │         │  - MCP Runtime   │         │
│  │  - SupervisorAgent│        │  - Tool Execution│         │
│  │  - BuilderAgent  │         │  - Observability │         │
│  └──────────────────┘         └──────────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### What Happens During Deployment

1. **Orchestrix Backend** transforms MCP server into Archestra agent format
2. **POST** to `http://localhost:9000/api/agents`
3. **Archestra** creates agent with MCP runtime
4. **Archestra** returns agent ID and endpoint
5. **Orchestrix** saves deployment info to MongoDB
6. **User** can now invoke agent via Archestra API

---

## Troubleshooting

### Archestra Container Won't Start

**Error**: Port already in use

**Solution**: Stop conflicting services or change ports:
```bash
docker run -p 9001:9000 -p 3001:3000 ...
```

Then update Orchestrix `.env`:
```env
ARCHESTRA_ENDPOINT=http://localhost:9001
ARCHESTRA_DEPLOYMENT_ENDPOINT=http://localhost:9001/api/agents
```

### Deployment Fails with "Unauthorized"

**Error**: 401 Unauthorized

**Solution**: Verify API key is correct:
1. Check `.env` file has correct API key
2. Restart Orchestrix backend
3. Try deployment again

### Deployment Fails with "Connection Refused"

**Error**: ECONNREFUSED

**Solution**: Ensure Archestra is running:
```bash
docker ps | grep archestra
```

If not running, start it:
```bash
docker start <container-id>
```

### Agent Not Appearing in Archestra UI

**Solution**: 
1. Refresh the Agents page
2. Check Archestra logs:
   ```bash
   docker logs <container-id>
   ```
3. Verify deployment succeeded in Orchestrix logs

---

## Production Deployment

For production, use Helm instead of Docker:

```bash
helm upgrade archestra-platform \
  oci://europe-west1-docker.pkg.dev/friendly-path-465518-r6/archestra-public/helm-charts/archestra-platform \
  --install \
  --namespace archestra \
  --create-namespace \
  --set postgresql.external_database_url=postgresql://user:pass@host:5432/db \
  --wait
```

Then update Orchestrix `.env` with production URL:
```env
ARCHESTRA_ENDPOINT=https://api.archestra.yourcompany.com
ARCHESTRA_DEPLOYMENT_ENDPOINT=https://api.archestra.yourcompany.com/api/agents
```

---

## Next Steps

1. ✅ Deploy more workflows to Archestra
2. ✅ Monitor agent execution in Archestra UI
3. ✅ Set up authentication for production
4. ✅ Configure external PostgreSQL for persistence
5. ✅ Enable observability with OpenTelemetry

---

## Resources

- Archestra Documentation: https://docs.archestra.ai
- Archestra GitHub: https://github.com/archestra-ai/archestra
- Archestra Slack: https://archestra.ai/join-slack
- Orchestrix Documentation: See `ARCHESTRA-DEPLOYMENT-GUIDE.md`
