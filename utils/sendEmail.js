const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const sendEmail = async (options, emailTemplate) => {
  // Set SendGrid API key
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // Read the HTML template file
  const templatePath = path.join(__dirname, `../templates/${emailTemplate}`);
  const htmlContent = fs.readFileSync(templatePath, 'utf8');

  // Compile the template with Handlebars
  const template = handlebars.compile(htmlContent);
  const htmlToSend = template({
    ...options,
    companyName: process.env.COMPANY_NAME,
    basePath: process.env.BASE_PATH
  });

  const msg = {
    to: options.email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME
    },
    subject: options.subject,
    html: htmlToSend
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('SendGrid error:', error);
    if (error.response) {
      console.error('SendGrid response body:', error.response.body);
    }
    throw error;
  }
};

module.exports = sendEmail;
