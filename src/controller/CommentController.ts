import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { CallbackError, ObjectId } from "mongoose";
import { map, parallel } from "async";
import { findIndex, sortListBy, storeFilenameArr } from "../functions/otherHelpers";
import getName from "../functions/randomName";
import Post, { PostType } from "../models/Post";
import User, { UserType } from "../models/User";
import Comment, { CommentType } from "../models/Comment";

/**
 * api call that create comment given post id
 * return successs and comment id or error
 */
const create_comment = [
    body('message', "Message must not be empty").trim().isLength({min: 1}).escape(),
    body('private', "Please use value provided").isBoolean().escape(),
    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(errors.array());
        if ((req as any).fileValidationError)
            return next((req as any).fileValidationError);
        getName(async (err: Error, theName: string) => {
            if (err)
                return next(err);
            // need more investigation on this underfined error
            const comment: CommentType = new Comment({
                user: req.body.id,
                op_name: theName,
                message: req.body.message,
                date: new Date,
                belong: req.params.id,
                private: req.body.private
            });
            if (req.files)
                comment.medias = storeFilenameArr((req.files as Express.Multer.File[]));
            parallel({
                save_comment: (callback) => {
                    comment.save(callback);
                },
                update_user: (callback) => {
                    const update_list: ObjectId[] | undefined = (req.user as any).comments;
                    update_list?.push(comment._id);
                    User.findByIdAndUpdate((req.user as any)._id, 
                        {comments: update_list}, {}, callback);
                },
                update_post: (callback) => {
                    Post.findById(req.params.id).exec((err: CallbackError, thePost: PostType) => {
                        if (err)
                            return next(err);
                        if (!thePost)
                            return next(err);
                        const update_post: ObjectId[] | undefined = thePost.comments;
                        update_post?.push(comment._id);
                        Post.findByIdAndUpdate(req.params.id, {comments: update_post}, 
                            {}, callback);
                    })
                }
            }, (err: Error | undefined) => {
                if (err)
                    return next(err);
                res.send({success: true, id: comment._id});
            })
        });
    }
]

/**
 * api call that get the comment given its id
 * return comment or error
 */
const get_comment = async (req: Request, res: Response, next: NextFunction) => {
    Comment.findById(req.params.id).exec((err: CallbackError, theComment: CommentType) => {
        if (err)
            return next(err);
        if (!theComment)
            return next(new Error('No such Comment'));
        const show: any = {
            op_name: theComment.op_name,
            message: theComment.message,
            date: theComment.date,
            belong: theComment.belong,
            medias: theComment.medias,
            likes: theComment.likes.length,
            private: theComment.private
        } 
        res.send({theComment: show});
    })
}

/**
 * api call that get comment list by latest
 * reutrn array of comment id or error
 */
const get_comments_list = (req: Request, res: Response, next: NextFunction) => {
    Post.findById(req.params.id).populate('comments').exec((err: CallbackError, thePost: PostType) => {
        if (err)
            return next(err);
        if (!thePost)
            return next(new Error('No such post'));
        let byPopular: boolean = false;
        if (req.query.by)
            byPopular = true;
        const isOwner = (thePost.user as any).equals((req.user as any)._id);
        const theComments = sortListBy((thePost.comments as any), byPopular, isOwner);
        res.send({theComments});
    });
}

/**
 * api call that allow user to like a comment
 * return success or error
 */
const comment_like = (req: Request, res: Response, next: NextFunction) => {
    Comment.findById(req.params.id).exec((err: CallbackError, theComment: CommentType) => {
        if (err)
            return next(err);
        if (!theComment)
            return next(new Error('No such comment'));
        if (findIndex(theComment.likes, (req.user as any)._id) > -1)
            return next(new Error('Already liked'));
        parallel({
            update_comment: (callback) => {
                const update_likes: ObjectId[] | undefined = theComment.likes;
                update_likes.push((req.user as any)._id);
                Comment.findByIdAndUpdate(req.params.id, {likes: update_likes}, 
                    {}, callback);
            },
            update_user: (callback) => {
                const update_liked: ObjectId[] | undefined = (req.user as any).liked_comments;
                update_liked?.push(theComment._id);
                User.findByIdAndUpdate((req.user as any)._id, {liked_comments: update_liked}, 
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
 * api call that allow user to unlike a comment
 * return success or error
 */
 const comment_unlike = (req: Request, res: Response, next: NextFunction) => {
    Comment.findById(req.params.id).exec((err: CallbackError, theComment: CommentType) => {
        if (err)
            return next(err);
        if (!theComment)
            return next(new Error('No such comment'));
        if (findIndex(theComment.likes, (req.user as any)._id) < 0)
            return next(new Error('Have not liked this comment'));
        parallel({
            update_comment: (callback) => {
                const update_likes: ObjectId[] | undefined = theComment.likes;
                update_likes?.splice(findIndex(update_likes, (req.user as any)._id));
                Comment.findByIdAndUpdate(req.params.id, {likes: update_likes}, 
                    {}, callback);
            },
            update_user: (callback) => {
                const update_liked: ObjectId[] | undefined = (req.user as any).liked_comments;
                update_liked?.splice(findIndex(update_liked, theComment._id));
                User.findByIdAndUpdate((req.user as any)._id, {liked_comments: update_liked}, 
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
 * api call that allow owner of comment or the post to delete the comment
 * return success or error
 */
const comment_delete = (req: Request, res: Response, next: NextFunction) => {
    Comment.findById(req.params.id).exec((err: CallbackError, theComment: CommentType) => {
        if (err)
            return next(err);
        if (!theComment)
            return next(new Error('No such comment'));
        Post.findById(theComment.belong).exec((err: CallbackError, thePost: PostType) => {
            if (err)
                return next(err);
            if (!thePost)
                return next(new Error('No such post'));
            if (!(theComment.user as any).equals((req.user as any)._id) ||
                !(thePost.user as any).equals((req.user as any)._id))
                return next(new Error('Not authorized to do this'));
            parallel({
                post_delete: (callback) => {
                    const update_comment: ObjectId[] | undefined = thePost.comments;
                    update_comment?.splice(findIndex(update_comment, theComment._id), 1);
                    Post.findByIdAndUpdate(thePost._id, {comments: update_comment},
                        {}, callback); 
                },
                user_delete: (callback) => {
                    const update_comment: ObjectId[] | undefined = (req.user as any).comments;
                    update_comment?.splice(findIndex(update_comment, theComment._id), 1);
                    User.findByIdAndUpdate((req.user as any)._id, {comments: update_comment}, 
                        {}, callback);
                },
                liked_delete: (callback) => {
                    map(theComment.likes, (userID, cb) => {
                        User.findById(userID).exec((err: CallbackError, theUser: UserType) => {
                            if (err)
                                return next(err);
                            const update_comment: ObjectId[] | undefined = theUser.comments;
                            update_comment?.splice(findIndex(update_comment, theComment._id), 1);
                            User.findByIdAndUpdate(userID, {comments: update_comment},
                                {}, cb);
                        });
                    }, callback);
                }
            }, (err: Error | undefined) => {
                if (err)
                    return next(err);
                Comment.findByIdAndRemove(theComment._id, (err: CallbackError) => {
                    if (err)
                        return next(err);
                    res.send({success: true});
                });
            });
        });
    });
}

const commentController = {
    create_comment,
    get_comment,
    get_comments_list,
    comment_like,
    comment_unlike,
    comment_delete
}

export default commentController;