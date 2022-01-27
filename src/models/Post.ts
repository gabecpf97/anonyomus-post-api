import { Schema, model, Document } from "mongoose";

const Post = model('Post', new Schema({
    op_name: {type: String, required: true},
    message: {type: String, required: true},
    date: {type: Date, required: true},
    medias: [{type: String}],
    genre: [{type: Schema.Types.ObjectId, ref: 'Genre'}],
    likes: [{type: Schema.Types.ObjectId, ref: 'User'}],
    comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
}));

export interface PostType extends Document {
    op_name?: string,
    message: string,
    date: Date,
    medias?: string[],
    genre?: Schema.Types.ObjectId[],
    likes?: Schema.Types.ObjectId[],
    comments?: Schema.Types.ObjectId[],
}

export default Post;