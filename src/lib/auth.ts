import { cookies } from 'next/headers';

export async function getSessionUser() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('dodoo_user_id')?.value?.replace(/^"|"$/g, '');
    const role = cookieStore.get('dodoo_role')?.value?.replace(/^"|"$/g, '');
    return { userId, role };
}
