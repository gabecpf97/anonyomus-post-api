import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
import Post from "../models/Post";

/**
 * api call that create a user
 * return token and user's basic info
 */
exports.user_create = [
    body('username', "Username must be longer than 4 letter").trim().isLength({min: 4}).escape(),
    
    ,(req: Request, res: Response, next: NextFunction) => {

    }
]