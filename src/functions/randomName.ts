import { CallbackError } from "mongoose";
import RandomName from "../models/RandomName";

const NAME_LENGTH = 5;

const getName = async (cb: Function) => {
    RandomName.count().exec((err: CallbackError, theCount: number) => {
        if (err)
            return cb(err);
        RandomName.findOne().skip(_getRandomNunm(0, theCount))
        .exec((err: CallbackError, theName: string) => {
            if (err)
                return cb(err);
            cb(null, theName + _fillSpace(_getRandomNunm(0, 99999)));
        })
    })
}

const _getRandomNunm = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min) + min);
}

const _fillSpace = (x: number) => {
    let result: string = "";
    const x_str: string = "" + x;
    for (let i: number = 0; i < NAME_LENGTH - x_str.length; i++) {
        result += "0";
    }
    return result + x;
}

export default getName;
