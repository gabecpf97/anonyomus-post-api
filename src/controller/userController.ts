import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
import { compare, hash } from "bcrypt";
import passport from "passport";
import { sign } from "jsonwebtoken";
import User, { UserType } from "../models/User";
import { CallbackError } from "mongoose";

/**
 * api call that get the current user's info
 * return userinfo or error
 */
exports.get_user = (req: Request, res: Response, next: NextFunction) => {
    User.findById((req.user as any)._id, 'username email date_join posts comments liked_posts liked_comments')
    .exec((err: CallbackError, theUser: UserType) => {
        if (err)
            return next(err);
        res.send({theUser});
    })
}

/**
 * api call that create a user
 * return token and user's basic info
 */
exports.user_create = [
    body('username', "Username must be longer than 4 letter").trim().isLength({min: 4}).escape(),
    check('username').custom(async (value: string) => {
        return new Promise((resolve, reject) => {
            User.findOne({username: value}).exec((err: CallbackError, theUser: UserType) => {
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
            User.findOne({username: value}).exec((err: CallbackError, theUser: UserType) => {
                if (!theUser)
                    return resolve(true);
                else 
                    return reject('Email already exists');
            });
        });
    }),
    body('password', 'Password must be longer than 6 character').trim().isLength({min: 6}).escape(),
    check('confirm_password', "Please enter the same password again").escape()
    .custom((value: string, { req }) => {
        return value === req.body.password;
    }),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            next(errors.array());
        } else {
            hash(req.body.password, 10, (err: Error | undefined, hashedPassword: string) => {
                if (err)
                    return next(err);
                const user: UserType = new User({
                    username: req.body.username,
                    email: req.body.email,
                    password: hashedPassword,
                    date_join: new Date,
                });
                user.save((err: CallbackError) => {
                    if (err)
                        return next(err);
                    const token = sign({user}, process.env.S_KEY || "");
                    res.send({ 
                        token, 
                        theUser : {
                            username: user.username, 
                            date_join: user.date_join
                        } 
                    });
                });
            })
        }
    }
]

/**
 * api call that allow user to log in
 * return token and basic user info if success
 */
exports.log_in = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', {session: false}, (err: CallbackError, user: UserType, info: any) => {
        if (err || !user) {
            return next(new Error(info.message));
        }
        req.login(user, {session: false}, (err: CallbackError) => {
            if (err)
                return next(err);
            const token = sign({ user }, process.env.S_KEY || '');
            res.send({ 
                token, 
                theUser : {
                    username: user.username, 
                    date_join: user.date_join
                } 
            });
        });
    })(req, res, next);
}

/**
 * api call that allow user to change user info except password
 * return success and updated username or error
 */
exports.edit_info = [
    body('username', "Username must be longer than 4 letter").trim().isLength({min: 4}).escape(),
    check('username').custom(async (value: string, { req }) => {
        return new Promise((resolve, reject) => {
            User.findOne({username: value}).exec((err: CallbackError, theUser: UserType) => {
                if (!theUser || theUser._id.equals(req.user._id))
                    return resolve(true);
                else 
                    return reject('Username already exists');
            });
        });
    }),
    body('email', "Please enter a valid email address").normalizeEmail().isEmail().escape(),
    check('email').custom(async (value: string, { req }) => {
        return new Promise((resolve, reject) => {
            User.findOne({username: value}).exec((err: CallbackError, theUser: UserType) => {
                if (!theUser || theUser._id.equals(req.user._id))
                    return resolve(true);
                else 
                    return reject('Email already exists');
            });
        });
    }),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            next(errors.array());
        } else {
            User.findById((req.user as any)._id).exec((err: CallbackError, theUser: UserType) => {
                if (err)
                    return next(err);
                const newUser = {
                    username: req.body.username,
                    email: req.body.email,
                };
                User.findByIdAndUpdate((req.user as any)._id, newUser, {}, (err: CallbackError, updated : UserType) => {
                    if (err)
                        return next(err);
                    res.send({success: true, username: newUser.username});
                })
            })
        }
    }
]

/**
 * api call that allow user to update password
 * return success or errors
 */
exports.change_password = [
    body('password', "Password is empty").trim().isLength({min: 1}).escape(),
    check('password').custom((value: string, { req }) => {
        return new Promise((resolve, reject) => {
            User.findById((req.user as any)._id).exec((err: CallbackError, theUser: UserType) => {
                if (theUser) {
                    compare(value, theUser.password, (err: Error | undefined, result: boolean) => {
                        if (result)
                            return resolve(true);
                        else
                            return reject('Password incorrect');
                    })
                } else {
                    return reject('No such user');
                }
            })
        })
    }),
    body('new_password', 'Password must be longer than 6 character').trim().isLength({min: 6}).escape(),
    check('confirm_password', "Please enter the same password again").escape()
    .custom((value: string, { req }) => {
        return value === req.body.new_password;
    }),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            next(errors.array());
        } else {
            hash(req.body.new_password, 10, (err: Error | undefined, hashedPassword: string) => {
                if (err)
                    return next(err);
                User.findByIdAndUpdate((req.user as any)._id, {password : hashedPassword},
                    {}, (err: CallbackError, updated: UserType) => {
                        if (err)
                            return next(err);
                        res.send({success: true});
                });
            });
        }
    }
]

/**
 * api call that delete an user account given password
 * return success or error
 */
exports.user_delete = [
    body('password').custom((value: string, { req }) => {
        return new Promise((resolve, reject) => {
            compare(value, (req.user as any).password, (err: Error | undefined, result: boolean) => {
                if (err || !result) {
                    return reject('Incorrect password');
                }
                return resolve(true);
            });
        });
    }),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) 
            return next(errors.array());
        User.findByIdAndRemove((req.user as any)._id, (err: CallbackError) => {
            if (err)
                return next(err);
            res.send({success: true});
        })
    }
]