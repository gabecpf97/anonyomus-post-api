import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
import { hash } from "bcrypt";
import passport from "passport";
import { sign } from "jsonwebtoken";
import Post from "../models/Post";
import User, { UserType } from "../models/User";

/**
 * api call that create a user
 * return token and user's basic info
 */
exports.user_create = [
    body('username', "Username must be longer than 4 letter").trim().isLength({min: 4}).escape(),
    check('username').custom(async (value: string) => {
        return new Promise((resolve, reject) => {
            User.findOne({username: value}).exec((err: any, theUser: UserType) => {
                if (!theUser)
                    return resolve(true);
                else 
                    return reject('Username already exists');
            });
        });
    }),
    body('email', "Please enter a valid email address").normalizeEmail().isEmail().escape(),
    check('email').custom(async (value: string) => {
        return new Promise((resolve, reject) => {
            User.findOne({username: value}).exec((err: any, theUser: UserType) => {
                if (!theUser)
                    return resolve(true);
                else 
                    return reject('Email already exists');
            });
        });
    }),
    body('password', 'Password must be longer than 6 character').trim().isLength({min: 6}).escape(),
    check('confirm_password', "Please enter the password again").escape()
    .custom((value: string, { req }) => {
        return value === req.body.password;
    }),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(errors.array());
        } else {
            hash(req.body.password, 10, (err: any, hashedPassword: string) => {
                if (err)
                    return next(err);
                const user: UserType = new User({
                    username: req.body.username,
                    email: req.body.email,
                    password: hashedPassword,
                    date_join: new Date,
                });
                user.save((err: any) => {
                    if (err)
                        return next(err);
                    const token = sign({user}, process.env.S_KEY || "");
                    res.send({ 
                        token, 
                        user : {
                            username: user.username, 
                            date_join: user.date_join
                        } 
                    });
                });
            })
        }
    }
]