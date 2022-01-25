import { err } from "err";
import express, { Application, Request, Response, NextFunction } from "express";

const router = express.Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.send("<h1>This is backend of anoymous<h1>");
});

export default router;