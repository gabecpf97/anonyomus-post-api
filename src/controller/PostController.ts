import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
import { CallbackError, ObjectId } from "mongoose";
import { map, parallel } from "async";
import { findIndex, storeFilenameArr } from "../functions/otherHelpers";
import getName from "../functions/randomName";
import Genre, { GenreType } from "../models/Genre";
import Post, { PostType } from "../models/Post";
import User, { UserType } from "../models/User";
import Comment, { CommentType } from "../models/Comment";

/**
 * api call that get the post's info
 * return post info or error
 */
exports.get_post = (req: Request, res: Response, next: NextFunction) => {
    Post.findById(req.params.id, 'op_name message date medias genre likes comments')
    .populate('genre').exec((err: CallbackError, thePost: PostType) => {
        if (err)
            return next(err);
        res.send({thePost});
    })
}

/**
 * api call that allow user to create a post
 * return success and post id or error
 */
exports.create_post = [
    body('message', "Message must not be empty").trim().isLength({min: 1}).escape(),
    check('genre').custom((value: string) => {
        if (value === undefined) {
            return true;
        } else {
            return new Promise((resolve: Function, rejects: Function) => {
                Genre.findOne({name: value}).exec((err: CallbackError, theGenre: GenreType) => {
                    if (err || !theGenre) {
                        return rejects('Not a genre, try using other if none fit')
                    }
                    return resolve(true);
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
                getName((err: CallbackError, theName: string) => {
                    if (err)
                        return next(err);
                    const post: PostType = new Post({
                        user: (req.user as any)._id,
                        op_name: theName,
                        message: req.body.message,
                        date: new Date,
                    });
                    if (req.body.genre)
                        post.genre = req.body.genre;
                    if (req.files)
                        post.medias= storeFilenameArr((req.files as Express.Multer.File[]));
                    parallel({
                        post: (callback) => {
                            post.save(callback);
                        },
                        user: (callback) => {
                            User.findByIdAndUpdate(((req.user as any)._id), 
                                {posts: (req.user as any).posts.concat(post._id)},
                                {}, callback);
                        }
                    }, (err) => {
                        if (err)
                            return next(err);
                        res.send({
                            success: true,
                            post_id: post._id
                        });
                    });
                });
            }
        }
    }
]

exports.delete_post = (req: Request, res: Response, next: NextFunction) => {
    Post.findById(req.params.id).exec((err: CallbackError, thePost: PostType) => {
        if (!(req.user as any)._id.equals(thePost.user)) {
            next(new Error('Not Authorize to delete this post'));
        } else {
            parallel({
                delete_post: (callback) => {
                    const update: PostType = new Post({
                        user: '0',
                        op_name: 'unknown',
                        message: 'Deleted Post',
                        date: thePost.date,
                        medias: [],
                        genre: [], 
                        likes: [],
                        comments: thePost.comments,
                        _id: thePost._id
                    });
                    Post.findByIdAndUpdate(req.params.id, update, {}, callback);
                },
                delete_liked: (callback) => {
                    if (thePost.likes) {
                        map(thePost.likes, (userID: ObjectId, cb) => {
                            User.findById(userID)
                            .exec((err: CallbackError, theUser: UserType) => {
                                if (err)
                                    return cb(err);
                                const updated_likes: ObjectId[] | undefined = theUser.liked_posts;
                                if (updated_likes) {
                                    updated_likes.splice(findIndex(updated_likes, thePost.id), 1);
                                    User.findByIdAndUpdate(theUser.id, 
                                        {liked_post: updated_likes}, {}, cb);
                                }
                            });
                        }, callback);
                    }
                },
                user_delete: (callback) => {
                    const update_list: ObjectId[] | undefined = (req.user as any).posts;
                    if (update_list) {
                        update_list.splice(findIndex(update_list, thePost.id), 1);
                        User.findByIdAndUpdate((req.user as any)._id, 
                            {posts: update_list}, {}, callback);
                    }
                }
            }, (err, results) => {
                if (err)
                    return next(err);
                res.send({success: true});
            });
        }
    });
}