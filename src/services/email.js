const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: process.env.SENDGRID_USER,
    pass: process.env.SENDGRID_PASSWORD
  }
});

exports.sendEmail = (req, res) => {
  /***********
  req.body =
  {
    subject,
    message,
    toAddr,
    toName,
    fromAddr,
    fromName,
    redirectTo
  }
  ************/

  req.assert('toName', '\'To\' name cannot be blank').notEmpty();
  req.assert('toAddr', '\'To\' email is not valid').isEmail();
  req.assert('fromName', '\'From\' name cannot be blank').notEmpty();
  req.assert('fromAddr', '\'From\' email is not valid').isEmail();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.json({errmsg: "There was an error sending the email", redirectTo: req.body.redirectTo || '/'});
  }

  let mailOptions = {
    to: `${req.body.toName} <${req.body.toAddr}>`,
    from: `${req.body.fromName} <${req.body.fromAddr}>`,
    subject: req.body.subject
  };
  if (req.body.message) {
    mailOptions.text = req.body.message;
  }
  if (req.body.html) {
    mailOptions.html = req.body.html;
  }

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.log(err.message);
      return res.json({errmsg: err, redirectTo: req.body.redirectTo || '/'});
    }
    res.json({message: 'Success!', redirectTo: req.body.redirectTo || '/'});
  });
};
