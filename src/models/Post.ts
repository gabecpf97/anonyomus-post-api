import { Schema, model } from "mongoose";

const PostSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    op_name: {type: String, required: true},
    message: {type: String, required: true},
    medias: [{type: String}],
    date: {type: Date, required: true},
    likes: [{type: Schema.Types.ObjectId, ref: 'User'}],
    comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
});

module.exports = model('Post', PostSchema);