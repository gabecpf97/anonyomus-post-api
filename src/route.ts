import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
const userController = require('./controller/userController');
const router = express.Router();
const auth = passport.authenticate('jwt', {session: false});

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.send("<h1>This is backend of anoymous<h1>");
});

// User api calls
router.get('/user', auth, userController.get_user);
router.put('/user', auth, userController.edit_info);
router.post('/user/create', userController.user_create);
router.post('/user/log_in', userController.log_in);
router.put('/user/change_password', auth, userController.change_password);

export default router;