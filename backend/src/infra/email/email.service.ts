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
      subject: 'Ative sua conta no Venda Mais',
      text: `Clique no link para verificar seu email: ${verificationUrl}`,
      html: `
        <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
  <table align="center" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.08);">

    <!-- HEADER -->
    <tr>
      <td style="background:#0099FF;padding:30px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:26px;">
          Venda Mais
        </h1>
        <p style="color:#e8f6ff;margin:8px 0 0;font-size:14px;">
          Ativação de conta
        </p>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="padding:35px;">
        <h2 style="margin-top:0;color:#333;">
          Bem-vindo ao Venda Mais 🚀
        </h2>

        <p style="color:#555;font-size:15px;line-height:1.6;">
          Sua conta foi criada com sucesso. Para começar a utilizar a plataforma,
          confirme seu email clicando no botão abaixo.
        </p>

        <!-- BUTTON -->
        <div style="text-align:center;margin:35px 0;">
          <a href="${verificationUrl}" 
          style="
            background:#0099FF;
            color:#ffffff;
            text-decoration:none;
            padding:14px 34px;
            font-size:16px;
            border-radius:6px;
            display:inline-block;
            font-weight:bold;
          ">
            Ativar minha conta
          </a>
        </div>

        <p style="color:#666;font-size:14px;">
          Se o botão não funcionar, copie e cole este link no seu navegador:
        </p>

        <p style="
          background:#f4f6f8;
          padding:10px;
          border-radius:4px;
          font-size:12px;
          word-break:break-all;
          color:#0099FF;
        ">
          ${verificationUrl}
        </p>

        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">

        <p style="color:#999;font-size:12px;margin:0;">
          Se você não criou uma conta no Venda Mais, apenas ignore este email.
        </p>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background:#fafafa;padding:20px;text-align:center;">
        <p style="font-size:12px;color:#999;margin:0;">
          © 2026 Venda Mais • Todos os direitos reservados
        </p>
      </td>
    </tr>

  </table>
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
