import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { join } from 'path';
import { writeFile, mkdir, unlink } from 'fs/promises';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { media as mediaTable } from './schema';
import { eq } from 'drizzle-orm';

const storageProvider = process.env.STORAGE_PROVIDER || 'LOCAL';

const s3Client = storageProvider === 'R2' ? new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
}) : null;

const r2Bucket = process.env.R2_BUCKET || '';
const r2PublicDomain = process.env.R2_PUBLIC_DOMAIN || '';

export type FileType = 'IMAGE' | 'VOICE' | 'VIDEO' | 'DOC' | 'GALLERY';

const getDirByType = (type: FileType) => {
    switch (type) {
        case 'IMAGE': return 'images';
        case 'VOICE': return 'voices';
        case 'VIDEO': return 'videos';
        case 'DOC': return 'docs';
        case 'GALLERY': return 'gallery';
        default: return 'others';
    }
};

export async function uploadMedia(file: File, type: FileType, userId?: string) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const now = new Date();
    const dateDir = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${uuidv4()}.${ext}`;
    const typeDir = getDirByType(type);

    // key is the path within storage (relative)
    const key = `${typeDir}/${dateDir}/${fileName}`;

    let path = ''; // The URL used to access the file

    if (storageProvider === 'R2' && s3Client) {
        const command = new PutObjectCommand({
            Bucket: r2Bucket,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        });

        await s3Client.send(command);
        path = r2PublicDomain ? `${r2PublicDomain}/${key}` : `/${r2Bucket}/${key}`;
    } else {
        // LOCAL storage in public/upload
        const uploadDir = join(process.cwd(), 'public', 'upload', typeDir, dateDir);
        await mkdir(uploadDir, { recursive: true });

        const fullPath = join(uploadDir, fileName);
        await writeFile(fullPath, buffer);

        path = `/upload/${typeDir}/${dateDir}/${fileName}`;
    }

    // Save to database
    const [record] = await db.insert(mediaTable).values({
        name: file.name,
        fileName: fileName,
        fileType: type,
        mimeType: file.type,
        size: file.size,
        storageProvider: storageProvider,
        path: path,
        key: key,
        bucket: storageProvider === 'R2' ? r2Bucket : null,
        userId: userId || null,
    }).returning();

    return record;
}

export async function deleteMedia(id: string) {
    const record = await db.select().from(mediaTable).where(eq(mediaTable.id, id)).get();
    if (!record) throw new Error('Media not found');

    if (record.storageProvider === 'R2' && s3Client) {
        const command = new DeleteObjectCommand({
            Bucket: record.bucket || r2Bucket,
            Key: record.key,
        });
        await s3Client.send(command);
    } else {
        // LOCAL
        const fullPath = join(process.cwd(), 'public', record.path);
        if (fs.existsSync(fullPath)) {
            await unlink(fullPath);
        }
    }

    await db.delete(mediaTable).where(eq(mediaTable.id, id));
    return true;
}

export async function renameMedia(id: string, newName: string) {
    const [record] = await db.update(mediaTable)
        .set({ name: newName, updatedAt: new Date() })
        .where(eq(mediaTable.id, id))
        .returning();
    return record;
}
