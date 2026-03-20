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

import sharp from 'sharp';

export async function uploadMedia(file: File, type: FileType, userId?: string) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const now = new Date();
    const dateDir = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const ext = file.name.split('.').pop() || 'bin';
    const uuid = uuidv4();
    const fileName = `${uuid}.${ext}`;
    const typeDir = getDirByType(type);

    // key is the path within storage (relative)
    const key = `${typeDir}/${dateDir}/${fileName}`;

    let path = ''; 
    let thumbMedPath = null;
    let thumbLargePath = null;

    if (storageProvider === 'R2' && s3Client) {
        // Upload original
        await s3Client.send(new PutObjectCommand({
            Bucket: r2Bucket,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        }));
        path = r2PublicDomain ? `${r2PublicDomain}/${key}` : `/${r2Bucket}/${key}`;

        // Generate and upload thumbnails for images
        if (type === 'IMAGE' || type === 'GALLERY') {
             const medUuid = uuidv4();
             const medBuffer = await sharp(buffer).resize(800, 800, { fit: 'inside', withoutEnlargement: true }).toBuffer();
             const medKey = `${typeDir}/${dateDir}/${medUuid}.webp`;
             await s3Client.send(new PutObjectCommand({ Bucket: r2Bucket, Key: medKey, Body: medBuffer, ContentType: 'image/webp' }));
             thumbMedPath = r2PublicDomain ? `${r2PublicDomain}/${medKey}` : `/${r2Bucket}/${medKey}`;

             const largeUuid = uuidv4();
             const largeBuffer = await sharp(buffer).resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).toBuffer();
             const largeKey = `${typeDir}/${dateDir}/${largeUuid}.webp`;
             await s3Client.send(new PutObjectCommand({ Bucket: r2Bucket, Key: largeKey, Body: largeBuffer, ContentType: 'image/webp' }));
             thumbLargePath = r2PublicDomain ? `${r2PublicDomain}/${largeKey}` : `/${r2Bucket}/${largeKey}`;
        }
    } else {
        // LOCAL storage in public/upload
        const uploadDir = join(process.cwd(), 'public', 'upload', typeDir, dateDir);
        await mkdir(uploadDir, { recursive: true });

        const fullPath = join(uploadDir, fileName);
        await writeFile(fullPath, buffer);
        path = `/upload/${typeDir}/${dateDir}/${fileName}`;

        if (type === 'IMAGE' || type === 'GALLERY') {
            const medUuid = uuidv4();
            const medFileName = `${medUuid}.webp`;
            await sharp(buffer).resize(800, 800, { fit: 'inside', withoutEnlargement: true }).toFile(join(uploadDir, medFileName));
            thumbMedPath = `/upload/${typeDir}/${dateDir}/${medFileName}`;

            const largeUuid = uuidv4();
            const largeFileName = `${largeUuid}.webp`;
            await sharp(buffer).resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).toFile(join(uploadDir, largeFileName));
            thumbLargePath = `/upload/${typeDir}/${dateDir}/${largeFileName}`;
        }
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
        thumbnailMedium: thumbMedPath,
        thumbnailLarge: thumbLargePath,
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
