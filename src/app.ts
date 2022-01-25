import express, { Application, Request, Response, NextFunction } from "express";
import router from "./route";
const app = express();

app.use('/', router);

app.use((err: string[], req: Request, res: Response) => {
    console.log('here');
    // res.locals.message = err.message;
    // res.locals.error = req.app.get('env') === 'development' ? err : {};  
    // res.status(500);
    // if (err.message) {
    //     res.send({err : res.locals.message});
    // } else {
    //     res.send(err.msg_list);
    // }
    // res.send(err);
});

app.listen(5000, () => {
    console.log('server running on port 5000');
});