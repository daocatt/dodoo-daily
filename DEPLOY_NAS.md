# 群晖 NAS (Synology) 专属部署指南

DoDoo Daily 是一款非常轻量、无后端的纯 Node.js (Next.js) 应用程序，非常适合在你的家用 NAS（如 DSM 系统）上部署使用！

---

## 1. 准备配置目录

在群晖 **File Station** 中创建必需的文件夹（建议统一放在 `docker/dodoo-daily` 下）：

1. `docker/dodoo-daily/database/`
   - 用于持久化存储 SQLite 数据文件 (`dodoo.db`)
2. `docker/dodoo-daily/uploads/`
   - 用于持久化存储所有多媒体文件（画作、语音、头像等）
3. `docker/dodoo-daily/.env`
   - （可选）在该目录下创建一个 `.env` 文件用于配置运行时环境变量（如 `TZ=Asia/Shanghai`）。

---

## 2. 部署方案 (二选一)

### 方案 A：从 Docker Hub 直接拉取 (推荐)

这是最简单的方法。您不需要下载源码，只需使用 Docker Compose：

1. 在群晖 **Container Manager** (DSM 7.2+) 中新建一个项目。
2. 使用以下 `docker-compose.yml`：

```yaml
services:
  dodoo-daily:
    image: your-dockerhub-username/dodoo-daily:latest
    container_name: dodoo-daily
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TZ=Asia/Shanghai
    volumes:
      - /volume1/docker/dodoo-daily/database:/app/database
      - /volume1/docker/dodoo-daily/uploads:/app/uploads
```

### 方案 B：使用 GitHub Actions 自动构建

如果你修改了源码并推送到 GitHub：
1. 本仓库已集成 **GitHub Actions** (`.github/workflows/docker-publish.yml`)。
2. 在 GitHub 仓库设置中添加 `DOCKERHUB_USERNAME` 和 `DOCKERHUB_TOKEN`。
3. 每次推送到 `main` 分支，GitHub 会自动构建 `amd64` 和 `arm64` 镜像并推送到你的 Docker Hub。
4. 群晖端只需配置“自动更新”或手动拉取最新镜像即可。

---

## 3. 常见问题：权限 (Permission Denied)

Docker 容器默认以非 Root 用户 (UID: 1001) 运行。如果你在日志中看到 `EACCES: permission denied`：

1. 打开群晖 **File Station**。
2. 右键点击 `database` 和 `uploads` 文件夹 -> **属性** -> **权限**。
3. 点击 **新增**，为用户 `Everyone` 开启 **读取** 和 **写入** 权限（或者高级权限中勾选“应用于子文件夹”）。

---

## 4. HTTPS 与 PWA

- **必须使用 HTTPS** 才能在手机浏览器中看到“添加到主屏幕”图标。
- 建议使用群晖自带的 **反向代理服务器** (控制面板 -> 登录门户 -> 反向代理服务器)。
- 申请一个域名（或使用 Synology DDNS）并配置证书。

