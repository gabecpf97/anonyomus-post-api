const storeFilenameArr = (fileArr: Express.Multer.File[]) => {
    const result: string[] = [];
    for (let i: number = 0; i < fileArr.length; i++) {
        result.push(fileArr[i].filename);
    }
    return result;
}

export {storeFilenameArr};