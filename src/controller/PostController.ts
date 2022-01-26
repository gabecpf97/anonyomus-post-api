import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
import { CallbackError } from "mongoose";
import Post, { PostType } from "../models/Post";