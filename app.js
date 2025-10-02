const express = require("express");
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const cron = require("node-cron");
const fs = require('fs');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const { sendEmail } = require("./emailConfig");

const app = express();
const PORT = process.env.PORT || 4000;

let users = [];

// Function to send email with retry logic
async function sendWithRetry(email, subject, htmlContent, maxRetries = 2) {
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            let result = await sendEmail(email, subject, htmlContent, true); // HTML = true
            if (result === 'success') return { status: 'Success', error: '-' };
            else throw new Error('Unknown failure');
        } catch (err) {
            attempt++;
            if (attempt > maxRetries) {
                return { status: 'Failed', error: err.message };
            }
        }
    }
}

// Main function to send emails and generate report
async function sendEmails(users) {
    let report = [];

    for (const user of users) {
        const subject = "🚀 Welcome to Our SaaS Platform!";
        const htmlContent = `
        <div style="font-family: 'Arial', sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #1a73e8;">Your SaaS Dashboard Awaits!</h1>
                    <p style="font-size: 14px; color: #555;">Automated demo email for Outbox Labs Internship</p>
                </div>
                <p>Hi <strong>${user.split('@')[0]}</strong>,</p>
                <p>Welcome to our platform! This automated email is sent using <strong>Node.js</strong> and <strong>Node-Cron</strong>.</p>
                <h3 style="color: #1a73e8; margin-top: 20px;">What you can do next:</h3>
                <ul>
                    <li>Explore features of your dashboard</li>
                    <li>Check your analytics and reports</li>
                    <li>Connect with our support anytime</li>
                </ul>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://outbox.vc" target="_blank" style="background-color: #1a73e8; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit Dashboard</a>
                </div>
                <p>We’re excited to have you onboard. Cheers!<br/><strong>The Outbox Labs Team 🚀</strong></p>
                <hr style="border:none; border-top:1px solid #ddd; margin: 20px 0;"/>
                <small style="font-size: 12px; color: #999;">
                    You are receiving this email because you are part of the Outbox Labs Internship demo. This is an automated email.
                </small>
            </div>
        </div>
        `;

        const result = await sendWithRetry(user, subject, htmlContent, 2);
        const timestamp = new Date().toISOString();
        console.log(`Email status for ${user}: ${result.status} at ${timestamp}`);
        report.push({ email: user, status: result.status, timestamp, error_message: result.error });
    }

    // Save report CSV
    const json2csvParser = new Parser({ fields: ['email', 'status', 'timestamp', 'error_message'] });
    const csvData = json2csvParser.parse(report);
    fs.writeFileSync('email_report.csv', csvData);
    console.log('Email report saved to email_report.csv');
}

// Load emails from CSV
fs.createReadStream('leads.csv')
  .pipe(csv())
  .on('data', (row) => users.push(row.email))
  .on('end', () => {
    console.log('CSV file successfully loaded!');
    console.log(users);
    sendEmails(users); // Send immediately after loading
  });

// Cron job (runs every minute for testing)
cron.schedule('* * * * *', function() {
    console.log("-- RUNNING THE SCHEDULED CRON JOB --");
    sendEmails(users);
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
