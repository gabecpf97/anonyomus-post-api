import express, { Application, Request, Response } from "express";
import router from "./route";
const app = express();

app.use('/', router);

app.use((err: any, req: Request, res: Response) => {
    res.locals.message = err.message;
});

app.listen(5000, () => {
    console.log('server running on port 5000');
});