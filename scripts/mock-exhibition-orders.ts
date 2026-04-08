/**
 * Mock Data Script: Exhibition Orders for Visitors
 * This script creates mock visitors and art exhibition orders.
 */
import { db } from "../src/lib/db";
import { artwork, visitor, order, users, album } from "../src/lib/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("🎨 Generating Mock Exhibition Orders...");

    // 1. Get an existing child member to act as the artist
    const [artist] = await db.select().from(users).where(eq(users.role, "CHILD")).limit(1);
    if (!artist) {
        console.error("❌ No child member found to be the artist. Please run seed-child.ts first.");
        return;
    }

    // 2. Ensure we have an album
    let [targetAlbum] = await db.select().from(album).where(eq(album.userId, artist.id)).limit(1);
    if (!targetAlbum) {
        const albumId = crypto.randomUUID();
        await db.insert(album).values({
            id: albumId,
            userId: artist.id,
            title: "Mock Exhibition Collection",
            isPublic: true,
        });
        [targetAlbum] = await db.select().from(album).where(eq(album.id, albumId)).limit(1);
        console.log("📂 Mock album created.");
    }

    // 3. Ensure we have some public, approved artworks
    let artworksList = await db.select().from(artwork).where(eq(artwork.userId, artist.id)).limit(3);
    if (artworksList.length === 0) {
        console.log("🖼️ No artworks found. Creating placeholders...");
        const placeholders = [
            { title: "Neon Dream", url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1000&auto=format&fit=crop" },
            { title: "Ocean Silence", url: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=1000&auto=format&fit=crop" },
            { title: "Mountain High", url: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=1000&auto=format&fit=crop" }
        ];

        for (const p of placeholders) {
            await db.insert(artwork).values({
                id: crypto.randomUUID(),
                userId: artist.id,
                albumId: targetAlbum.id,
                title: p.title,
                imageUrl: p.url,
                priceCoins: 300,
                priceRMB: 30,
                isApproved: true,
                isPublic: true,
                exhibitionDescription: `A beautiful painting named ${p.title} created by ${artist.name}.`,
            });
        }
        artworksList = await db.select().from(artwork).where(eq(artwork.userId, artist.id)).limit(3);
        console.log("🖼️ Placeholder artworks created.");
    }

    // 4. Create a visitor
    const visitorId = crypto.randomUUID();
    await db.insert(visitor).values({
        id: visitorId,
        name: "Art Enthusiast",
        email: "enthusiast@example.com",
        phone: "13800000000",
        status: "APPROVED",
        currency: 1000,
    }).onConflictDoNothing();

    console.log("👤 Mock visitor created.");

    // 5. Create exhibition orders
    console.log("📦 Creating orders...");
    for (const art of artworksList) {
        await db.insert(order).values({
            id: crypto.randomUUID(),
            artworkId: art.id,
            visitorId: visitorId,
            amountRMB: art.priceRMB || 50,
            amountCoins: art.priceCoins || 500,
            paymentType: "RMB",
            status: "PENDING_CONFIRM",
            contactName: "Art Enthusiast",
            contactPhone: "13800000000",
            shippingAddress: "Gallery Road, Dream City",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    console.log("✅ Mock exhibition orders generated successfully!");
}

main().catch(console.error);
