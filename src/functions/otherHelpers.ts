import { ObjectId } from "mongoose";

const storeFilenameArr = (fileArr: Express.Multer.File[]) => {
    const result: string[] = [];
    for (let i: number = 0; i < fileArr.length; i++) {
        result.push(fileArr[i].filename);
    }
    return result;
}

const findIndex = (theArr: ObjectId[], target: ObjectId) => {
    for (let i: number = 0; i < theArr.length; i++) {
        if (theArr[i] === target)
            return i;
    }
    return -1;
}

export {storeFilenameArr, findIndex};