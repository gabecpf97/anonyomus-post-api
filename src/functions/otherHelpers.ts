import { ObjectId } from "mongoose";
import { createTransport } from "nodemailer";
require('dotenv').config();

// Helper function that get a array of file and return an array of filename
const storeFilenameArr = (fileArr: Express.Multer.File[]) => {
    const result: string[] = [];
    for (let i: number = 0; i < fileArr.length; i++) {
        result.push(fileArr[i].filename);
    }
    return result;
}

// Helper function that find the index of from an array of object id
const findIndex = (theArr: ObjectId[], target: ObjectId) => {
    for (let i: number = 0; i < theArr.length; i++) {
        if ((theArr[i] as any).equals(target))
            return i;
    }
    return -1;
}

// Helper function that sort comment 
const sortListBy = (theArr: Array<any> | undefined, popular: boolean, owner: boolean) => {
    const sorted: Array<any> | undefined = theArr?.sort((a: any, b: any) => {
        if (popular) {
            if (a.likes.length > b.likes.length) {
                return -1;
            } else if (a.likes.length === b.likes.length) {
                if (a.date > b.date)
                    return -1;
                return 1;
            } else {
                return 1;
            }
        } else {
            if (a.date > b.date)
                return -1;
            return 1;
        }
    });
    if (sorted) {
        const theList: ObjectId[] = [];
        for (let i: number = 0; i < (sorted?.length || 0); i++) {
            if (!sorted[i].private || owner) {
                theList.push(sorted[i]._id);
            }
        }
        return theList;
    }
}

// Nodemailer transporter setup
const transporter = createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_NAME,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

//Helper function that send email via nodemaielr
const sendEmailTo = async (userEmail: string, reset_key: string) => {
    const info = await transporter.sendMail({
        from: `"Anon app" <${process.env.EMAIL_NAME}>`,
        // to: 'gabephoe@gmail.com',
        to: userEmail,
        subject: "Anon app password reset",
        text: "Password reset",
        html: `<H2>Click to reset password</H2>
                <a href="http://localhost:5000/reset/${reset_key}">${reset_key}</a>`,
    });
    return info;
}

// Helper function that send email for confirmation when signing up
const sendConfirm = async (userEmail: string, confirm_code: string | undefined) => {
    console.log('here');
    const info = await transporter.sendMail({
        from: `"Anon App" <${process.env.EMAIL_NAME}>`,
        // to: 'gabephoe@gmail.com',
        to: userEmail,
        subject: "Anon app confirmatino code",
        text: "Account confirmation code",
        html: `<H2>You account confirmation code</H2>
                <p>${confirm_code}</p>`,
    });
    console.log('here2');
    return info;
}

export {storeFilenameArr, findIndex, sortListBy, sendEmailTo, sendConfirm};