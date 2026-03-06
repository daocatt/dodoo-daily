# NAS Deployment Guide for DoDoo Daily

DoDoo Daily is optimized for deployment on NAS (Synology, QNAP, etc.) using Docker.

## 1. Directory Mapping (Critical)

To ensure your children's data and artwork are preserved during app updates, you **MUST** map these folders in your Docker UI or `docker-compose.yml`:

| Container Path | Purpose | Recommended NAS path |
|---|---|---|
| `/app/database` | SQLite database file | `/docker/dodoo-daily/database` |
| `/app/uploads` | Child artwork & voice files | `/docker/dodoo-daily/uploads` |

## 2. Permissions (Common NAS Pitfall)

The Docker container runs as a non-root user (UID 1001).

- If you see "Permission Denied" in the logs, go to your NAS File Station.
- Right-click the `dodoo-daily` folder -> **Properties** -> **Permissions**.
- Give "Everyone" or the specific Docker user Read/Write access.

## 3. PWA & HTTPS

Browsers only allow PWA "Install" prompts over **HTTPS** or `localhost`.

- If you access your NAS via its IP (e.g., `http://192.168.1.10:3000`), the "Install" button might not appear.
- **Recommendation**: Use a Reverse Proxy (like Synology's built-in one) with a free SSL certificate (Let's Encrypt) to access via a domain like `https://dodoo.your-nas.me`.

## 4. Hardware Acceleration

The app is light, but if you have many high-res images, Ensure your NAS has at least 1GB of RAM for smooth operation of the Next.js standalone server.

## 5. First Run

The system will automatically create a default "Parent" (PIN: 1234) and one "Child" account upon the first successful database connection.
