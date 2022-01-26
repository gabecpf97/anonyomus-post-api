import { Request } from "express";
import multer from "multer";

const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: Function) => {
        cb(null, './uploads/');
    },
    filename: (req: Request, file: Express.Multer.File, cb: Function) => {
        cb(null, new Date().toISOString().replace(/[:.]/g, '-') + '-' + file.originalname);
    }
});

const fileFilter: any = (req: Request, file: Express.Multer.File, cb: Function) => {
    if (
        file.mimetype === 'image/jpeg' ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg"    
    ) {
        return cb(null, true);
    }
    (req as any).fileValidationError = "Please sent a correct format file";
    return cb(null, false);
}

const upload = multer({
    storage,
    limits: { fileSize: 5000000 },
    fileFilter
})

export default upload;