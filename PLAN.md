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
- **Emotion System**: Track sudden emotional outbursts (anger).
- **Gallery & Sales**: "Art exhibition" style albums (2-3 overlapped images as cover). Take pictures/upload. Generate sharing poster with price. Others can scan and buy (guest account support).
- **Journal System**: Mix of text, images, and voice recordings. Differentiated by parent and child view.
- **Two-track Economy**:
  - **Star System (Rewards)**: Gold star = Task complete. Purple star = Art reward.
  - **Currency System**: 1:10 ratio with RMB. Earned by selling art.
  - **Shop System**: Spend currency on actual rewards (Toys, LEGO, gaming time, ice cream).
- **Admin & Management**:
  - **Parent Console**: Comprehensive dashboard for managing family members, shop inventory, and orders.
  - **Data Integrity**: Manual stat adjustments for each child with a full audit log of all currency/star changes.
  - **Privacy & Security**: PIN-based access control for all roles, allowing shared devices with privacy for multi-child households.
  - **Customization**: Support for custom user avatars and role-specific profile settings.
- **Family Member Profiles (Enhanced)**:
  - Full editing of profiles including Name, Nickname, Gender, Date of Birth, and Avatar.
  - Automatically calculate and display Zodiac signs based on the selected Date of Birth.

## 5. High-Value Refinements & Features

- **Milestone (大事记) System**:
  - Integrated with the Journal: Option to flag important entries as "Milestones".
  - Dedicated Timeline View: A vertical chronological line (latest to earliest) showcasing legacy moments.
  - Media-Rich: Support for thumbnails in the timeline.
  - Interactive Lightbox: Click thumbnails to view full-size images with left/right navigation for multi-image entries.
- **Enhanced Journal Media**:
  - Increase image capacity per entry to up to 20 photos.
  - Seamless gallery switching within the Lighthouse/Lightbox view.
  - Journal feed renamed to "Daily Post" for a more active, social feel.
  - Timeline view showcases author avatars and high-impact visual layouts.

## Database Lifecycle & Migration

To ensure high stability and avoid data loss in production, we use Drizzle Kit's migration system:

1. **Local Schema Changes**: Modify `src/lib/schema.ts`.
2. **Generate Migration**: Run `npm run db:generate`. This creates human-readable SQL files in `src/lib/drizzle`.
3. **Apply Update**:
   - **Local Dev**: Use `npm run db:migrate` or `npm run db:push` for fast iteration.
   - **Production/Docker**: On startup, `start.sh` automatically runs `migrate.js` to reconcile the SQLite database.
4. **Tracking**: Avoid manual DB edits; all field changes are tracked in version-controlled SQL files.
