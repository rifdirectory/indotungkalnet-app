import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob | null;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Path for storage
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'presence');
        
        // Ensure directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Already exists or permission error
        }

        const fileName = `${uuidv4()}-${(file as any).name || 'attendance.jpg'}`;
        const filePath = join(uploadDir, fileName);
        
        await writeFile(filePath, buffer);

        // Return the public URL
        return NextResponse.json({ 
            success: true, 
            url: `/uploads/presence/${fileName}` 
        });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
