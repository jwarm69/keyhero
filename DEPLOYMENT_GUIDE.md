# KeyHero Deployment Guide

## 🚀 Quick Start - Deploy in 10 Minutes

Your game is ready to deploy! Follow these steps to get it live online for **FREE**.

---

## ✅ Prerequisites

- GitHub account
- Git installed locally
- Your code pushed to GitHub

---

## 📦 Step 1: Push to GitHub (If Not Already)

```bash
cd /Users/jackwarman/keyhero

# Initialize git if needed
git init
git add .
git commit -m "Initial commit - KeyHero rhythm game"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/keyhero.git
git branch -M main
git push -u origin main
```

---

## 🔧 Step 2: Deploy Backend to Render (5 minutes)

### 2.1 Create Render Account
1. Go to **https://render.com**
2. Click "Get Started" 
3. Sign up with GitHub

### 2.2 Deploy Backend
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `keyhero-backend` (or any name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### 2.3 Add Environment Variables
In Render dashboard, add these environment variables:

| Key | Value |
|-----|-------|
| `PORT` | `3000` |
| `DATABASE_PATH` | `/opt/render/project/data/leaderboard.db` |
| `CORS_ORIGIN` | `*` (we'll update this after frontend deploy) |

### 2.4 Deploy!
- Click **"Create Web Service"**
- Wait 2-3 minutes for deployment
- **IMPORTANT**: Copy your backend URL (e.g., `https://keyhero-backend.onrender.com`)

### 2.5 Test Backend
Visit: `https://YOUR_BACKEND_URL.onrender.com/api/health`

Should see: `{"status":"ok","timestamp":"..."}`

---

## 🌐 Step 3: Deploy Frontend to Vercel (5 minutes)

### 3.1 Create Vercel Account
1. Go to **https://vercel.com**
2. Sign up with GitHub

### 3.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your `keyhero` repository
3. Configure:
   - **Framework Preset**: `Vite` (should auto-detect)
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.3 Add Environment Variable
**CRITICAL STEP:**

Click "Environment Variables" and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your Render backend URL from Step 2.4 |

Example: `https://keyhero-backend.onrender.com`

### 3.4 Deploy!
- Click **"Deploy"**
- Wait 2-3 minutes
- You'll get a live URL like: `https://keyhero.vercel.app`

### 3.5 Update Backend CORS
**IMPORTANT**: Go back to Render dashboard

1. Go to your backend service
2. Environment → Edit `CORS_ORIGIN`
3. Change from `*` to your Vercel URL: `https://keyhero.vercel.app`
4. Save changes (backend will redeploy)

---

## 🎮 Step 4: Test Your Live Game!

1. Visit your Vercel URL: `https://YOUR_APP.vercel.app`
2. Click "Start Game"
3. Select a song
4. Choose difficulty
5. Play the game!
6. Check if score submission works (backend connectivity)

---

## 🎯 Expected Results

✅ **Frontend (Vercel)**:
- Live at: `https://YOUR_APP.vercel.app`
- Loads instantly
- Smooth gameplay
- Sound works

✅ **Backend (Render)**:
- API at: `https://YOUR_BACKEND.onrender.com`
- Health check responds
- Accepts score submissions
- Returns leaderboards

---

## 🐛 Troubleshooting

### Frontend loads but can't connect to backend

**Check 1**: Browser console (F12)
- Look for CORS errors
- Check if API URL is correct

**Fix**: 
```bash
# Verify VITE_API_URL in Vercel dashboard
# Should be: https://YOUR_BACKEND.onrender.com
# NOT: http://localhost:3000
```

### Backend shows "Service Unavailable"

**Reason**: Render free tier spins down after inactivity

**Fix**: Just wait 30 seconds, it will wake up

### CORS Error in Console

**Fix**: 
1. Go to Render dashboard
2. Check `CORS_ORIGIN` matches your Vercel URL **exactly**
3. Include `https://` prefix
4. No trailing slash

### Game doesn't load at all

**Check**:
1. Vercel build logs for errors
2. Make sure `npm run build` works locally
3. Check browser console for errors

---

## 💰 Cost Breakdown

**Total Cost: $0/month** 🎉

- **Vercel Free Tier**: 
  - Unlimited bandwidth
  - 100 deployments/day
  - Automatic SSL

- **Render Free Tier**:
  - 750 hours/month
  - 512MB RAM
  - Spins down after 15min inactivity
  - Wakes up in ~30 seconds

---

## 🔄 Updating Your Deployment

### Update Frontend:
```bash
git add .
git commit -m "Update game"
git push
# Vercel auto-deploys!
```

### Update Backend:
```bash
git add .
git commit -m "Update API"
git push
# Render auto-deploys!
```

Both platforms automatically redeploy when you push to GitHub!

---

## 🎨 Optional: Custom Domain

### Vercel (Free):
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Render (Paid - $7/month):
1. Render Dashboard → Your Service → Settings → Custom Domain
2. Add domain
3. Update DNS records

---

## 📊 Monitoring

### Vercel Analytics:
- Project → Analytics
- See visitor count, performance

### Render Logs:
- Service → Logs
- See API requests, errors

---

## 🚨 Important Notes

1. **Free Tier Limitations**:
   - Render backend sleeps after 15 minutes of inactivity
   - First request after sleep takes ~30 seconds
   - This is normal for free tier!

2. **Environment Variables**:
   - Always use `VITE_` prefix for frontend env vars
   - Restart/redeploy after changing env vars

3. **Database**:
   - SQLite file persists on Render free tier
   - Backed up daily automatically
   - Limited to 512MB total storage

4. **CORS**:
   - Must match frontend URL exactly
   - Include protocol (`https://`)
   - No trailing slash

---

## 🎉 You're Live!

Share your game:
- **Your URL**: `https://YOUR_APP.vercel.app`
- **Share on social media**
- **Add to your portfolio**
- **Show friends!**

---

## 🆘 Need Help?

If something doesn't work:

1. Check browser console (F12) for errors
2. Check Vercel build logs
3. Check Render service logs
4. Verify environment variables
5. Test backend directly: `/api/health`

---

## ✨ Next Steps

Want to enhance your deployment?

1. **Add Analytics**: Vercel Analytics (free)
2. **Custom Domain**: Buy domain, connect to Vercel
3. **Monitoring**: Set up Render alerts
4. **Performance**: Add caching headers
5. **SEO**: Add meta tags for sharing

Enjoy your live rhythm game! 🎸🎵


