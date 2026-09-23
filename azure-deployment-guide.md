# Genquantaa Pharmacy - Azure Free Tier Deployment Guide

This guide provides step-by-step instructions on how to deploy the Genquantaa Pharmacy POS System (MERN stack) entirely for **FREE** using Microsoft Azure services and MongoDB Atlas.

## Architecture Overview
- **Database:** MongoDB Atlas (M0 Free Cluster)
- **Backend (Node.js API):** Azure App Service (F1 Free Tier)
- **Frontend (Vite/React):** Azure Static Web Apps (Free Plan)

---

## Step 1: Set up the Database (MongoDB Atlas)

While Azure offers Cosmos DB, **MongoDB Atlas** provides a far more generous and reliable "Free Forever" tier that natively supports MERN apps.

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Click **Build a Database** and select the **M0 FREE** cluster.
3. Choose **Azure** as your cloud provider and select a region closest to you. Click **Create**.
4. **Security Setup:**
   - Create a Database User (e.g., username: `admin`, password: `your_password`). **Save this password!**
   - Under **Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`). *(Note: Azure server IPs change dynamically, so this is required for the free tier).*
5. **Get the Connection String:**
   - Click **Connect** -> **Connect your application**.
   - Copy the connection string. It will look like this:
     `mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<password>` with the password you created in step 4. Add `genquantaa_pharmacy` before the `?` to specify the database name:
     `mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/genquantaa_pharmacy?retryWrites=true&w=majority`

---

## Step 2: Prepare the Backend for Azure

Azure App Service requires a specific startup configuration for Node.js apps.

1. Open your `backend/package.json`. Ensure the `scripts` section has a `start` command that runs the compiled code:
   ```json
   "scripts": {
     "start": "node dist/index.js",
     "build": "tsc",
     "dev": "nodemon src/index.ts"
   }
   ```
2. Make sure your GitHub repository (`Pharma_project`) is completely up to date with your latest local code.

---

## Step 3: Deploy Backend to Azure App Service (Free Tier)

1. Sign in to the [Azure Portal](https://portal.azure.com/).
2. In the search bar, search for **App Services** and click on it.
3. Click **+ Create** -> **Web App**.
4. **Basics Tab:**
   - **Subscription:** Azure subscription 1 (or Free Trial).
   - **Resource Group:** Click *Create new*, name it `Genquantaa-RG`.
   - **Name:** Choose a unique name (e.g., `genquantaa-api`). This will be your URL: `genquantaa-api.azurewebsites.net`.
   - **Publish:** Select **Code**.
   - **Runtime stack:** Select **Node 18 LTS** (or Node 20 LTS).
   - **Operating System:** Select **Linux**.
   - **Region:** Choose the same region as your MongoDB cluster.
   - **Pricing Plan:** Click *Explore pricing plans*, and select **Free F1** (Shared infrastructure, 60 minutes/day compute). Click *Select*.
5. **Deployment Tab:**
   - Enable **Continuous Deployment**.
   - Link your GitHub account.
   - Select your Organization, Repository (`Pharma_project`), and Branch (`main`).
6. Click **Review + Create**, then click **Create**. Azure will now provision the server.

### Add Backend Environment Variables

1. Once the deployment is complete, click **Go to resource**.
2. On the left sidebar, scroll down to **Settings** and click **Environment variables** (or **Configuration** in older Azure UI).
3. Add the following **App settings** (click *+ Add* for each):
   - `PORT` : `8080` *(Azure Linux containers default to 8080)*
   - `MONGO_URI` : *(Paste your MongoDB Atlas connection string from Step 1)*
   - `JWT_SECRET` : `any_random_long_secure_string_here`
   - `JWT_EXPIRES_IN` : `8h`
   - `NODE_ENV` : `production`
4. Click **Save** at the top. Azure will restart your backend.
5. **Test Backend:** Open your browser and go to `https://<your-app-name>.azurewebsites.net/api/reports/dashboard-stats` (or any public route) to verify it is running.

---

## Step 4: Prepare the Frontend for Azure

1. Open your frontend `.env` file (or `frontend/.env.production`).
2. Update the API URL to point to your new Azure backend:
   ```env
   VITE_API_URL=https://<your-backend-app-name>.azurewebsites.net/api
   ```
   *(Ensure you commit and push this change to GitHub).*

---

## Step 5: Deploy Frontend to Azure Static Web Apps (Free Tier)

Azure Static Web Apps is completely free for frontend frameworks like React/Vite and includes free SSL.

1. In the [Azure Portal](https://portal.azure.com/), search for **Static Web Apps** and click it.
2. Click **+ Create**.
3. **Basics Tab:**
   - **Resource Group:** Select the `Genquantaa-RG` you created earlier.
   - **Name:** Choose a name (e.g., `genquantaa-frontend`).
   - **Plan type:** Select **Free** (For hobby/personal projects).
   - **Region:** Choose a region close to you.
   - **Source:** Select **GitHub**.
4. **GitHub Details:**
   - Sign in to GitHub and select the `Pharma_project` repository and `main` branch.
5. **Build Details:**
   - **Build Presets:** Select **React**.
   - **App location:** `/frontend` *(This tells Azure where your React code lives inside the repo).*
   - **Api location:** Leave blank.
   - **Output location:** `dist` *(This is the folder Vite creates when it builds).*
6. Click **Review + Create**, then **Create**.

Azure will automatically create a GitHub Action in your repository. This action will build your Vite app and deploy it.

### Fix Frontend Routing (Vite SPA Fallback)
Because Vite creates a Single Page Application (SPA), if a user refreshes the page on `/invoices`, Azure will throw a 404 error. You must tell Azure to route all traffic to `index.html`.

1. In your local code, go to the `frontend/public` folder.
2. Create a new file named `staticwebapp.config.json`.
3. Add the following code:
   ```json
   {
     "navigationFallback": {
       "rewrite": "/index.html"
     }
   }
   ```
4. Commit and push this file to GitHub. Azure will automatically redeploy the frontend with the fix!

---

## 🎉 Deployment Complete!

- Your **Frontend** is live at the auto-generated Azure Static Web Apps URL (e.g., `https://purple-sky-12345.azurestaticapps.net`).
- Your **Backend** is live on Azure App Service.
- Your **Database** is safely hosted on MongoDB Atlas.

Every time you push new code to your `main` branch on GitHub, Azure will automatically detect the changes and rebuild both your frontend and backend.
