import { sql } from "drizzle-orm";
import { text, integer, sqliteTable, real } from "drizzle-orm/sqlite-core";

// -----------------------------------------------------------------------------
// USER & FAMILY SYSTEM
// -----------------------------------------------------------------------------

export const users = sqliteTable("Users", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    nickname: text("nickname").unique(),
    pin: text("pin"),
    role: text("role", { enum: ["PARENT", "CHILD", "GRANDPARENT", "OTHER"] }).notNull().default("CHILD"),
    avatarUrl: text("avatarUrl"),
    gender: text("gender", { enum: ["MALE", "FEMALE", "OTHER"] }).default("OTHER"),
    birthDate: integer("birthDate", { mode: "timestamp" }),
    zodiac: text("zodiac"),
    chineseZodiac: text("chineseZodiac"),
    isArchived: integer("isArchived", { mode: "boolean" }).default(false).notNull(),
    isDeleted: integer("isDeleted", { mode: "boolean" }).default(false).notNull(),
    lastLoginAt: integer("lastLoginAt", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const accountStats = sqliteTable("AccountStats", {
    userId: text("userId").primaryKey().references(() => users.id),
    goldStars: integer("goldStars").default(0).notNull(),
    purpleStars: integer("purpleStars").default(0).notNull(),
    angerPenalties: integer("angerPenalties").default(0).notNull(),
    currency: integer("currency").default(0).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const accountStatsLog = sqliteTable("AccountStatsLog", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id),
    type: text("type", { enum: ["CURRENCY", "GOLD_STAR", "PURPLE_STAR", "ANGER_PENALTY"] }).notNull(),
    amount: integer("amount").notNull(),
    balance: integer("balance").notNull(),
    reason: text("reason").notNull(),
    actorId: text("actorId").references(() => users.id),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const guest = sqliteTable("Guest", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    phone: text("phone"),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// -----------------------------------------------------------------------------
// TASK SYSTEM
// -----------------------------------------------------------------------------

export const task = sqliteTable("Task", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    creatorId: text("creatorId").references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    isRepeating: integer("isRepeating", { mode: "boolean" }).default(false).notNull(),
    isMonthlyRepeating: integer("isMonthlyRepeating", { mode: "boolean" }).default(false).notNull(),
    rewardStars: integer("rewardStars").default(1).notNull(),
    rewardCoins: integer("rewardCoins").default(0).notNull(),
    plannedTime: integer("plannedTime", { mode: "timestamp" }),
    completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
    completedById: text("completedById").references(() => users.id),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const assignedTask = sqliteTable("AssignedTask", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    assignerId: text("assignerId").references(() => users.id),
    assigneeId: text("assigneeId").references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    isRepeating: integer("isRepeating", { mode: "boolean" }).default(false).notNull(),
    isMonthlyRepeating: integer("isMonthlyRepeating", { mode: "boolean" }).default(false).notNull(),
    rewardStars: integer("rewardStars").default(1).notNull(),
    rewardCoins: integer("rewardCoins").default(0).notNull(),
    confirmationStatus: text("confirmationStatus", { enum: ["PENDING", "APPROVED", "REJECTED"] }).default("PENDING"),
    plannedTime: integer("plannedTime", { mode: "timestamp" }),
    completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
    completedById: text("completedById").references(() => users.id),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
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
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// -----------------------------------------------------------------------------
// GALLERY & SALES SYSTEM
// -----------------------------------------------------------------------------

export const album = sqliteTable("Album", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").references(() => users.id),
    title: text("title").notNull(),
    coverUrls: text("coverUrls"),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
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
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const order = sqliteTable("Order", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    artworkId: text("artworkId").notNull().references(() => artwork.id),
    guestId: text("guestId").notNull().references(() => guest.id),
    amountRMB: real("amountRMB").notNull(),
    status: text("status").default("PENDING").notNull(),
    qrCodeUrl: text("qrCodeUrl"),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// -----------------------------------------------------------------------------
// JOURNAL SYSTEM
// -----------------------------------------------------------------------------

export const journal = sqliteTable("Journal", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    authorId: text("authorId").references(() => users.id),
    authorRole: text("authorRole").notNull(),
    text: text("text"),
    imageUrl: text("imageUrl"),
    imageUrls: text("imageUrls"),
    voiceUrl: text("voiceUrl"),
    isMilestone: integer("isMilestone", { mode: "boolean" }).default(false).notNull(),
    milestoneDate: integer("milestoneDate", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
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
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const purchase = sqliteTable("Purchase", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").references(() => users.id),
    itemId: text("itemId").notNull().references(() => shopItem.id),
    costCoins: integer("costCoins").notNull(),
    status: text("status").default("PENDING").notNull(),
    remarks: text("remarks"),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
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
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
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
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// -----------------------------------------------------------------------------
// GROWTH SYSTEM (Weight & Height)
// -----------------------------------------------------------------------------

export const growthRecord = sqliteTable("GrowthRecord", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id),
    height: real("height"), // in cm
    weight: real("weight"), // in kg
    date: integer("date", { mode: "timestamp" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});
