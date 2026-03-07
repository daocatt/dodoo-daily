# 🌟 DoDoo Daily

[**English**](./README.md) | **简体中文**

DoDoo Daily 是一款专为父母和孩子设计的轻量级全栈纯 Node.js 家庭应用系统。

---

## 🚀 本地开发快速启动

**1. 安装依赖**

```bash
npm install
```

**2. 初始化数据库和示例数据**  
执行完整的初始化脚本（自动建表并注入默认账号）：

```bash
npm run db:setup
```

> 初始化完成后，系统会默认生成一个 **Parent（父母）** 账号，其默认 PIN 码为 `1234`。首次登录将会自动触发安装向导！

**3. 启动本地服务**

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可看到应用首页。

---

## 🐳 NAS/Docker 生产环境部署

DoDoo Daily 特别优化了针对群晖（Synology）、QNAP 等家庭存储 NAS 搭建私有云的环境。

🔗 **阅读权威的生产部署指南 👉 [DEPLOY_NAS.md](./DEPLOY_NAS.md)**

部署文件包含了通过群晖专属独立 `.env` 文件处理外部设置的完善方案以及防坑指南。

---
