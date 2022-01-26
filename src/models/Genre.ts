import { Schema, model } from "mongoose";

const Genre = model('Genre', new Schema({
    name: {type: String, required: true},
}));

export default Genre;