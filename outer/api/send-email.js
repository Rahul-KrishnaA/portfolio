const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { name, company, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: process.env.FOLIO_EMAIL,
            pass: process.env.FOLIO_PASSWORD,
        },
    });

    try {
        await transporter.verify();
        const info = await transporter.sendMail({
            from: `"${name}" <${process.env.FOLIO_EMAIL}>`,
            to: 'rahulkrishna1662004@gmail.com',
            subject: `${name} <${email}>${company ? ` from ${company}` : ''} submitted a contact form`,
            text: message,
        });
        console.log({ info });
        res.json({ message: 'success' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};
