import express, { Request, Response, NextFunction } from "express";
import fs, { access } from "fs";
import { CallbackError } from "mongoose";
import passport from "passport";
import path from "path";
import upload from "./functions/multerFiles";
const userController = require('./controller/userController');
const postController = require('./controller/PostController');
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
// router.delete('/user', auth, userController.user_delete); // need testing

// Post api calls
router.post('/post', auth, upload.array('media', 12), postController.create_post);
router.get('/posts', auth, postController.get_posts_list);
router.get('/posts/popular', auth, postController.get_popular_posts_list);
router.get('/post/:id', auth, postController.get_post);
router.put('/post/:id/like', auth, postController.like_post);
router.put('/post/:id/unlike', auth, postController.unlike_post);
router.delete('/post/:id', auth, postController.delete_post);


// Media api call to get media
router.get('/media/:filename', (req: Request, res: Response, next: NextFunction) => {
    const mediaPath = path.join(__dirname, '../uploads/', req.params.filename);
    access(mediaPath, (fs as any).F_OK, (err: CallbackError) => {
        if (err)
            return next(err);
        res.sendFile(mediaPath);
    });
})

export default router;