import { Schema, model, Document } from "mongoose";

const User = model('User', new Schema({
    username: {type: String, required: true },
    email: {type: String, required: true},
    password: {type: String, required: true},
    date_join: {type: Date, required: true},
    posts: [{type: Schema.Types.ObjectId, ref: 'Post'}],
    comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
    liked_posts: [{type: Schema.Types.ObjectId, ref: 'Post'}],
    liked_comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
    reset_key: {type: String},
}));

export interface UserType extends Document {
    username: string,
    email: string,
    password: string,
    date_join: Date,
    posts?: Schema.Types.ObjectId[],
    comments?: Schema.Types.ObjectId[],
    liked_posts?: Schema.Types.ObjectId[],
    liked_comments?: Schema.Types.ObjectId[],
    reset_key?: string,
}

export default User;