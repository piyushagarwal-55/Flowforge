# Deploy Backend to Railway

## One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/piyushagarwal-55/Flowforge&referralCode=railway)

## Manual Deployment

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Configure GitHub App access to `piyushagarwal-55/Flowforge`
5. Select the `Flowforge` repository
6. Railway will auto-detect the Node.js app in `/backend`

## Environment Variables

Add these in Railway dashboard:

```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email
SMTP_PASS=your_app_password
FROM_EMAIL=your_email
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## After Deployment

1. Copy your Railway backend URL (e.g., `https://flowforge-backend-production.up.railway.app`)
2. Update Vercel environment variable:
   - `NEXT_PUBLIC_BACKEND_URL=https://your-railway-url.up.railway.app`
3. Redeploy frontend on Vercel

## Cost Estimate

- **Free tier**: $5 credits/month
- **Expected usage**: ~$0.50-$1.00/month
- **10 free months** of runtime!
