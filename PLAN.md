# Planning

## 1. Project Goal

Create a daily tool for Children's daily tasks.

## 2. Technical Stack

- Next.js 16 (App Router) with static export
- Tailwind CSS 4
- `motion` (motion.dev) for smooth and fluid entire page transitions and interactions
- Context API for Multi-language (i18n)
- SQLite
- PWA (Progressive Web App) + Local Cache + Sync to server when network is available
- Web Push functionality

## 3. UI/UX Elements

- **Mode/Role Switch**: A singular app but with a Parent Mode (admin access) for settings & approvals.
- **Background**: Dynamic blurred animated sky.
- **Header**: Left side DoDoo Daily Logo (Text + Icon), Right side Language Toggle (EN/中).
- **Main Area (Pad/Tablet)**: Inspired by Nintendo Switch game startup screen.
  - Left side: Displays the 3 most recent artworks.
  - Right side: Vertical list of menu items.
- **Main Area (Mobile)**: Designed to fit mobile navigation habits and optimized for children's touch operations.
- **Footer**: `copyright @{year} by DoDoo Daily`

## 4. Core Systems

- **Task System**: Daily/repeating tasks with start/end limits. Completion yields rewards.
- **Emotion System**: Track sudden emotional outbursts (anger). Marks acts with an "anger penalty".
- **Gallery & Sales**: "Art exhibition" style albums (2-3 overlapped images as cover). Take pictures/upload. Generate sharing poster with price. Others can scan and buy (guest account support).
- **Journal System**: Mix of text, images, and voice recordings. Differentiated by parent and child view.
- **Two-track Economy**:
  - **Star System (Reward & Penalty)**: Gold star = Task compelte. Purple star = Art reward. Hollow/Gray shape (Square/Triangle) = Anger penalty.
  - **Currency System**: 1:10 ratio with RMB. Earned by selling art.
  - **Shop System**: Spend currency on actual rewards (Toys, LEGO, gaming time, ice cream) or use it to clear emotion penalties.
