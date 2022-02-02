import express, { Request, Response, NextFunction } from "express";
import fs, { access } from "fs";
import { CallbackError } from "mongoose";
import passport from "passport";
import path from "path";
import upload from "./functions/multerFiles";
import commentController from "./controller/CommentController";
import postController from "./controller/PostController";
import userController from "./controller/userController";
import genreController from "./controller/genreController";
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
router.delete('/user', auth, userController.user_delete); // need testing

// Post api calls
router.post('/post', auth, upload.array('media', 12), postController.create_post);
router.get('/posts', auth, postController.get_posts_list);
router.get('/posts/popular', auth, postController.get_popular_posts_list);
router.get('/post/:id', auth, postController.get_post);
router.put('/post/:id/like', auth, postController.like_post);
router.put('/post/:id/unlike', auth, postController.unlike_post);
router.delete('/post/:id', auth, postController.delete_post);

// Comment api calls
router.post('/comment/:id', auth, upload.array('media', 12), commentController.create_comment);
router.get('/comment/:id', auth, commentController.get_comment);
router.put('/comment/:id/like', auth, commentController.comment_like);
router.put('/comment/:id/unlike', auth, commentController.comment_unlike);
router.delete('/comment/:id', auth, commentController.comment_delete);
router.get('/comments/:id', auth, commentController.get_comments_list);

// Genre api calls
router.post('/genre', auth, genreController.create_genre);
router.get('/genre/:id', auth, genreController.get_genre_post);
router.delete('/genre/:id', auth, genreController.delete_genre);

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