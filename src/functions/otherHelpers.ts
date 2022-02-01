import { ObjectId } from "mongoose";
import { CommentType } from "../models/Comment";

// Helper function that get a array of file and return an array of filename
const storeFilenameArr = (fileArr: Express.Multer.File[]) => {
    const result: string[] = [];
    for (let i: number = 0; i < fileArr.length; i++) {
        result.push(fileArr[i].filename);
    }
    return result;
}

// Helper function that find the index of from an array of object id
const findIndex = (theArr: ObjectId[], target: ObjectId) => {
    for (let i: number = 0; i < theArr.length; i++) {
        if ((theArr[i] as any).equals(target))
            return i;
    }
    return -1;
}

// Helper function that sort comment 
const sortCommentBy = (theArr: CommentType[], popular: boolean, owner: boolean) => {
    const sorted: CommentType[] = theArr.sort((a: CommentType, b: CommentType) => {
        if (popular) {
            if (a.likes.length > b.likes.length) {
                return -1;
            } else if (a.likes.length === b.likes.length) {
                if (a.date > b.date)
                    return -1;
                return 1;
            } else {
                return 1;
            }
        } else {
            if (a.date > b.date)
                return -1;
            return 1;
        }
    });
    const theComments: ObjectId[] = [];
    for (let i: number = 0; i < (sorted?.length || 0); i++) {
        if (!sorted[i].private || owner) {
            theComments.push(sorted[i]._id);
        }
    }
    return theComments;
}

export {storeFilenameArr, findIndex, sortCommentBy};