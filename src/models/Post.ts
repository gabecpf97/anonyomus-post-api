import { Schema, model } from "mongoose";

const Post = model('Post', new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    op_name: {type: String, required: true},
    message: {type: String, required: true},
    date: {type: Date, required: true},
    genre: [{type: Schema.Types.ObjectId, ref: 'Genre'}],
    medias: [{type: String}],
    likes: [{type: Schema.Types.ObjectId, ref: 'User'}],
    comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
}));

export default Post;