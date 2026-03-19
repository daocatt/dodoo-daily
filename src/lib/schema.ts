/**
 * DoDoo Daily Database Schema
 * Version: 1.0.0 (Initial Release)
 */
import { sql } from "drizzle-orm";
import { text, integer, sqliteTable, real } from "drizzle-orm/sqlite-core";

// -----------------------------------------------------------------------------
// USER & FAMILY SYSTEM
// -----------------------------------------------------------------------------

export const users = sqliteTable("Users", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    nickname: text("nickname").unique(),
    slug: text("slug").unique(), // For public personal homepage URL
    exhibitionEnabled: integer("exhibitionEnabled", { mode: "boolean" }).default(true).notNull(),
    pin: text("pin"),
    role: text("role", { enum: ["PARENT", "CHILD", "GRANDPARENT", "OTHER"] }).notNull().default("CHILD"),
    avatarUrl: text("avatarUrl"),
    gender: text("gender", { enum: ["MALE", "FEMALE", "OTHER"] }).default("OTHER"),
    birthDate: integer("birthDate", { mode: "timestamp_ms" }),
    zodiac: text("zodiac"),
    chineseZodiac: text("chineseZodiac"),
    isArchived: integer("isArchived", { mode: "boolean" }).default(false).notNull(),
    isDeleted: integer("isDeleted", { mode: "boolean" }).default(false).notNull(),
    lastLoginAt: integer("lastLoginAt", { mode: "timestamp_ms" }),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const accountStats = sqliteTable("AccountStats", {
    userId: text("userId").primaryKey().references(() => users.id),
    goldStars: integer("goldStars").default(0).notNull(),
    purpleStars: integer("purpleStars").default(0).notNull(),
    angerPenalties: integer("angerPenalties").default(0).notNull(),
    currency: integer("currency").default(0).notNull(),
    fiatBalance: real("fiatBalance").default(0).notNull(), // Real money in pocket (账本钱包)
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export const accountStatsLog = sqliteTable("AccountStatsLog", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id),
    type: text("type", { enum: ["CURRENCY", "GOLD_STAR", "PURPLE_STAR", "ANGER_PENALTY"] }).notNull(),
    amount: integer("amount").notNull(),
    balance: integer("balance").notNull(),
    reason: text("reason").notNull(),
    actorId: text("actorId").references(() => users.id),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const currencyLog = sqliteTable("CurrencyLog", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id),
    amount: integer("amount").notNull(),
    balance: integer("balance").notNull(),
    reason: text("reason").notNull(),
    actorId: text("actorId").references(() => users.id),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const goldStarLog = sqliteTable("GoldStarLog", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id),
    amount: integer("amount").notNull(),
    balance: integer("balance").notNull(),
    reason: text("reason").notNull(),
    actorId: text("actorId").references(() => users.id),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const purpleStarLog = sqliteTable("PurpleStarLog", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id),
    amount: integer("amount").notNull(),
    balance: integer("balance").notNull(),
    reason: text("reason").notNull(),
    actorId: text("actorId").references(() => users.id),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const guest = sqliteTable("Guest", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    status: text("status", { enum: ["PENDING", "APPROVED", "BANNED"] }).default("PENDING").notNull(),
    currency: integer("currency").default(0).notNull(),
    lastIp: text("lastIp"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const rechargeCode = sqliteTable("RechargeCode", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    code: text("code").notNull().unique(),
    amount: integer("amount").notNull(),
    isUsed: integer("isUsed", { mode: "boolean" }).default(false).notNull(),
    usedByGuestId: text("usedByGuestId").references(() => guest.id),
    usedAt: integer("usedAt", { mode: "timestamp_ms" }),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const guestCurrencyLog = sqliteTable("GuestCurrencyLog", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    guestId: text("guestId").notNull().references(() => guest.id),
    amount: integer("amount").notNull(),
    balance: integer("balance").notNull(),
    reason: text("reason").notNull(), // 'RECHARGE', 'PURCHASE', 'MANUAL_ADJUST'
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const ipBlacklist = sqliteTable("IpBlacklist", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ip: text("ip").notNull().unique(),
    reason: text("reason"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

// -----------------------------------------------------------------------------
// TASK SYSTEM
// -----------------------------------------------------------------------------

export const task = sqliteTable("Task", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    creatorId: text("creatorId").references(() => users.id),
    assignerId: text("assignerId").references(() => users.id),
    assigneeId: text("assigneeId").references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    isRepeating: integer("isRepeating", { mode: "boolean" }).default(false).notNull(),
    isMonthlyRepeating: integer("isMonthlyRepeating", { mode: "boolean" }).default(false).notNull(),
    rewardStars: integer("rewardStars").default(1).notNull(),
    rewardCoins: integer("rewardCoins").default(0).notNull(),
    confirmationStatus: text("confirmationStatus", { enum: ["PENDING", "APPROVED", "REJECTED"] }),
    plannedTime: integer("plannedTime", { mode: "timestamp_ms" }),
    completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
    completedById: text("completedById").references(() => users.id),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

// -----------------------------------------------------------------------------
// EMOTION SYSTEM
// -----------------------------------------------------------------------------

export const emotionRecord = sqliteTable("EmotionRecord", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").references(() => users.id),
    type: text("type").default("ANGER").notNull(),
    notes: text("notes"),
    resolved: integer("resolved", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

// -----------------------------------------------------------------------------
// GALLERY & SALES SYSTEM
// -----------------------------------------------------------------------------

export const album = sqliteTable("Album", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").references(() => users.id),
    title: text("title").notNull(),
    coverUrls: text("coverUrls"),
    isPublic: integer("isPublic", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export const artwork = sqliteTable("Artwork", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").references(() => users.id),
    title: text("title").notNull(),
    imageUrl: text("imageUrl").notNull(),
    priceRMB: real("priceRMB").default(0).notNull(),
    priceCoins: integer("priceCoins").default(0).notNull(),
    albumId: text("albumId").references(() => album.id),
    isSold: integer("isSold", { mode: "boolean" }).default(false).notNull(),
    buyerId: text("buyerId").references(() => guest.id),
    isArchived: integer("isArchived", { mode: "boolean" }).default(false).notNull(),
    isPublic: integer("isPublic", { mode: "boolean" }).default(false).notNull(),
    isApproved: integer("isApproved", { mode: "boolean" }).default(false).notNull(),
    exhibitionDescription: text("exhibitionDescription"),
    likes: integer("likes").default(0).notNull(),
    views: integer("views").default(0).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const order = sqliteTable("Order", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    artworkId: text("artworkId").notNull().references(() => artwork.id),
    guestId: text("guestId").notNull().references(() => guest.id),
    amountRMB: real("amountRMB").default(0).notNull(),
    amountCoins: integer("amountCoins").default(0).notNull(),
    paymentType: text("paymentType", { enum: ["COINS", "RMB"] }).default("COINS").notNull(),
    status: text("status").default("PENDING").notNull(),
    qrCodeUrl: text("qrCodeUrl"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

// -----------------------------------------------------------------------------
// JOURNAL SYSTEM
// -----------------------------------------------------------------------------

export const journal = sqliteTable("Journal", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    authorId: text("authorId").references(() => users.id),
    authorRole: text("authorRole").notNull(),
    text: text("text"),
    imageUrl: text("imageUrl"), // Still used for backward compatibility/thumbnail
    imageUrls: text("imageUrls"), // Still used as a JSON cache
    voiceUrl: text("voiceUrl"),
    isMilestone: integer("isMilestone", { mode: "boolean" }).default(false).notNull(),
    milestoneDate: integer("milestoneDate", { mode: "timestamp_ms" }),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export const journalMedia = sqliteTable("JournalMedia", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    journalId: text("journalId").notNull().references(() => journal.id, { onDelete: 'cascade' }),
    type: text("type", { enum: ["IMAGE", "VOICE", "VIDEO"] }).default("IMAGE").notNull(),
    url: text("url").notNull(),
    sortOrder: integer("sortOrder").default(0).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});


// -----------------------------------------------------------------------------
// SHOP / CONSUMPTION SYSTEM
// -----------------------------------------------------------------------------

export const shopItem = sqliteTable("ShopItem", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    costCoins: integer("costCoins").notNull(),
    iconUrl: text("iconUrl"),
    stock: integer("stock").default(-1).notNull(),
    deliveryDays: integer("deliveryDays").default(1).notNull(),
    isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
    isDeleted: integer("isDeleted", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export const purchase = sqliteTable("Purchase", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").references(() => users.id),
    itemId: text("itemId").notNull().references(() => shopItem.id),
    costCoins: integer("costCoins").notNull(),
    // Snapshot fields — preserve item info even if the item is later deleted
    itemName: text("itemName"),
    itemIconUrl: text("itemIconUrl"),
    itemDescription: text("itemDescription"),
    status: text("status").default("PENDING").notNull(),
    remarks: text("remarks"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export const wish = sqliteTable("Wish", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("imageUrl"),
    // PENDING | CONFIRMED | REJECTED
    // CONFIRMED = parent acknowledged (may or may not have added to shop)
    // REJECTED  = parent declined
    status: text("status").default("PENDING").notNull(),
    addedToShopAt: integer("addedToShopAt", { mode: "timestamp_ms" }), // set when added to shop, prevents re-adding
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

// -----------------------------------------------------------------------------
// SYSTEM SETTINGS
// -----------------------------------------------------------------------------

export const systemSettings = sqliteTable("SystemSettings", {
    id: text("id").primaryKey().default("app_settings"),
    isClosed: integer("isClosed", { mode: "boolean" }).default(false).notNull(),
    // needsSetup: true until the first-run wizard is completed
    needsSetup: integer("needsSetup", { mode: "boolean" }).default(true).notNull(),
    starsToCoinsRatio: integer("starsToCoinsRatio").default(10).notNull(),
    coinsToRmbRatio: real("coinsToRmbRatio").default(1.0).notNull(),
    timezone: text("timezone").default("Asia/Shanghai").notNull(),
    systemName: text("systemName").default("DoDoo Family").notNull(),
    systemSubtitle: text("systemSubtitle"),
    showAllAvatars: integer("showAllAvatars", { mode: "boolean" }).default(true).notNull(),
    requireGuestApproval: integer("requireGuestApproval", { mode: "boolean" }).default(true).notNull(),
    requireInvitationCode: integer("requireInvitationCode", { mode: "boolean" }).default(false).notNull(),
    guestInvitationCode: text("guestInvitationCode"),
    disableVisitorLogin: integer("disableVisitorLogin", { mode: "boolean" }).default(false).notNull(),
    disableVisitorRegistration: integer("disableVisitorRegistration", { mode: "boolean" }).default(false).notNull(),
    homepageImages: text("homepageImages"), // stringified JSON array
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

// -----------------------------------------------------------------------------
// MEDIA & FILE SYSTEM
// -----------------------------------------------------------------------------

export const media = sqliteTable("Media", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    fileName: text("fileName").notNull(),
    fileType: text("fileType").notNull(),
    mimeType: text("mimeType"),
    size: integer("size"),
    storageProvider: text("storageProvider").default("LOCAL").notNull(),
    path: text("path").notNull(),
    key: text("key").notNull(),
    bucket: text("bucket"),
    userId: text("userId").references(() => users.id),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

// -----------------------------------------------------------------------------
// GROWTH SYSTEM (Weight & Height)
// -----------------------------------------------------------------------------

export const growthRecord = sqliteTable("GrowthRecord", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id),
    height: real("height"), // in cm
    weight: real("weight"), // in kg
    date: integer("date", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

// -----------------------------------------------------------------------------
// PWA & PUSH NOTIFICATION SYSTEM
// -----------------------------------------------------------------------------

export const pushSubscription = sqliteTable("PushSubscription", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    deviceType: text("deviceType"), // 'mobile' | 'desktop'
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

// -----------------------------------------------------------------------------
// FAMILY INTERACTION (Notes / Message Board)
// -----------------------------------------------------------------------------

export const familyNote = sqliteTable("FamilyNote", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    authorId: text("authorId").notNull().references(() => users.id),
    text: text("text").notNull(),
    color: text("color").default("#FEF3C7"), // Default post-it yellow
    isPinned: integer("isPinned", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});
// -----------------------------------------------------------------------------
// USER DASHBOARD / BENTO GRID SYSTEM
// -----------------------------------------------------------------------------

export const homeWidget = sqliteTable("HomeWidget", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id),
    type: text("type").notNull(), // 'TASKS', 'NOTES', 'JOURNAL', 'PHOTOS', 'SHOP', etc.
    size: text("size").notNull().default("SMALL"), // 'SMALL' (1x1), 'MEDIUM' (2x1), 'LARGE' (2x2), 'XL' (4x2)
    x: integer("x").notNull(),
    y: integer("y").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

// -----------------------------------------------------------------------------
// LEDGER SYSTEM (账本 / 真实零花钱)
// -----------------------------------------------------------------------------

export const ledgerCategory = sqliteTable("LedgerCategory", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    emoji: text("emoji").notNull(),
    type: text("type", { enum: ["INCOME", "EXPENSE"] }).notNull(),
    isSystem: integer("isSystem", { mode: "boolean" }).default(false).notNull(), 
    creatorId: text("creatorId").references(() => users.id), // Null if system
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const ledgerRecord = sqliteTable("LedgerRecord", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id),
    categoryId: text("categoryId").notNull().references(() => ledgerCategory.id),
    type: text("type", { enum: ["INCOME", "EXPENSE"] }).notNull(),
    amount: real("amount").notNull(), // Real money amount (supports 2 decimals)
    date: integer("date", { mode: "timestamp_ms" }).notNull(),
    description: text("description"),
    relatedUserId: text("relatedUserId").references(() => users.id), // Who is this expense/income related to?
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});


