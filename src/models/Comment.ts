import { Schema, model } from "mongoose";

const CommentSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    op_name : {type: String, required: true},
    message: {type: String, required: true},
    date: {type: Date, required: true},
    medias: [{type: String}],
    belong: {type: Schema.Types.ObjectId, ref: 'Post', required: true},
    likes: [{type: Schema.Types.ObjectId, ref: 'User'}],
    private: {type: Boolean, required: true},
});

module.exports = model('Comment', CommentSchema);