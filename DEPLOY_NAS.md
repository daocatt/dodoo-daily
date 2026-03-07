# 群晖 NAS (Synology) 专属部署指南

DoDoo Daily 是一款非常轻量、无后端的纯 Node.js (Next.js) 应用程序，非常适合在你的家用 NAS（如 DSM 系统）上部署使用！

本指南以群晖为例，详细说明如何使用 Docker / Container Manager 部署。

---

## 1. 准备配置目录与文件

在群晖 **File Station** 中创建必需的文件夹（例如放在 `docker` 共享文件夹下）：

1. `docker/dodoo-daily/`
   - 这是您的主目录
2. `docker/dodoo-daily/database/`
   - 用于持久化存储 SQLite 数据文件 (`dodoo.db`)
3. `docker/dodoo-daily/uploads/`
   - 用于持久化存储宝宝的画作、上传语音、头像等所有多媒体文件
4. `docker/dodoo-daily-config/`
   - **(关键步骤)** 从代码外部管理你的独立配置，在此处创建一个 `.env` 文本文件。

### 🌟 单独的 `.env` 配置文件

为了安全且不随容器镜像变动，我们在**非当前源码目录**建立 `.env` 如下：
群晖路径示例：`/volume1/docker/dodoo-daily-config/.env`

文件内容（根据你自己的需求调整）：

```env
NEXT_PUBLIC_APP_NAME="DoDoo Daily"
# 以及你需要的任何其它配置 (例如反向代理域名、S3密钥等)
```

> **非常重要**：我们已经在 `docker-compose.yml` 中配置了对外部环境的解析！这样既能保障在**构建期**(读取 NEXT_PUBLIC_ )，也能保障在**运行期**自动加载外部 `.env`。

---

## 2. 理解映射关系 (目录转移核心)

在运行 `docker-compose.yml` 之前，你必须配置 Volume 映射关系，这直接决定了下次升级重启容器还能不能保留以前的数据。

> ⚠️ 如果你跳过该步，所有录音和金币都会随重启烟消云散！

在提供的 `docker-compose.yml` 内部，相关的设置如下：

```yaml
    volumes:
      # [宿主机即群晖的绝对路径] : [容器内的挂载点]
      
      # 映射数据库，保障重启后还在
      - /volume1/docker/dodoo-daily/database:/app/database
      
      # 映射用户上传多媒体，保障照片还在
      - /volume1/docker/dodoo-daily/uploads:/app/uploads
```

---

## 3. 在群晖中构建和运行应用

本应用由于包含特殊的构建过程（比如要运行 Next.js 并自动注入 BuildKit Secret读取配置），所以在群晖中我们通常使用 SSH 登录并运行 Docker Compose 来保证完美部署：

1. **登录群晖 SSH**

   ```bash
   ssh your_username@192.168.1.xxx
   sudo -i
   ```

2. **下载代码到群晖**（假设放进 /volume1/docker/dodoo-source）

   ```bash
   cd /volume1/docker/dodoo-source
   # 确认 docker-compose.yml 中定义的 secret 路径(/volume1/docker/dodoo-daily-config/.env)准确无误
   ```

3. **构建并启动**
   这是重点部分。为了使用我们配置的 Docker `secrets`（读取外部独立目录的 `.env`），您可能需要启用 Docker BuildKit。

   ```bash
   DOCKER_BUILDKIT=1 docker-compose build
   docker-compose up -d
   ```

*(如果你更喜欢使用群晖 DSM 7.2 的 Container Manager 界面进行部署，只需导入本仓库中的 `docker-compose.yml` 配置并配置该 Project 即可，系统会自动映射环境和处理构建)*

---

## 4. 权限问题排查 (Permission Denied)

Docker 容器默认以非 Root 用户(Node UID: 1001)跑起来以保证你的 NAS 安全。

**当你部署后无法新建用户或者报错：“EACCES: permission denied”：**

- 就在你的**群晖后台** -> **File Station** -> 找到前面创建的 `database` 和 `uploads` 文件夹。
- 右键点击 -> **属性** -> **权限** 标签页。
- 为 **系统用户 `Everyone`** 开启完全读取/写入权限（或仅对 UID `1001` 设置权限）。

---

## 5. 最后一部准备：域名与 HTTPS(PWA按需)

- 要让 DoDoo Daily 能像原生应用一样装在你手机的主屏幕（支持 PWA 断网启动）。你必须在群晖设置 `HTTPS` 访问。
- 打开群晖 **控制面板 -> 登录门户 -> 高级 -> 反向代理服务器**。
- 将你申请的免费域名（如 `https://dodoo.yournas.me:443`）指向本容器正在跑的 `http://localhost:3000`。
- 一旦通过 HTTPS 地址打开，iOS 和安卓浏览器就能提示 “添加到主屏幕” 啦！🚀

首次进入系统，你将看到一个初始化向导，只需根据提示完成第一个超级小屁孩档案，旅程即可开始！
