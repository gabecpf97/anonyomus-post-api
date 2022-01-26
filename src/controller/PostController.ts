import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
import { CallbackError } from "mongoose";
import { storeFilenameArr } from "../functions/otherHelpers";
import getName from "../functions/randomName";
import Genre, { GenreType } from "../models/Genre";
import Post, { PostType } from "../models/Post";

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
                    post.save((err: CallbackError) => {
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