# 🌟 DoDoo Daily

**English** | [**简体中文**](./README_zh-CN.md)

DoDoo Daily is a lightweight, full-stack, pure Node.js family application system designed specifically for parents and children.

---

## 🚀 Quick Start (Local Development)

**1. Install dependencies**

```bash
npm install
```

**2. Initialize the database and seed data**  
Run the complete initialization script (which automatically creates tables and injects the default account):

```bash
npm run db:setup
```

> After initialization, the system will generate a default **Parent** account with the default PIN `1234`. The first login will automatically trigger the setup wizard!

**3. Start the local server**

```bash
npm run dev
```

Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🐳 NAS/Docker Production Deployment

DoDoo Daily is specifically optimized for private cloud environments on home NAS systems like Synology and QNAP.

🔗 **Read the definitive production deployment guide 👉 [DEPLOY_NAS.md](./DEPLOY_NAS.md)**

The deployment files include a complete solution for handling external configurations through an independent `.env` file for your NAS, along with a troubleshooting guide.

---
