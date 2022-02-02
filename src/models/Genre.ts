import { Schema, model, Document, Types } from "mongoose";

const Genre = model('Genre', new Schema({
    name: {type: String, required: true},
    posts: [{type: Schema.Types.ObjectId, required: true}],
}));

export interface GenreType extends Document {
    name: string,
    posts?: Schema.Types.ObjectId[]
}

export default Genre;