import { map, parallel } from "async";
import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
import { CallbackError, ObjectId } from "mongoose";
import { findIndex, sortListBy } from "../functions/otherHelpers";
import Genre, { GenreType } from "../models/Genre";
import Post, { PostType } from "../models/Post";

/**
 * api call that get array of genre name
 * return array of genre name sorted in alphabetical order or error
 */
const get_genre_list = (req: Request, res: Response, next: NextFunction) => {
    Genre.find({}, 'name').exec((err: CallbackError, theGenres: GenreType[]) => {
        if (err)
            return next(err);
        theGenres.sort((a: GenreType, b: GenreType) => {
            return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
        })
        res.send({theGenres});
    })
}

/**
 * api call that get all post of the specified genre
 * return array of post sorted in time or likes 
 *  or error
 */
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

/**
 * api call that create genre given name
 * return success and its id or error
 */
const create_genre = [
    body('name', "Name must not be empty").trim().isLength({min: 1}).escape(),
    check('name').custom((value: string) => {
        return new Promise((resolve, reject) => {
            Genre.findOne({name: value.toLowerCase()})
            .exec((err: CallbackError, theGenre: GenreType) => {
                if (err || theGenre)
                    return reject('Genre already exists');
                return resolve(true);
            });
        })
    }),
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

/**
 * api call that delete a genre and remove this genre from post that contain it
 * return success or error
 */
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
    get_genre_list,
    get_genre_post,
    create_genre,
    delete_genre,
}

export default genreController;