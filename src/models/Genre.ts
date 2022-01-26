import { Schema, model } from "mongoose";

const GenreSchema = new Schema({
    name: {type: String, required: true},
});

module.exports = model('Genre', GenreSchema);