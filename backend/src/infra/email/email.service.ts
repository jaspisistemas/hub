import nodemailer from 'nodemailer';
import { environmentConfig } from '../../config/environment.config';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string | null = null;
  private isEthereal = false;

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    const config = environmentConfig.email;

    if (config.host && config.port && config.user && config.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });
      this.fromAddress = config.from || config.user;
      return this.transporter;
    }

    const testAccount = await nodemailer.createTestAccount();

    this.transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    this.isEthereal = true;
    this.fromAddress = `Jaspi Dev <${testAccount.user}>`;
    console.log('[EMAIL] Ethereal account created:', testAccount.user);

    return this.transporter;
  }

  async sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    const transporter = await this.getTransporter();
    const from = this.fromAddress || 'no-reply@example.com';

    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Verifique seu email',
      text: `Clique no link para verificar seu email: ${verificationUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Verifique seu email</h2>
          <p>Para ativar sua conta, clique no link abaixo:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>Se voce nao solicitou, ignore este email.</p>
        </div>
      `,
    });

    if (this.isEthereal) {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        console.log('[EMAIL] Preview URL:', preview);
      }
    }
  }
}
