import { find, map, parallel } from "async";
import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { CallbackError, ObjectId } from "mongoose";
import { findIndex, sortListBy } from "../functions/otherHelpers";
import getName from "../functions/randomName";
import Genre, { GenreType } from "../models/Genre";
import Post, { PostType } from "../models/Post";

const get_genre_post = (req: Request, res: Response, next: NextFunction) => {
    Genre.findById(req.params.id)
    .exec((err: CallbackError, theGenre: GenreType) => {
        if (err)
            return next(err);
        if (!theGenre)
            return next(new Error('No such Genre'));
        let isPopular = false;
        if (req.query.popular)
            isPopular = true;
        const sorted = sortListBy(theGenre.posts, isPopular, true);
        res.send({name: theGenre.name, post_list: sorted});
    })
}

const create_genre = [
    body('name', "Name must not be empty").trim().isLength({min: 1}).escape(),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(errors.array());
        const genre: GenreType = new Genre({
            name: req.body.name,
        });
        genre.save((err: CallbackError) => {
            if (err)
                return next(err);
            res.send({success:true, id: genre._id});
        });
    }
]

const delete_genre = (req: Request, res: Response, next: NextFunction) => {
    Genre.findById(req.params.id).exec((err: CallbackError, theGenre: GenreType) => {
        if (err)
            return next(err);
        if (!theGenre)
            return next(new Error('No such genre'));
        parallel({
            remove_post: (callback) => {
                if (theGenre.posts) {
                    map(theGenre.posts, (postID: ObjectId, cb) => {
                        Post.findByIdAndUpdate(postID)
                        .exec((err: CallbackError, thePost: PostType) => {
                            if (err)
                                return next(err);
                            if (!thePost)
                                return next(new Error('No such post'));
                            const update_genre: ObjectId[] | undefined = thePost.genre;
                            update_genre?.splice(findIndex(update_genre, theGenre._id), 1);
                            Post.findByIdAndUpdate(thePost._id, {genre: update_genre},
                                {}, cb);
                        });
                    }, callback); 
                }
            },
            remove_genre: (callback) => {
                Genre.findByIdAndRemove(req.params.id, callback);
            }
        }, (err: Error | undefined) => {
            if (err)
                return next(err);
            res.send({success: true});
        });
    });
}

const genreController = {
    get_genre_post,
    create_genre,
    delete_genre,
}

export default genreController;