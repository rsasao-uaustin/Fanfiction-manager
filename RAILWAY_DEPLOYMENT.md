# Railway Deployment Guide for fimanage.com

## ✅ Files Prepared

Your app has been prepared for Railway deployment with the following changes:

1. ✅ **Procfile** - Created (tells Railway how to run your app)
2. ✅ **runtime.txt** - Created (specifies Python version)
3. ✅ **requirements.txt** - Updated (added `gunicorn` and `openai`)
4. ✅ **backend/app.py** - Updated (production-ready server configuration)
5. ✅ **frontend/app.js** - Updated (dynamic API URL for production)
6. ✅ **CORS settings** - Updated (allows fimanage.com domain)

## 🚀 Deployment Steps

### Step 1: Commit and Push to GitHub

```bash
cd fanfiction-manager
git add .
git commit -m "Prepare app for Railway deployment"
git push origin main
```

(Or `git push origin master` if your branch is `master`)

### Step 2: Create Railway Account & Project

1. Go to https://railway.app
2. Sign up/login (you can use GitHub to sign in)
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Authorize Railway to access your GitHub account
6. Select your `fanfiction-manager` repository
7. Railway will automatically detect it's a Python app

### Step 3: Configure Railway Settings

1. In your Railway project dashboard, click on your service
2. Go to **"Settings"** tab
3. Set **Root Directory** to `fanfiction-manager` (if not already set)
4. Railway will automatically:
   - Detect the `Procfile`
   - Install dependencies from `requirements.txt`
   - Use Python version from `runtime.txt`

### Step 4: Add Environment Variables (Optional)

If you use OpenAI API, add it as an environment variable:

1. In Railway project → **"Variables"** tab
2. Click **"New Variable"**
3. Name: `OPENAI_API_KEY`
4. Value: Your OpenAI API key
5. Click **"Add"**

### Step 5: Add Custom Domain

1. In Railway project → **"Settings"** → **"Domains"** section
2. Click **"Add Domain"**
3. Enter: `fimanage.com`
4. Railway will provide you with DNS records (CNAME or A record)

### Step 6: Configure DNS on GoDaddy

1. Log in to your GoDaddy account
2. Go to **"My Products"** → Find `fimanage.com` → Click **"DNS"**
3. Add the DNS record Railway provided:

   **If Railway gives you a CNAME:**
   - Type: `CNAME`
   - Name: `@` (or leave blank for root domain)
   - Value: `[railway-provided-domain].railway.app`
   - TTL: `600` (or default)

   **If GoDaddy doesn't allow CNAME on root (@), use A record:**
   - Type: `A`
   - Name: `@`
   - Value: `[IP address Railway provides]`
   - TTL: `600`

   **For www subdomain (optional):**
   - Type: `CNAME`
   - Name: `www`
   - Value: `[railway-provided-domain].railway.app`
   - TTL: `600`

4. Save the DNS records

### Step 7: Wait for DNS Propagation

- DNS changes can take 5 minutes to 48 hours to propagate
- Check status at: https://www.whatsmydns.net/#A/fimanage.com
- Railway will automatically provision SSL/HTTPS once DNS is configured

### Step 8: Verify Deployment

1. Once DNS propagates, visit: `https://fimanage.com`
2. Your app should be live!
3. Railway automatically provides HTTPS/SSL certificates

## 🔧 Troubleshooting

### App won't start
- Check Railway logs: Project → **"Deployments"** → Click on deployment → **"View Logs"**
- Ensure `gunicorn` is in `requirements.txt` ✅ (already added)
- Verify `Procfile` exists ✅ (already created)

### DNS not working
- Wait longer (can take up to 48 hours)
- Verify DNS records are correct in GoDaddy
- Check Railway domain settings show "Active"

### CORS errors
- Verify CORS settings in `backend/app.py` include your domain ✅ (already configured)
- Check browser console for specific error messages

### API calls failing
- Verify `frontend/app.js` uses dynamic API URL ✅ (already updated)
- Check Railway logs for backend errors

## 📝 Important Notes

1. **Data Storage**: Your `data/*.json` files are in `.gitignore`, so they won't be deployed. For production, consider:
   - Using a database (PostgreSQL, MongoDB)
   - Railway volumes for persistent storage
   - Cloud storage (S3, etc.)

2. **Environment Variables**: Sensitive data (API keys) should be in Railway environment variables, not in code.

3. **Local Development**: Your app still works locally! The changes are backward compatible.

4. **HTTPS**: Railway automatically provides SSL certificates. Your app will be accessible at `https://fimanage.com`.

## 🎉 Success!

Once deployed, your fanfiction manager will be live at:
- **https://fimanage.com**
- **https://www.fimanage.com** (if configured)

Happy deploying! 🚀
