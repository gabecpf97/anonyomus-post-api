import { ObjectId } from "mongoose";

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
        if (theArr[i] === target)
            return i;
    }
    return -1;
}

export {storeFilenameArr, findIndex};