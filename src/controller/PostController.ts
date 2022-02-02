import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
import { CallbackError, ObjectId } from "mongoose";
import { map, parallel, reject } from "async";
import { findIndex, storeFilenameArr } from "../functions/otherHelpers";
import getName from "../functions/randomName";
import Genre, { GenreType } from "../models/Genre";
import Post, { PostType } from "../models/Post";
import User, { UserType } from "../models/User";
import Comment from "../models/Comment";

/**
 * api call that get the post's info
 * return post info or error
 */
const get_post = (req: Request, res: Response, next: NextFunction) => {
    Post.findById(req.params.id)
    .exec((err: CallbackError, thePost: PostType) => {
        if (err)
            return next(err);
        if (!thePost)
            return next(err);
        const show: any = {
            op_name: thePost.op_name,
            message: thePost.message,
            date: thePost.date,
            medias: thePost.medias,
            genre: thePost.genre,
            likes: thePost.likes?.length,
            comments: thePost.comments
        };
        res.send({thePost: show});
    })
}

/**
 * api call that get all post in that genre by specify order
 * return array of post id or error
 */
const get_posts_list = (req: Request, res: Response, next: NextFunction) => {
    Post.find({}, '_id').sort({date: -1})
    .exec((err: CallbackError, thePosts: PostType[]) => {
        if (err)
            return next(err);
        res.send({thePosts}); 
    });
}

/**
 * api call that get all post in that genre by specify order
 * return array of post id or error
 */
const get_popular_posts_list = (req: Request, res: Response, next: NextFunction) => {
    Post.find({}, '_id').sort({likes: -1}).sort({date: -1})
    .exec((err: CallbackError, thePosts: PostType[]) => {
        if (err)
            return next(err);
        res.send({thePosts}); 
    });
}

/**
 * api call that allow user to create a post
 * return success and post id or error
 */
const create_post = [
    body('message', "Message must not be empty").trim().isLength({min: 1}).escape(),
    check('genre').custom((value: string[]) => {
        if (value === undefined) {
            return true;
        } else {
            return new Promise((resolve: Function, reject: Function) => {
                map(value, (genreID: string, cb) => {
                    Genre.findById(genreID).exec(cb);
                }, (err, results) => {
                    if (err)
                        return reject("No such genre");
                    if (results && results.length) {
                        for (let i: number = 0; i < results.length; i++) {
                            if (!results[i])
                                return reject('No such genre');
                        }
                        return resolve(true);
                    }
                });
            });
        }
    }),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(errors.array());
        } else {
            if ((req as any).fileValidationError) {
                next(new Error((req as any).fileValidationError));
        } else {
            getName(async (err: CallbackError, theName: string) => {
                if (err)
                    return next(err);
                const post: PostType = new Post({
                    user: (req.user as any)._id,
                    op_name: theName,
                    message: req.body.message,
                    date: new Date,
                });
                if (req.body.genre)
                    post.genre = [...req.body.genre];
                if (req.files)
                    post.medias= storeFilenameArr((req.files as Express.Multer.File[]));
                parallel({
                    save_post: (callback) => {
                        post.save(callback);
                    },
                    save_user_post: (callback) => {
                        User.findByIdAndUpdate(((req.user as any)._id), 
                            {posts: (req.user as any).posts.concat(post._id)}, 
                            {}, callback);
                    },
                    save_genre: (callback) => {
                        if (post.genre) {
                            map(post.genre, (genreID: ObjectId, cb) => {
                                Genre.findById(genreID)
                                .exec((err: CallbackError, theGenre: GenreType) => {
                                    if (err)
                                        return next(err);
                                    if (!theGenre)
                                        return next(new Error('No such genre'));
                                    Genre.findByIdAndUpdate(theGenre._id,
                                        {posts: theGenre.posts?.concat(post._id)}, {}, cb);    
                                })
                            }, callback);
                        }
                    }
                }, (err: Error | undefined) => {
                    if (err)
                        return next(err);
                    res.send({success: true, post_id: post._id});
                });
            });
        }
        }
    }
]

/**
 * api call that allow post owner to delete the post
 * return success or error
 */
