# 系统角色与权限说明 (System Roles & Permissions)

## 1. 角色定义 (Role Definitions)

系统目前划分为四类核心 persona，每种角色对应不同的权限范围和操作边界。

### 1.1 Superadmin (超级管理员)
- **定义**：系统初始化时创建的第一个账号，具有最高管理权限。
- **特性**：
    - **不可删除**：`isLocked: true`，防止系统管理权丢失。
    - **权限控制**：唯一可以将普通成员提升为 `Admin` 或撤销其权限的角色。
    - **无限制访问**：可进入 `/admin/management` 管理所有家庭成员及系统配置。

### 1.2 Admin (管理员)
- **定义**：由 Superadmin 指定的具有管理权限的家长/长辈账号。
- **特性**：
    - **管理权**：可以进入 `/admin/management` 进行成员管理、系统控制等操作。
    - **限制**：无法修改或删除 Superadmin 账号，无法撤销 Superadmin 的权限。

### 1.3 Family Member (普通家庭成员)
- **定义**：系统内的常规使用者（如子女或非管理角色的长辈）。
- **特性**：
    - **专属中心**：通过 `/member` 访问个人中心，查看自己的收藏、订单和资金记录。
    - **画廊组件**：在 Bento 仪表盘拥有“我的画廊”组件。
    - **限制**：无法进入管理后台（`/admin/management`）进行系统级设置。

### 1.4 Visitor (外部访客)
- **定义**：非家庭成员的外部浏览者。
- **特性**：
    - **访客终端**：通过 `/visitor/login` 登录独立的访客中心。
    - **基础交互**：支持在公共展厅点赞、下单，并管理自己的配送地址和余额。

---

## 2. 路由架构 (Routing Architecture)

| 路由路径 | 适用角色 | 说明 |
| :--- | :--- | :--- |
| `/admin/*` | Superadmin / Admin | 系统管理、后台操作。 |
| `/member/*` | Superadmin / Admin / Member | 登录后的成员个人页，类似访客中心的私人版。 |
| `/visitor/*` | Visitor | 独立的访客认证与资产管理入口。 |
| `/u/[slug]` | 所有 | 公共展示主页，支持不同身份的无缝交互。 |

---

## 3. 核心权限控制逻辑

### 3.1 后端鉴权 (RBAC)
- **Permission Mapping**:
    - `SUPERADMIN` -> `isAdmin: true`
    - `ADMIN` -> `isAdmin: true`
    - `USER` -> `isAdmin: false`
- **Session API**: `/api/stats` 返回当前用户的 `permissionRole` 和 `isAdmin` 状态。

### 3.2 前端拦截 (AuthGate)
- **Modes**:
    - `FAMILY`: 仅允许 `Superadmin`, `Admin`, `Member`。
    - `VISITOR`: 仅允许 `Visitor`。
    - `BOTH`: 允许登录的成员或访客。
    - `ANY`: 允许任何已认证身份。

### 3.3 数据锁定
- `isLocked` 字段用于保护关键账号。在 `/api/parent/children` 的 DELETE 接口中，会强制检查该字段，阻止对 Superadmin 的删除请求。
