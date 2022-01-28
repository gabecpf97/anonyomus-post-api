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
exports.create_comment = [
    body('message', "Message must not be empty").trim().isLength({min: 1}).escape(),
    body('private', "Please use value provided").isBoolean().escape(),
    (req: Request, res: Response, next: NextFunction) => {
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