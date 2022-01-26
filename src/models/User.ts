import { Schema, model } from "mongoose";

const UserSchema = new Schema({
    username: {type: String, required: true },
    email: {type: String, required: true},
    password: {type: String, required: true},
    date_join: {type: String, required: true},
    posts: [{type: Schema.Types.ObjectId, ref: 'Post'}],
    comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
    liked_post: [{type: Schema.Types.ObjectId, ref: 'Post'}],
    liked_comment: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
});

module.exports = model('User', UserSchema);