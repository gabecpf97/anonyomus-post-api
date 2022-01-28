import { Schema, model, Document } from "mongoose";

const Comment = model('Comment', new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    op_name : {type: String, required: true},
    message: {type: String, required: true},
    date: {type: Date, required: true},
    belong: {type: Schema.Types.ObjectId, ref: 'Post', required: true},
    private: {type: Boolean, required: true},
    medias: [{type: String}],
    likes: [{type: Schema.Types.ObjectId, ref: 'User'}],
}));

export interface CommentType extends Document {
    user: string,
    op_name: string,
    message: string,
    date: Date,
    medias: string[],
    belong: Schema.Types.ObjectId,
    likes: Schema.Types.ObjectId[],
    private: Boolean,
}

export default Comment;