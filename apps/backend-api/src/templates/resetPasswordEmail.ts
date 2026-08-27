export const resetPasswordEmailTemplate = (name: string, otp: string) => {
  return {
    subject: 'MusclesMaster AI - Password Reset OTP',
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 32px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #ea580c; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">
                MusclesMaster AI
              </h1>
            </div>

            <div style="padding: 32px; color: #1f2937;">
              <h2 style="margin-top: 0;">Password Reset Request</h2>

              <p>Hello ${name},</p>

              <p>
                We received a request to reset your password. Use the OTP below to continue:
              </p>

              <div style="margin: 24px 0; padding: 16px; text-align: center; background-color: #fff7ed; border: 1px solid #fdba74; border-radius: 8px;">
                <span style="font-size: 30px; font-weight: bold; letter-spacing: 8px; color: #ea580c;">
                  ${otp}
                </span>
              </div>

              <p>This OTP expires in <strong>10 minutes</strong>.</p>

              <p>
                If you did not request a password reset, you can safely ignore this email.
              </p>

              <p style="margin-bottom: 0;">
                Regards,<br />
                MusclesMaster AI Team
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
};