import { Schema, model, Document } from "mongoose";

const RandomName= model('RandomName', new Schema({
    name: {type: String, required: true}
}));

export interface RandomNameType extends Document {
    name: string
}

export default RandomName;