import { Schema, model, Document } from "mongoose";

const Genre = model('Genre', new Schema({
    name: {type: String, required: true},
}));

export interface GenreType extends Document {
    name: string
}

export default Genre;