import { Request } from "express";
import multer from "multer";

// multer config for storing file in local
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: Function) => {
        cb(null, './uploads/');
    },
    filename: (req: Request, file: Express.Multer.File, cb: Function) => {
        cb(null, new Date().toISOString().replace(/[:.]/g, '-') + '-' + file.originalname);
    }
});

// multer filter function that specific file type to accept
const fileFilter: any = (req: Request, file: Express.Multer.File, cb: Function) => {
    if (
        file.mimetype === 'image/jpeg' ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/gif" ||    
        file.mimetype === "video/x-msvideo" ||    
        file.mimetype === "video/mp4" ||    
        file.mimetype === "video/webme"    
    ) {
        return cb(null, true);
    }
    (req as any).fileValidationError = "Please sent a correct format file";
    return cb(null, false);
}

const upload = multer({
    storage,
    limits: { fileSize: 50000000 },
    fileFilter
})

export default upload;