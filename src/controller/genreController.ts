import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { CallbackError, ObjectId } from "mongoose";
import { findIndex, sortListBy } from "../functions/otherHelpers";
import getName from "../functions/randomName";
import Genre, { GenreType } from "../models/Genre";
import Post from "../models/Post";

const get_genre_post = (req: Request, res: Response, next: NextFunction) => {
    if (!req.query.name)
        return next(new Error('Please select an genre'));
    Genre.findOne({ name: req.query.name })
    .exec((err: CallbackError, theGenre: GenreType) => {
        if (err)
            return next(err);
        if (!theGenre)
            return next(new Error('No such Genre'));
        let isPopular = false;
        if (req.query.popular)
            isPopular = true;
        const sorted = sortListBy(theGenre.posts, isPopular, true);
        res.send({post_list: sorted});
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

const genreController = {
    get_genre_post,
    create_genre,
}

export default genreController;