const delete_post = (req: Request, res: Response, next: NextFunction) => {
    Post.findById(req.params.id).exec(async (err: CallbackError, thePost: PostType) => {
        if (err)
            return next(err);
        if (!thePost)
            return next(new Error('No such post'));
        if (!(req.user as any)._id.equals(thePost.user)) {
            next(new Error('Not Authorize to delete this post'));
        } else {
            parallel({
                delete_liked: (callback) => {
                    if (thePost.likes) {
                        map(thePost.likes, (userID: ObjectId, cb) => {
                            User.findById(userID)
                            .exec((err: CallbackError, theUser: UserType) => {
                                if (err)
                                    return cb(err);
                                const updated_likes: ObjectId[] | undefined = theUser.liked_posts;
                                updated_likes?.splice(findIndex(updated_likes, thePost.id), 1);
                                User.findByIdAndUpdate(theUser.id, 
                                    {liked_posts: updated_likes}, {}, cb);
                            });
                        }, callback);
                    }
                },
                user_post_delete: (callback) => {
                    const update_list: ObjectId[] | undefined = (req.user as any).posts;
                    if (update_list) {
                        update_list.splice(findIndex(update_list, thePost.id), 1);
                        User.findByIdAndUpdate((req.user as any)._id, 
                            {posts: update_list}, {}, callback);
                    }
                },
                delete_comment: (callback) => {
                    if (thePost.comments) {
                        map(thePost.comments, (commentID: ObjectId, cb) => {
                            Comment.findByIdAndRemove(commentID, cb);
                        }, callback);
                    }
                },
                delete_from_genre: (callback) => {
                    if (thePost.genre) {
                        map(thePost.genre, (genreID: ObjectId, cb) => {
                            Genre.findById(genreID)
                            .exec((err: CallbackError, theGenre: GenreType) => {
                                if (err)
                                    return next(err);
                                if (!theGenre)
                                    return next(new Error('No such error'));
                                const update_posts: ObjectId[] | undefined = theGenre.posts;
                                update_posts?.splice(findIndex(update_posts, thePost._id), 1);
                                Genre.findByIdAndUpdate(theGenre._id, 
                                    {posts: update_posts}, {}, cb); 
                            });
                        }, callback);
                    }
                }
            }, (err: Error | undefined) => {
                if (err)
                    return next(err);
                Post.findByIdAndRemove(req.params.id, (err: CallbackError) => {
                    if (err)
                        return next(err);
                    res.send({success: true});
                });
            });
        }
    });
}

/**
 * api call that allow user to like a post
 * return success or error
 */
const like_post = (req: Request, res: Response, next: NextFunction) => {
    Post.findById(req.params.id).exec((err: CallbackError, thePost: PostType) => {
        if (err)
            return next(err);
        if (!thePost)
            return next(new Error('No such post'));
        if (thePost.likes?.includes((req.user as any)._id))
            return next(new Error('Already liked post'));
        parallel({
            update_post: (callback) => {
                const update_likes: ObjectId[] | undefined = thePost.likes;
                update_likes?.push((req.user as any)._id);
                Post.findByIdAndUpdate(req.params.id, {likes : update_likes},
                    {}, callback);
            },
            update_user: (callback) => {
                const update_liked: ObjectId[] | undefined = (req.user as any).liked_posts;
                update_liked?.push(thePost.id);
                User.findByIdAndUpdate((req.user as any)._id, {liked_posts: update_liked},
                {}, callback);
            }
        }, (err: Error | undefined) => {
            if (err)
                return next(err);
            res.send({success: true});
        })
    })
}

/**
 * api call that allow user to unlike a post
 * return success or error
 */
const unlike_post = (req: Request, res: Response, next: NextFunction) => {
    Post.findById(req.params.id).exec((err: CallbackError, thePost: PostType) => {
        if (err)
            return next(err);
        if (!thePost)
            return next(new Error('No such post'));
        if (!thePost.likes?.includes((req.user as any)._id))
            return next(new Error('You have not liked this post'));
        parallel({
            update_post: (callback) => {
                const update_likes: ObjectId[] | undefined = thePost.likes;
                update_likes?.splice(findIndex(update_likes, (req.user as any)._id), 1);
                Post.findByIdAndUpdate(req.params.id, {likes: update_likes}, 
                    {}, callback);
            },
            update_user: (callback) => {
                const update_liked: ObjectId[] | undefined = (req.user as any).liked_posts;
                update_liked?.splice(findIndex(update_liked, thePost._id), 1);
                User.findByIdAndUpdate((req.user as any)._id, {liked_posts: update_liked},
                    {}, callback);
            }
        }, (err: Error | undefined) => {
            if (err)
                return next(err);
            res.send({success: true});
        })
    });
}

const postController = {
    get_post,
    get_posts_list,
    get_popular_posts_list,
    create_post,
    like_post,
    unlike_post,
    delete_post
}

export default postController;