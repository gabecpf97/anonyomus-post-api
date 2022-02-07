import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
import { compare, hash } from "bcrypt";
import passport from "passport";
import { sign } from "jsonwebtoken";
import User, { UserType } from "../models/User";
import { CallbackError } from "mongoose";
import { sendConfirm, sendEmailTo } from "../functions/otherHelpers";
import { SentMessageInfo } from "nodemailer";
import { randomBytes } from "crypto";

/**
 * api call that get the current user's info
 * return userinfo or error
 */
const get_user = (req: Request, res: Response, next: NextFunction) => {
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
const user_create = [
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
    check('password').trim().isLength({min: 6})
    .withMessage('Passowrd must be longer than 6 letter').custom(value => {
        return /\d/.test(value)
    }).withMessage('Password must inclue numbers'),
    check('confirm_password', "Please enter the same password again").escape()
    .custom((value: string, { req }) => {
        return value === req.body.password;
    }),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(errors.array());
        hash(req.body.password, 10, (err: Error | undefined, hashedPassword: string) => {
            if (err)
                return next(err);
            const user: UserType = new User({
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword,
                date_join: new Date,
                verified: false,
                confirm_code: Math.floor(Math.random() * (999999 - 100000) + 100000),
            });
            user.save(async (err: CallbackError) => {
                if (err)
                    return next(err);
                const info: SentMessageInfo = await sendConfirm(user.email, user.confirm_code);
                try {
                    res.send({success: true, id: user._id, msg: info.messageId});
                } catch  (err) {
                    return next(err);
                }
            });
        });
    }
]

/**
 * api call that confirm the code and save the user
 * return token and user info or error
 */
const confirm_user_code =[
    // might need to change this
    body('code', "Please enter code that was sent to email").trim().isLength({min: 6}).escape(),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(errors.array());
        User.findById(req.params.id).exec((err: CallbackError, theUser: UserType) => {
            if (err)
                return next(err);
            if (!theUser)
                return next(new Error('No such user'));
            if (theUser.verified)
                return next(new Error('User already verified'));
            if (req.body.code !== theUser.confirm_code)
                return next(new Error('Incorrect code'));
            User.findByIdAndUpdate(theUser._id, {verified: true, confirm_code: null}, 
                {}, (err: CallbackError) => {
                if (err)
                    return next(err);
                const token = sign({theUser}, process.env.S_KEY || "");
                res.send({ 
                    token, 
                    theUser : {
                        username: theUser.username, 
                        date_join: theUser.date_join
                    } 
                });
            });
        });
    }
] 


/**
 * api call that allow user to log in
 * return token and basic user info if success
 */
const log_in = async (req: Request, res: Response, next: NextFunction) => {
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
const edit_info = [
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
const change_password = [
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
    check('new_password').trim().isLength({min: 6})
    .withMessage('Passowrd must be longer than 6 letter').custom(value => {
        return /\d/.test(value)
    }).withMessage('Password must inclue numbers'),
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
const user_delete = [
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

/**
 * api call that email that have links to reset user's password
 * return success or error
 */
const user_forgot_password = [
    body('email', "Please enter an email address").normalizeEmail().isEmail().escape(),
    check('email').custom((value: string) => {
        return new Promise((resolves, rejects) => {
            User.findOne({email: value}).exec((err: CallbackError, theUser: UserType) => {
                if (err || !theUser)
                    return rejects('No such email');
                return resolves(true);
            })
        })
    }),
    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(errors.array());
        User.findOne({email: req.body.email}).exec((err: CallbackError, theUser: UserType) => {
            if (err)
                return next(err);
            if (!theUser)
                return next(new Error('No such user'));
            const reset_key = randomBytes(12).toString('hex');
            User.findByIdAndUpdate(theUser._id, {reset_key}, {}, 
            (err: CallbackError) => {
                if(err)
                    return next(err);
                const info: SentMessageInfo = sendEmailTo(req.body.email, reset_key);
                try {
                    res.send({success: true, msg: info.messageId});
                } catch (err) {
                    return next(err);
                }
            })
        })
    }
]

/**
 * api call that reset a user's password
 * return success or error
 */
const user_reset = [
    check('password').trim().isLength({min: 6})
    .withMessage('Passowrd must be longer than 6 letter').custom(value => {
        return /\d/.test(value)
    }).withMessage('Password must inclue numbers'),
    check('confirm_password', 'Please enter the same password again')
    .custom((value: string, { req }) => {
        return value === req.body.password;
    }),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(errors.array());
        User.findOne({reset_key: req.params.id}).exec((err: CallbackError, theUser: UserType) => {
            if (err)
                return next(err);
            if (!theUser)
                return next(new Error('No such user'));
            hash(req.body.password, 10, (err: Error | undefined, hashedPassword: string) => {
                if (err)
                    return next(err);
                User.findByIdAndUpdate(theUser._id, {password: hashedPassword},
                    {}, (err: CallbackError) => {
                    if (err)
                        return next(err);
                    res.send({success: true});
                });
            });
        });
    }
]

const userController = {
    user_create,
    confirm_user_code,
    log_in,
    get_user,
    edit_info,
    change_password,
    user_delete,
    user_forgot_password,
    user_reset
}

export default userController;