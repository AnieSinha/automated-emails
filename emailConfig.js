const nodemailer = require("nodemailer");

exports.sendEmail = async (to, subject, content, isHTML = false) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject
    };

    // Send HTML or plain text based on isHTML
    if (isHTML) {
        mailOptions.html = content;
    } else {
        mailOptions.text = content;
    }

    try {
        await transporter.sendMail(mailOptions);
        return "success";
    } catch (err) {
        console.log(`Error sending to ${to}:`, err.message);
        return "failure";
    }
};
