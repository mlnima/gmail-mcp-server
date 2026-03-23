import { google } from 'googleapis';
export class GmailService {
    gmail;
    constructor(auth) {
        this.gmail = google.gmail({ version: 'v1', auth });
    }
    async searchEmails(query, maxResults = 10) {
        const res = await this.gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults,
        });
        return res.data;
    }
    async readEmail(id) {
        const res = await this.gmail.users.messages.get({
            userId: 'me',
            id,
            format: 'full',
        });
        return res.data;
    }
    async createDraft(to, subject, bodyText, attachments) {
        let message = '';
        if (attachments && attachments.length > 0) {
            const boundary = 'boundary_mail_part';
            const messageParts = [
                `To: ${to}`,
                `Subject: ${subject}`,
                `Content-Type: multipart/mixed; boundary="${boundary}"`,
                '',
                `--${boundary}`,
                'Content-Type: text/plain; charset="utf-8"',
                '',
                bodyText,
            ];
            for (const att of attachments) {
                messageParts.push('', `--${boundary}`, `Content-Type: ${att.mimeType}; name="${att.filename}"`, `Content-Disposition: attachment; filename="${att.filename}"`, `Content-Transfer-Encoding: base64`, '', att.content);
            }
            messageParts.push('', `--${boundary}--`);
            message = messageParts.join('\n');
        }
        else {
            const messageParts = [
                `To: ${to}`,
                `Subject: ${subject}`,
                '',
                bodyText,
            ];
            message = messageParts.join('\n');
        }
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        const res = await this.gmail.users.drafts.create({
            userId: 'me',
            requestBody: {
                message: {
                    raw: encodedMessage,
                },
            },
        });
        return res.data;
    }
    async sendEmail(to, subject, bodyText, attachments) {
        let message = '';
        if (attachments && attachments.length > 0) {
            const boundary = 'boundary_mail_part';
            const messageParts = [
                `To: ${to}`,
                `Subject: ${subject}`,
                `Content-Type: multipart/mixed; boundary="${boundary}"`,
                '',
                `--${boundary}`,
                'Content-Type: text/plain; charset="utf-8"',
                '',
                bodyText,
            ];
            for (const att of attachments) {
                messageParts.push('', `--${boundary}`, `Content-Type: ${att.mimeType}; name="${att.filename}"`, `Content-Disposition: attachment; filename="${att.filename}"`, `Content-Transfer-Encoding: base64`, '', att.content);
            }
            messageParts.push('', `--${boundary}--`);
            message = messageParts.join('\n');
        }
        else {
            const messageParts = [
                `To: ${to}`,
                `Subject: ${subject}`,
                '',
                bodyText,
            ];
            message = messageParts.join('\n');
        }
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        const res = await this.gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        return res.data;
    }
    async deleteEmail(id) {
        const res = await this.gmail.users.messages.trash({
            userId: 'me',
            id,
        });
        return res.data;
    }
}
