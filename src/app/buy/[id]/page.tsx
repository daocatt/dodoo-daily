import { db } from '@/lib/db'
import { artwork, users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'

export default async function BuyRedirectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const result = await db.select({
        id: artwork.id,
        slug: users.slug
    })
    .from(artwork)
    .leftJoin(users, eq(artwork.userId, users.id))
    .where(eq(artwork.id, id))
    .limit(1)

    if (result.length === 0 || !result[0].slug) {
        notFound()
    }

    // Redirect to the full exhibition detail page
    redirect(`/u/${result[0].slug}/exhibition/${result[0].id}`)
}
