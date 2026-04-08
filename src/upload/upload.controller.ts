import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), '..', 'public', 'uploads');

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('upload')
export class UploadController {
    @Post('image')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const editorDir = join(UPLOAD_DIR, 'editor');
                    if (!existsSync(editorDir)) {
                        mkdirSync(editorDir, { recursive: true });
                    }
                    cb(null, editorDir);
                },
                filename: (_req, file, cb) => {
                    const unique = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
                    cb(null, `${unique}${extname(file.originalname)}`);
                },
            }),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
            fileFilter: (_req, file, cb) => {
                const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
                if (allowed.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new HttpException('Desteklenmeyen dosya tipi', HttpStatus.BAD_REQUEST), false);
                }
            },
        }),
    )
    uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new HttpException('Dosya bulunamadı', HttpStatus.BAD_REQUEST);
        // Return a URL that can be served statically
        const publicUrl = `/uploads/editor/${file.filename}`;
        return { url: publicUrl };
    }
}
