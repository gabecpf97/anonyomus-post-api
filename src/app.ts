import express, { Application, Request, Response, NextFunction } from "express";
import router from "./route";
const app = express();

app.use('/', router);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(500);
    if (err.message)
        return res.send({err: err.message});
    res.send({err});
});

app.listen(5000, () => {
    console.log('server running on port 5000');
});