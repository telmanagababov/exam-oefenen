# Deployment Guide

This guide will help you deploy the Exam Oefenen application to production using free hosting services.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Docker Setup](#docker-setup)
- [Deployment Options](#deployment-options)
  - [Option A: Render (Recommended)](#option-a-render-recommended)
  - [Option B: Railway](#option-b-railway)
  - [Option C: Fly.io](#option-c-flyio)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

1. **Git Repository**: Your code pushed to GitHub/GitLab/Bitbucket
2. **Gemini API Key**: Get one at [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Docker** (optional, for local testing): [Install Docker](https://docs.docker.com/get-docker/)

---

## Docker Setup

### Test Locally with Docker

1. **Build the Docker image:**

```bash
npm run docker:build
```

2. **Run the container:**

```bash
npm run docker:run
```

3. **Access the app:**

Open `http://localhost:3000` in your browser.

4. **Stop the container:**

```bash
docker ps  # Find the container ID
docker stop <container-id>
```

---

## Deployment Options

### Option A: Render (Recommended)

**Best for beginners** - Simple setup, generous free tier, automatic SSL.

#### Step-by-Step Deployment:

1. **Sign up for Render:**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub (recommended for easier setup)

2. **Create a New Web Service:**
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Render will detect the `render.yaml` file automatically

3. **Configure Environment Variables:**
   - In the Render dashboard, go to your service
   - Navigate to **Environment** tab
   - Add the following variables:
     - `GEMINI_API_KEY`: Your API key from Google AI Studio
     - `GEMINI_MODEL`: `gemini-2.5-flash` (or your preferred model)
   - Click **"Save Changes"**

4. **Deploy:**
   - Render will automatically build and deploy your app
   - Wait for the build to complete (5-10 minutes first time)
   - Your app will be available at `https://your-app-name.onrender.com`

#### Render Configuration:

- **Auto-deploys**: Enabled by default on main branch pushes
- **Free tier**: 750 hours/month, spins down after 15 minutes of inactivity
- **Cold start**: ~30 seconds on first request after sleep
- **Logs**: Available in the Render dashboard

#### Custom Domain (Optional):

1. Go to **Settings** → **Custom Domain**
2. Add your domain and configure DNS records

---

### Option B: Railway

**Best for**: No cold starts, better performance, but limited free tier ($5/month credit).

#### Step-by-Step Deployment:

1. **Sign up for Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create a New Project:**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your repository

3. **Configure Settings:**
   - Railway will detect the `railway.yaml` file
   - Or manually select **Dockerfile** as the build method

4. **Add Environment Variables:**
   - In the project dashboard, click **"Variables"**
   - Add:
     - `GEMINI_API_KEY`: Your API key
     - `GEMINI_MODEL`: `gemini-2.5-flash`
   - Deploy will trigger automatically

5. **Generate Domain:**
   - Go to **Settings** → **Networking**
   - Click **"Generate Domain"**
   - Your app will be available at the generated URL

#### Railway Notes:

- **Free tier**: $5 credit/month (enough for small apps)
- **No cold starts**: Service always running
- **Auto-deploys**: Enabled by default
- **Pricing**: ~$0.20/day for basic usage

---

### Option C: Fly.io

**Best for**: Global edge deployment, advanced users.

#### Step-by-Step Deployment:

1. **Install Fly CLI:**

```bash
# macOS
brew install flyctl

# Linux/WSL
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

2. **Sign up and login:**

```bash
fly auth signup
# or if you already have an account
fly auth login
```

3. **Launch your app:**

```bash
# From your project root
fly launch

# Follow the prompts:
# - Choose app name (or use auto-generated)
# - Select region (choose closest to your users)
# - Don't setup Postgres or Redis
# - Deploy now? → No (we need to set secrets first)
```

4. **Set secrets:**

```bash
fly secrets set GEMINI_API_KEY=your_api_key_here
fly secrets set GEMINI_MODEL=gemini-2.5-flash
```

5. **Deploy:**

```bash
fly deploy
```

6. **Open your app:**

```bash
fly open
```

#### Fly.io Notes:

- **Free tier**: 3 shared VMs, 160GB bandwidth/month
- **Global deployment**: Can deploy to multiple regions
- **CLI-based**: More control, steeper learning curve
- **Custom domains**: `fly certs add your-domain.com`

---

## Post-Deployment Configuration

### 1. Test Your Deployment

After deployment, verify everything works:

1. **Health Check:**
   - Visit `https://your-app-url.com/health`
   - Should return: `{"status":"ok"}`

2. **Test the App:**
   - Visit `https://your-app-url.com`
   - Navigate to exam selection
   - Try generating an exam
   - Verify API key configuration works

### 2. Monitor Your App

**Render:**
- Dashboard → Logs (real-time logs)
- Dashboard → Metrics (CPU, memory, requests)

**Railway:**
- Project → Metrics
- Project → Deployments → View Logs

**Fly.io:**
```bash
fly logs          # View logs
fly status        # Check app status
fly monitoring    # Open monitoring dashboard
```

### 3. Set Up Alerts (Optional)

Configure alerts for:
- Service downtime
- Error rate spikes
- Resource limits

Each platform has built-in alerting in their dashboards.

---

## Troubleshooting

### Build Failures

**Error: "npm ci failed"**
- Ensure `package-lock.json` files are committed to git
- Check Node version compatibility (requires Node 18+)

**Error: "Angular build failed"**
- Check for TypeScript errors: `cd client && npm run build`
- Verify all dependencies are installed

### Runtime Issues

**App won't start:**
1. Check environment variables are set correctly
2. View logs for error messages
3. Verify `PORT` environment variable is not hardcoded

**API calls failing:**
1. Check `GEMINI_API_KEY` is set in environment variables
2. Verify CORS settings if using custom domain
3. Check API key has proper permissions

**Slow cold starts (Render):**
- Expected behavior on free tier
- Upgrade to paid tier for always-on service
- Or use Railway/Fly.io which don't have cold starts

### Docker Issues

**Local Docker build fails:**
```bash
# Clear Docker cache
docker builder prune -a

# Rebuild without cache
docker build --no-cache -t exam-oefenen .
```

**Container runs but app not accessible:**
```bash
# Check if container is running
docker ps

# Check logs
docker logs <container-id>

# Verify port mapping
docker run -p 3000:3000 exam-oefenen
```

---

## Continuous Deployment

All platforms support automatic deployments:

1. **Enable auto-deploy** (enabled by default on Render/Railway)
2. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. Platform automatically builds and deploys your changes

---

## Cost Estimates

### Free Tier Limits:

| Platform | Free Tier | Cold Starts | Best For |
|----------|-----------|-------------|----------|
| **Render** | 750 hrs/month | Yes (~30s) | Beginners, low traffic |
| **Railway** | $5 credit/month | No | Medium traffic, better UX |
| **Fly.io** | 3 VMs, 160GB | Optional | Advanced users, global apps |

### When to Upgrade:

- Render: If you need always-on service (no cold starts)
- Railway: If you exceed $5/month usage
- Fly.io: If you need more resources or regions

---

## Security Best Practices

1. **Never commit API keys:**
   - Keep `.env` in `.gitignore`
   - Use platform environment variables

2. **Use HTTPS:**
   - All platforms provide free SSL certificates
   - Enforce HTTPS in production

3. **Rate limiting (future):**
   - Consider adding rate limiting middleware
   - Prevent API abuse

4. **Monitor usage:**
   - Track API key usage in Google AI Studio
   - Set up billing alerts

---

## Need Help?

- **Render Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app
- **Fly.io Docs**: https://fly.io/docs
- **Docker Docs**: https://docs.docker.com

---

## Next Steps

After successful deployment:

1. ✅ Share your app URL with users
2. ✅ Set up custom domain (optional)
3. ✅ Monitor performance and errors
4. ✅ Configure analytics (optional)
5. ✅ Set up automated backups if needed

**Your app is now live! 🎉**
