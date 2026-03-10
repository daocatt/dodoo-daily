# 首页布局与交互技术规范 (Homepage Layout & Interaction Spec)

## 1. 设计愿景 (Vision)
将首页打造为类似 iOS/Android 原生桌面的交互体验。通过“零滚动”网格和“整屏滑动”翻页，在 Web 视口内实现极致的排版严谨性与流畅的操作手感。

---

## 2. 核心原则 (Core Principles)

### 2.1 零垂直滚动 (Absolute Zero-Scroll)
- **强制约束**：无论在任何屏幕比例（如超宽屏、超窄屏、折叠屏）下，内容必须 100% 容纳在可见视口内。
- **计算逻辑**：格点大小（`cellSize`）不再仅由宽度决定。渲染引擎会同时计算可用宽度和高度，并取其**最小值**进行等比缩放。

### 2.2 多屏 Carousel 架构
- **分屏逻辑**：系统由物理独立的“屏（Page）”组成，目前设定为 `2屏`。
- **平滑切换**：采用基于 `framer-motion` 的 Carousel 容器，支持触摸手势、指示器点按和编辑工具栏快速跳转。
- **布局隔离**：每一屏拥有独立的 32 格（桌面端）空间，互不挤压。

### 2.3 组件重复与独立
- **无限制布置**：支持在不同屏幕或同一屏幕中放置多个相同类型的组件（例如：Page 1 一个 4x2 任务，Page 2 一个 1x1 任务）。

---

## 3. 技术规格 (Technical Specifications)

### 3.1 响应式网格断点 (Grid Breakpoints)

| 设备类型 | 屏幕宽度 (W) | 列数 (Cols) | 最大行数 (Max Rows) | 单屏容量 |
| :--- | :--- | :--- | :--- | :--- |
| **桌面端 (Laptops/Monitors)** | W >= 1024px | **8** | **4** | 32 格 |
| **平板端 (iPads/Tablets)** | 600px <= W < 1024px | **6** | 5-7 (动态) | 视比例而定 |
| **手机端 (Mobile)** | W < 600px | **4** | 5-7 (动态) | 视比例而定 |

### 3.2 坐标系统 (Coordinate System)
- **存储坐标**：数据库存储连续的 `x`。
  - **Page 1**: `x` ∈ [0, 7]
  - **Page 2**: `x` ∈ [8, 15]
- **转换逻辑**：
  - **当前页判断**: `Math.floor(x / gridCols)`
  - **屏内相对坐标**: `x % gridCols`
  - **像素转换**: `toLeft(x) = (pageIndex * 100vw) + offset + (localX * cellSpacing)`

---

## 4. 关键算法实现 (Key Algorithms)

### 4.1 自动对齐与垂直居中 (Absolute Centering)
系统自动计算剩余边距并应用于 `grid-stage`，确保网格在视口中央对齐：
- `pageOffsetX = (stageWidth - gridWidth) / 2`
- `pageOffsetY = (stageHeight - HEADER_H - gridHeight) / 2`

### 4.2 智能碰撞检测 (resolveOverlap - 同屏优先)
为了解决组件在 Page 1 和 Page 2 之间“乱跳”的问题，算法遵循以下优先级排序：
1. **位置锁定**：优先尝试组件当前位置。
2. **本屏优先**：若冲突，优先在组件**原本所在的 Page 索引内**寻找第一个空位。
3. **全局填充**：若本屏已满，才溢出到其他屏幕。

### 4.3 动态投影 (Drag Preview)
编辑模式下，投影系统（Ghost Slot）实时根据 Carousel 当前的 `currentPage` 和偏移量计算物理坐标，确保跨屏拖拽时的视觉反馈准确无误。

---

## 5. 交互效果与组件状态

### 5.1 编辑模式 (Edit Mode)
- **快速切屏**：编辑栏集成 `Page 1 / Page 2` 切换器，方便快速跨屏操作。
- **无感适配**：调整组件大小时，其归属屏信息被严格锁定，防止因尺寸变化导致的意外跳转。

### 5.2 导航视图 (Navigation)
- **底部分页器**：iOS 风格的圆点指示器，实时反馈当前页面进度。
- **手势交互**：支持基于物理速度的惯性滑动切换。

---

## 6. 实现进度总览 (Implementation Status)

- [x] **等比网格引擎**：基于 W/H 最小值的 cellSize 计算逻辑。
- [x] **Carousel 架构**：多屏水平滑动容器。
- [x] **同屏优先重排**：防止跨屏跳跃的 `resolveOverlap` 算法。
- [x] **视觉对齐系统**：全自动水平/垂直绝对居中。
- [x] **指示器与控制**：iOS Dots 与 编辑栏切屏按钮。
- [x] **组件独立性**：允许重复类型添加。
