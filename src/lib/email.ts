import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface TemplateData {
  [key: string]: string | number | boolean;
}

let transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null =
  null;

function getTransporter(): nodemailer.Transporter<SMTPTransport.SentMessageInfo> {
  if (!transporter) {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) ?? 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER ?? "",
        pass: process.env.SMTP_PASS ?? "",
      },
    };

    transporter = nodemailer.createTransport(config);
  }
  return transporter;
}

function renderTemplate(
  template: string,
  data: TemplateData
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = data[key];
    return value !== undefined ? String(value) : "";
  });
}

const emailTemplates = {
  share: (data: TemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 40px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #4f46e5; padding: 24px 32px; color: white; }
        .header h1 { margin: 0; font-size: 20px; }
        .content { padding: 32px; }
        .content p { color: #374151; line-height: 1.6; }
        .btn { display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; margin: 16px 0; }
        .footer { padding: 16px 32px; background: #f9fafb; color: #6b7280; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>{{appName}}</h1></div>
        <div class="content">
          <h2>{{senderName}} shared a document with you</h2>
          <p><strong>{{documentTitle}}</strong></p>
          <p>You've been granted <strong>{{permission}}</strong> access.</p>
          <a href="{{documentUrl}}" class="btn">Open Document</a>
          <p style="color:#6b7280;font-size:14px;">This link expires in 7 days.</p>
        </div>
        <div class="footer">© 2024 AI Docs Editor</div>
      </div>
    </body>
    </html>
  `,

  comment: (data: TemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 40px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #059669; padding: 24px 32px; color: white; }
        .header h1 { margin: 0; font-size: 20px; }
        .content { padding: 32px; }
        .content p { color: #374151; line-height: 1.6; }
        .comment-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 16px 0; border-radius: 0 6px 6px 0; }
        .btn { display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; margin: 16px 0; }
        .footer { padding: 16px 32px; background: #f9fafb; color: #6b7280; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>{{appName}}</h1></div>
        <div class="content">
          <h2>New comment on "{{documentTitle}}"</h2>
          <p><strong>{{commenterName}}</strong> {{actionText}}</p>
          <div class="comment-box"><p>{{commentText}}</p></div>
          <a href="{{documentUrl}}" class="btn">View Comment</a>
        </div>
        <div class="footer">© 2024 AI Docs Editor</div>
      </div>
    </body>
    </html>
  `,

  publish: (data: TemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 40px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #2563eb; padding: 24px 32px; color: white; }
        .header h1 { margin: 0; font-size: 20px; }
        .content { padding: 32px; }
        .content p { color: #374151; line-height: 1.6; }
        .doc-card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 16px 0; }
        .btn { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; margin: 16px 0; }
        .footer { padding: 16px 32px; background: #f9fafb; color: #6b7280; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>{{appName}}</h1></div>
        <div class="content">
          <h2>Your document has been published!</h2>
          <div class="doc-card">
            <h3 style="margin:0 0 8px;">{{documentTitle}}</h3>
            <p style="margin:0;color:#6b7280;">{{documentUrl}}</p>
          </div>
          <p>Your document is now live and can be accessed by anyone with the link.</p>
          <a href="{{documentUrl}}" class="btn">View Published Document</a>
        </div>
        <div class="footer">© 2024 AI Docs Editor</div>
      </div>
    </body>
    </html>
  `,
};

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transport = getTransporter();
    const recipients = Array.isArray(options.to)
      ? options.to.join(", ")
      : options.to;

    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: recipients,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}

export async function sendShareEmail(
  to: string,
  data: TemplateData
): Promise<boolean> {
  const html = renderTemplate(emailTemplates.share(data), data);
  return sendEmail({
    to,
    subject: `${data.senderName} shared "${data.documentTitle}" with you`,
    html,
  });
}

export async function sendCommentEmail(
  to: string,
  data: TemplateData
): Promise<boolean> {
  const html = renderTemplate(emailTemplates.comment(data), data);
  return sendEmail({
    to,
    subject: `${data.commenterName} commented on "${data.documentTitle}"`,
    html,
  });
}

export async function sendPublishEmail(
  to: string,
  data: TemplateData
): Promise<boolean> {
  const html = renderTemplate(emailTemplates.publish(data), data);
  return sendEmail({
    to,
    subject: `"${data.documentTitle}" has been published`,
    html,
  });
}

export async function verifyConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    return true;
  } catch {
    return false;
  }
}
