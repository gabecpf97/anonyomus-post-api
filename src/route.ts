import express, { Request, Response, NextFunction } from "express";
const userController = require('./controller/userController');
const router = express.Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.send("<h1>This is backend of anoymous<h1>");
});

// User api calls
router.post('/user/create', userController.user_create);
router.post('/user/log_in', userController.log_in);

export default router;