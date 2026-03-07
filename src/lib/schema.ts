import { sql } from "drizzle-orm";
import { text, integer, sqliteTable, real, primaryKey } from "drizzle-orm/sqlite-core";

// -----------------------------------------------------------------------------
// USER & FAMILY SYSTEM
// -----------------------------------------------------------------------------

export const users = sqliteTable("Users", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    pin: text("pin"), // Optional simple PIN for role switching
    role: text("role", { enum: ["PARENT", "CHILD"] }).notNull().default("CHILD"),
    avatarUrl: text("avatarUrl"),
    isArchived: integer("isArchived", { mode: "boolean" }).default(false).notNull(),
    isDeleted: integer("isDeleted", { mode: "boolean" }).default(false).notNull(),
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
    amount: integer("amount").notNull(), // Change amount (+/-)
    balance: integer("balance").notNull(), // Resulting balance
    reason: text("reason").notNull(),
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
    assignedTo: text("assignedTo").references(() => users.id), // Link to child
    title: text("title").notNull(),
    description: text("description"),
    isRepeating: integer("isRepeating", { mode: "boolean" }).default(false).notNull(),
    rewardStars: integer("rewardStars").default(1).notNull(),
    startTime: integer("startTime", { mode: "timestamp" }),
    endTime: integer("endTime", { mode: "timestamp" }),
    completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// -----------------------------------------------------------------------------
// EMOTION SYSTEM
// -----------------------------------------------------------------------------

export const emotionRecord = sqliteTable("EmotionRecord", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").references(() => users.id), // Link to child
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
    userId: text("userId").references(() => users.id), // Link to child creator
    title: text("title").notNull(),
    coverUrls: text("coverUrls"),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const artwork = sqliteTable("Artwork", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").references(() => users.id), // Link to child creator
    title: text("title").notNull(),
    imageUrl: text("imageUrl").notNull(),
    priceRMB: real("priceRMB").default(0).notNull(),
    priceCoins: integer("priceCoins").default(0).notNull(),
    albumId: text("albumId").references(() => album.id),
    isSold: integer("isSold", { mode: "boolean" }).default(false).notNull(),
    buyerId: text("buyerId").references(() => guest.id),
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
    authorId: text("authorId").references(() => users.id), // Link to user
    authorRole: text("authorRole").notNull(), // For easier filtering CHILD/PARENT
    text: text("text"),
    imageUrl: text("imageUrl"),
    voiceUrl: text("voiceUrl"),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
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
    isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const purchase = sqliteTable("Purchase", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").references(() => users.id), // Child who bought it
    itemId: text("itemId").notNull().references(() => shopItem.id),
    costCoins: integer("costCoins").notNull(),
    status: text("status").default("PENDING").notNull(), // PENDING, SHIPPED, COMPLETED, CANCELLED
    remarks: text("remarks"),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
