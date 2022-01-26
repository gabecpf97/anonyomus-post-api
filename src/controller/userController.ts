import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
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
            User.findOne({username: value}).exec((err, theUser: UserType) => {

            })
        })
    })
    ,(req: Request, res: Response, next: NextFunction) => {

    }
]