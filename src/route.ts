import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
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

// Post api calls
router.post('/post', auth, upload.array('media', 12), postController.create_post);
router.get('/posts', auth, postController.get_posts_list);
router.get('/posts/popular', auth, postController.get_popular_posts_list);
router.get('/post/:id', auth, postController.get_post);
router.put('/post/:id', auth, postController.like_post);
router.delete('/post/:id', auth, postController.delete_post);

export default router;