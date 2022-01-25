import express from "express";

const app = express();

app.get('/', (req, res, next) => {
    res.send('Hello world');
});

app.listen(5000, () => {
    console.log('server running on port 5000');
});