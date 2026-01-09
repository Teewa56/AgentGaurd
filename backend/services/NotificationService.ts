import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export class NotificationService {
    private static transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    static async sendEmail(to: string, subject: string, body: string) {
        try {
            if (!process.env.SMTP_USER) {
                console.warn('Skipping email: SMTP_USER not set');
                return;
            }

            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"AgentGuard" <no-reply@agentguard.com>',
                to,
                subject,
                text: body,
            });
            console.log(`[EMAIL] Sent to ${to}`);
        } catch (error) {
            console.error('[EMAIL] Error sending email:', error);
        }
    }

    static async sendWebhook(url: string, payload: any) {
        try {
            // Using fetch (available in Node 18+) or axios
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error(`[WEBHOOK] Failed to send to ${url}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('[WEBHOOK] Error sending webhook:', error);
        }
    }
}
