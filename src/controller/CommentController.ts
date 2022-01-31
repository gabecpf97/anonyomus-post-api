import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
import { CallbackError, ObjectId } from "mongoose";
import { map, parallel } from "async";
import { findIndex, storeFilenameArr } from "../functions/otherHelpers";
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
        getName((err: Error, theName: string) => {
            if (err)
                return next(err);
            const comment: CommentType = new Comment({
                user: (req.user as any)._id,
                op_name: theName,
                message: req.body.message,
                date: new Date,
                belong: req.params.id,
                private: req.body.private
            });
            if (req.files)
                comment.medias = storeFilenameArr((req.files as Express.Multer.File[]));
            comment.save((err: CallbackError) => {
                if (err)
                    return next(err);
                const update_list = (req.user as any).comments;
                update_list.push(comment._id);
                User.findByIdAndUpdate((req.user as any)._id, 
                    {comments: update_list}, {}, (err: CallbackError) => {
                    if (err)
                        return next(err);
                    res.send({success: true, id: comment._id});
                })
            });
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
            likes: theComment.likes,
            private: theComment.private
        } 
        res.send({theComment: show});
    })
}

// /**
//  * get comment list by latest
//  * reutrn array of comment id or error
//  */
const get_comments_default = (req: Request, res: Response, next: NextFunction) => {
    Post.findById(req.params.id).populate('comments').exec((err: CallbackError, thePost: PostType) => {
        if (err)
            return next(err);
        if (!thePost)
            return next(new Error('No such post'));
        const sorted: CommentType[] = (thePost.comments as any).sort((a: CommentType, b: CommentType) => (b.date > a.date));
        if (thePost.user === (req.user as any)._id)
            return res.send({theComments: sorted})
        for (let i: number = 0; i < (sorted?.length || 0); i++) {
            if (sorted[i].private) {
                sorted.splice(i, 1);
                i--;
            }
        }
        res.send({theComments: sorted});
    })
}

const commentController = {
    create_comment,
    get_comment,
    get_comments_default
}

export default commentController;