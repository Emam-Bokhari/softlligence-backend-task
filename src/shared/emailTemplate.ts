import {
  IContractorInvitationEmail,
  ICreateAccount,
  IResetPassword,
  ITeamMemberInvitationEmail,
  ITenantInvitationEmail,
} from "../types/emailTemplate";

const COLORS = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  primary: "#4F39F6",
  text: "#1E293B",
  secondary: "#475569",
};

const LOGO =
  process.env.APP_LOGO_URL ||
  "https://res.cloudinary.com/dphkhbunv/image/upload/v1795795341/logo-icon_yq86ss.png";

const baseLayout = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1.0"
/>

<title>${title}</title>

</head>

<body
style="
margin:0;
padding:0;
background:${COLORS.background};
font-family:Arial,Helvetica,sans-serif;
">

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="
background:${COLORS.background};
padding:45px 18px;
">

<tr>

<td align="center">

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="
max-width:620px;
background:${COLORS.surface};
border:1px solid ${COLORS.border};
border-radius:18px;
overflow:hidden;
">

<tr>

<td
align="center"
style="padding:36px 36px 24px;"
>

<img
src="${LOGO}"
width="72"
height="72"
alt="SassFlow"
style="
display:block;
width:72px;
height:72px;
max-width:72px;
margin:0 auto 12px;
border-radius:18px;
text-align:center;
box-shadow:0 4px 12px rgba(79, 57, 246, 0.15);
"
/>

<div
style="
font-family:Arial,Helvetica,sans-serif;
font-size:24px;
font-weight:800;
color:${COLORS.text};
letter-spacing:-0.5px;
text-align:center;
"
>
Sass<span style="color:${COLORS.primary};">Flow</span>
</div>

</td>

</tr>

<tr>

<td
style="
height:1px;
background:${COLORS.border};
"
></td>

</tr>

<tr>

<td
style="
padding:42px 38px;
font-size:16px;
line-height:1.8;
color:${COLORS.text};
"
>

${content}

</td>

</tr>

<tr>

<td
align="center"
style="
padding:28px;
background:${COLORS.background};
border-top:1px solid ${COLORS.border};
"
>

<p
style="
margin:0;
font-size:13px;
color:${COLORS.secondary};
"
>

This is an automated email from SassFlow.

</p>

<p
style="
margin-top:12px;
font-size:12px;
color:#6B7280;
"
>

© ${new Date().getFullYear()} SassFlow.
All rights reserved.

</p>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
`;

const otpBox = (otp: string | number) => `
<table
width="100%"
cellpadding="0"
cellspacing="0"
style="margin:38px 0;"
>

<tr>

<td align="center">

<div
style="
display:inline-block;
padding:18px 42px;
background:${COLORS.primary};
border-radius:14px;
color:#fff;
font-size:34px;
font-weight:700;
letter-spacing:10px;
"
>

${otp}

</div>

</td>

</tr>

</table>
`;

const securityCard = `
<table
width="100%"
cellpadding="0"
cellspacing="0"
style="
margin-top:34px;
background:${COLORS.background};
border:1px solid ${COLORS.border};
border-radius:12px;
">

<tr>

<td
style="
padding:20px 22px;
font-size:14px;
line-height:1.9;
color:${COLORS.secondary};
"
>

<b style="color:${COLORS.text};">

Security Tips

</b>

<br><br>

• This verification code expires in
<b style="color:${COLORS.text};">
3 minutes
</b>

<br>

• Never share your verification code.

<br>

• SassFlow will never ask for your OTP.

</td>

</tr>

</table>
`;

const createAccount = (values: ICreateAccount) => {
  const content = `
<h2
style="
margin:0 0 18px;
font-size:28px;
font-weight:700;
color:${COLORS.text};
"
>
Welcome, ${values.name}
</h2>

<p
style="
margin:0;
font-size:15px;
line-height:1.8;
color:${COLORS.secondary};
"
>
Welcome to <b style="color:${COLORS.text};">SassFlow</b>.

Thank you for creating your account.

To verify your email address and activate your account, please enter the verification code below.
</p>

${otpBox(values.otp)}

${securityCard}

<p
style="
margin-top:34px;
margin-bottom:0;
font-size:14px;
line-height:1.8;
color:${COLORS.secondary};
"
>
If you didn't create a SassFlow account, you can safely ignore this email.
No further action is required.
</p>
`;

  return {
    to: values.email,
    subject: "Verify your SassFlow account",
    html: baseLayout("Verify your SassFlow account", content),
  };
};

const resetPassword = (values: IResetPassword) => {
  const content = `
<h2
style="
margin:0 0 18px;
font-size:28px;
font-weight:700;
color:${COLORS.text};
"
>
Reset Your Password
</h2>

<p
style="
margin:0;
font-size:15px;
line-height:1.8;
color:${COLORS.secondary};
"
>
We received a request to reset the password for your
<b style="color:${COLORS.text};">SassFlow</b> account.

Use the verification code below to continue.
</p>

${otpBox(values.otp)}

${securityCard}

<p
style="
margin-top:34px;
margin-bottom:0;
font-size:14px;
line-height:1.8;
color:${COLORS.secondary};
"
>
If you didn't request a password reset, you can safely ignore this email.
Your account remains secure.
</p>
`;

  return {
    to: values.email,
    subject: "Reset your SassFlow password",
    html: baseLayout("Reset your SassFlow password", content),
  };
};

interface ISupportNotification {
  to: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}

const supportNotification = (values: ISupportNotification) => {
  const content = `
<h2
style="
margin:0 0 18px;
font-size:28px;
font-weight:700;
color:${COLORS.text};
"
>
New Support Request
</h2>

<p
style="
margin:0;
font-size:15px;
line-height:1.8;
color:${COLORS.secondary};
"
>
A new support request has been submitted through the
<b style="color:${COLORS.text};">SassFlow</b> platform.

The request details are shown below.
</p>

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="
margin-top:32px;
background:${COLORS.background};
border:1px solid ${COLORS.border};
border-radius:12px;
"
>

<tr>

<td style="padding:24px;">

<table
width="100%"
cellpadding="0"
cellspacing="0"
>

<tr>

<td
style="
padding:10px 0;
width:160px;
font-weight:700;
color:${COLORS.secondary};
"
>
Requester
</td>

<td
style="
padding:10px 0;
color:${COLORS.text};
"
>
${values.name}
</td>

</tr>

<tr>

<td
style="
padding:10px 0;
font-weight:700;
color:${COLORS.secondary};
"
>
Email
</td>

<td
style="
padding:10px 0;
color:${COLORS.text};
"
>
${values.email}
</td>

</tr>

<tr>

<td
style="
padding:10px 0;
font-weight:700;
color:${COLORS.secondary};
"
>
Subject
</td>

<td
style="
padding:10px 0;
color:${COLORS.text};
"
>
${values.subject}
</td>

</tr>

</table>

</td>

</tr>

</table>

<h3
style="
margin:34px 0 14px;
font-size:20px;
font-weight:700;
color:${COLORS.text};
"
>
Message
</h3>

<div
style="
background:${COLORS.background};
border:1px solid ${COLORS.border};
border-left:5px solid ${COLORS.primary};
border-radius:12px;
padding:24px;
font-size:15px;
line-height:1.9;
color:${COLORS.text};
white-space:pre-wrap;
word-break:break-word;
"
>
${values.message}
</div>

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="margin-top:38px;"
>

<tr>

<td align="center">

<a
href="mailto:${values.email}?subject=Re:${encodeURIComponent(values.subject)}"
style="
display:inline-block;
padding:16px 36px;
background:${COLORS.primary};
color:#FFFFFF;
text-decoration:none;
border-radius:10px;
font-size:15px;
font-weight:700;
"
>
Reply to ${values.name}
</a>

</td>

</tr>

</table>

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="
margin-top:36px;
background:${COLORS.background};
border:1px solid ${COLORS.border};
border-radius:12px;
"
>

<tr>

<td
style="
padding:20px 22px;
font-size:14px;
line-height:1.8;
color:${COLORS.secondary};
"
>

<b style="color:${COLORS.text};">
Internal Notification
</b>

<br><br>

This email was automatically generated after a user submitted a support request through SassFlow.

<br><br>

Please review the request and respond as soon as possible.

</td>

</tr>

</table>
`;

  return {
    to: values.to,
    subject: `SassFlow Support Request: ${values.subject}`,
    html: baseLayout("Support Request", content),
  };
};

interface IContactUsNotification {
  to: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}

const contactUsNotification = (values: IContactUsNotification) => {
  const content = `
<h2
style="
margin:0 0 18px;
font-size:28px;
font-weight:700;
color:${COLORS.text};
"
>
New Contact Us Message
</h2>

<p
style="
margin:0;
font-size:15px;
line-height:1.8;
color:${COLORS.secondary};
"
>
A new note/message has been submitted through the Contact Us form.
The sender and message details are shown below.
</p>

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="
margin-top:32px;
background:${COLORS.background};
border:1px solid ${COLORS.border};
border-radius:12px;
"
>

<tr>

<td style="padding:24px;">

<table
width="100%"
cellpadding="0"
cellspacing="0"
>

<tr>

<td
style="
padding:10px 0;
width:160px;
font-weight:700;
color:${COLORS.secondary};
"
>
Full Name
</td>

<td
style="
padding:10px 0;
color:${COLORS.text};
"
>
${values.name}
</td>

</tr>

<tr>

<td
style="
padding:10px 0;
font-weight:700;
color:${COLORS.secondary};
"
>
Email Address
</td>

<td
style="
padding:10px 0;
color:${COLORS.text};
"
>
${values.email}
</td>

</tr>

<tr>

<td
style="
padding:10px 0;
font-weight:700;
color:${COLORS.secondary};
"
>
Subject
</td>

<td
style="
padding:10px 0;
color:${COLORS.text};
"
>
${values.subject}
</td>

</tr>

</table>

</td>

</tr>

</table>

<h3
style="
margin:34px 0 14px;
font-size:20px;
font-weight:700;
color:${COLORS.text};
"
>
Message
</h3>

<div
style="
background:${COLORS.background};
border:1px solid ${COLORS.border};
border-left:5px solid ${COLORS.primary};
border-radius:12px;
padding:24px;
font-size:15px;
line-height:1.9;
color:${COLORS.text};
white-space:pre-wrap;
word-break:break-word;
"
>
${values.message}
</div>

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="margin-top:38px;"
>

<tr>

<td align="center">

<a
href="mailto:${values.email}?subject=Re:${encodeURIComponent(values.subject)}"
style="
display:inline-block;
padding:16px 36px;
background:${COLORS.primary};
color:#FFFFFF;
text-decoration:none;
border-radius:10px;
font-size:15px;
font-weight:700;
"
>
Reply to ${values.name}
</a>

</td>

</tr>

</table>

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="
margin-top:36px;
background:${COLORS.background};
border:1px solid ${COLORS.border};
border-radius:12px;
"
>

<tr>

<td
style="
padding:20px 22px;
font-size:14px;
line-height:1.8;
color:${COLORS.secondary};
"
>

<b style="color:${COLORS.text};">
Internal Notification
</b>

<br><br>

This email was automatically generated after a visitor or user submitted a message through the Contact Us form.

<br><br>

Please reply promptly to the sender's email.

</td>

</tr>

</table>
`;

  return {
    to: values.to,
    subject: `Contact Us: ${values.subject}`,
    html: baseLayout("Contact Us", content),
  };
};

const genericNotification = (values: {
  to: string;
  subject: string;
  text: string;
}) => {
  const content = `
<tr>
<td
style="
padding:20px 22px;
font-size:14px;
line-height:1.8;
color:${COLORS.secondary};
"
>

<b style="color:${COLORS.text};">
${values.subject}
</b>

<br><br>

${values.text}

</td>

</tr>
`;

  return {
    to: values.to,
    subject: values.subject,
    html: baseLayout(values.subject, content),
  };
};

const tenantInvitation = (values: ITenantInvitationEmail) => {
  const passwordDisplay = values.password || "12345678";
  const currencySymbol = values.currencySymbol || "$";

  const content = `
<tr>
  <td style="padding: 24px 28px; background-color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    
    <!-- Header Banner -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 6px 14px; background-color: #EEF2FF; color: #4F39F6; font-size: 12px; font-weight: 700; border-radius: 9999px; letter-spacing: 0.05em; text-transform: uppercase;">
        Tenant Invitation
      </span>
      <h1 style="margin: 12px 0 6px; font-size: 22px; font-weight: 700; color: #1E293B;">
        Welcome to Your New Home!
      </h1>
      <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">
        ${values.inviterName ? `<strong>${values.inviterName}</strong> has invited you` : "You have been invited"} to access your portal for <strong>${values.flatUnitName}</strong>.
      </p>
    </div>

    <!-- Property Card (Matching App Screen 1) -->
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px 18px; margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4F39F6; letter-spacing: 0.05em; margin-bottom: 4px;">
        Property & Flat Assignment
      </div>
      <div style="font-size: 17px; font-weight: 700; color: #1E293B; margin-bottom: 2px;">
        ${values.flatUnitName} - ${values.propertyName}
      </div>
      <div style="font-size: 13px; color: #64748B;">
        ${values.propertyAddress || "Assigned Property Access"}
      </div>
    </div>

    <!-- Credentials Section -->
    <div style="background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 14px; padding: 20px 22px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 14px; font-weight: 700; color: #3730A3;">
          🔐 Your Account Credentials
        </span>
      </div>
      <p style="margin: 0 0 14px; font-size: 13px; color: #3730A3; line-height: 1.5;">
        Your tenant account has been automatically provisioned. Use the details below to log in:
      </p>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #475569; width: 110px;">
            Email Address:
          </td>
          <td style="padding: 6px 0;">
            <code style="background-color: #E0E7FF; color: #3730A3; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 600; font-family: monospace;">
              ${values.email}
            </code>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #475569;">
            Password:
          </td>
          <td style="padding: 6px 0;">
            <code style="background-color: #E0E7FF; color: #3730A3; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 600; font-family: monospace;">
              ${passwordDisplay}
            </code>
          </td>
        </tr>
      </table>
      
      <p style="margin: 8px 0 0; font-size: 11px; color: #4F39F6;">
        💡 Tip: For security reasons, we strongly recommend changing your password after your first login.
      </p>
    </div>

    <!-- Tenancy Summary (Matching App Step 3 Summary) -->
    <div style="border: 1px solid #E2E8F0; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; background-color: #FFFFFF;">
      <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 14px; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px;">
        Tenancy & Lease Details
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
        <tr>
          <td style="padding: 7px 0; color: #64748B;">Flat:</td>
          <td align="right" style="padding: 7px 0; font-weight: 600; color: #0F172A;">${values.flatUnitName}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #64748B;">Monthly Rent:</td>
          <td align="right" style="padding: 7px 0; font-weight: 600; color: #0F172A;">${currencySymbol}${values.rentAmount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #64748B;">Lease Period:</td>
          <td align="right" style="padding: 7px 0; font-weight: 600; color: #0F172A;">${values.leaseStartDate} → ${values.leaseEndDate}</td>
        </tr>
        ${
          values.securityDeposit !== undefined && values.securityDeposit > 0
            ? `
        <tr>
          <td style="padding: 7px 0; color: #64748B;">Security Deposit:</td>
          <td align="right" style="padding: 7px 0; font-weight: 600; color: #0F172A;">${currencySymbol}${values.securityDeposit.toLocaleString()}</td>
        </tr>`
            : ""
        }
        ${
          values.advanceRent !== undefined && values.advanceRent > 0
            ? `
        <tr>
          <td style="padding: 7px 0; color: #64748B;">Advance Rent:</td>
          <td align="right" style="padding: 7px 0; font-weight: 600; color: #0F172A;">${currencySymbol}${values.advanceRent.toLocaleString()}</td>
        </tr>`
            : ""
        }
        ${
          values.depositProtectionScheme
            ? `
        <tr>
          <td style="padding: 7px 0; color: #64748B;">Deposit Scheme:</td>
          <td align="right" style="padding: 7px 0; font-weight: 600; color: #0F172A;">${values.depositProtectionScheme}</td>
        </tr>`
            : ""
        }
        ${
          values.personalMessage
            ? `
        <tr>
          <td colspan="2" style="padding-top: 12px; border-top: 1px dashed #E2E8F0;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; margin-bottom: 4px;">Personal Message:</div>
            <div style="font-style: italic; color: #334155; background-color: #F8FAFC; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #2563EB;">
              "${values.personalMessage}"
            </div>
          </td>
        </tr>`
            : ""
        }
      </table>
    </div>

    <!-- Security & Multitenant SaaS Note -->
    <p style="margin: 0; font-size: 12px; color: #94A3B8; text-align: center; line-height: 1.5;">
      🔒 As part of our secure tenant portal, your access is strictly scoped to <strong>${values.flatUnitName}</strong> and its associated property utilities.
    </p>

  </td>
</tr>
`;

  return {
    to: values.email,
    subject: `You've been invited to ${values.flatUnitName} - Tenant Portal Access`,
    html: baseLayout("Tenant Invitation", content),
  };
};

const contractorInvitation = (values: IContractorInvitationEmail) => {
  const passwordDisplay = values.password || "12345678";
  const tradesDisplay =
    values.trades && values.trades.length > 0
      ? values.trades.join(", ")
      : "General Contractor / Maintenance";
  const propertiesDisplay = values.propertiesScope || "All Assigned Work";

  const content = `
<tr>
  <td style="padding: 24px 28px; background-color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    
    <!-- Header Banner -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 6px 14px; background-color: #EEF2FF; color: #4F39F6; font-size: 12px; font-weight: 700; border-radius: 9999px; letter-spacing: 0.05em; text-transform: uppercase;">
        Professional Invitation
      </span>
      <h1 style="margin: 12px 0 6px; font-size: 22px; font-weight: 700; color: #1E293B;">
        Welcome to SassFlow!
      </h1>
      <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">
        ${values.inviterName ? `<strong>${values.inviterName}</strong>` : "SassFlow Team"} has invited you to join as a trusted professional.
      </p>
    </div>

    <!-- Credentials Section -->
    <div style="background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 14px; padding: 20px 22px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 14px; font-weight: 700; color: #3730A3;">
          🔐 Your Account Credentials
        </span>
      </div>
      <p style="margin: 0 0 14px; font-size: 13px; color: #3730A3; line-height: 1.5;">
        Your professional account has been provisioned. Use the credentials below to log in:
      </p>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #475569; width: 120px;">
            Email Address:
          </td>
          <td style="padding: 6px 0;">
            <code style="background-color: #E0E7FF; color: #3730A3; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 600; font-family: monospace;">
              ${values.email}
            </code>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #475569;">
            Password:
          </td>
          <td style="padding: 6px 0;">
            <code style="background-color: #E0E7FF; color: #3730A3; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 600; font-family: monospace;">
              ${passwordDisplay}
            </code>
          </td>
        </tr>
      </table>
      
      <p style="margin: 8px 0 0; font-size: 11px; color: #4F39F6;">
        💡 Tip: For security reasons, you can update your password at any time from your account settings.
      </p>
    </div>

    <!-- Assignment Summary -->
    <div style="border: 1px solid #E2E8F0; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; background-color: #FFFFFF;">
      <div style="font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 14px; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px;">
        Assignment & Scope Details
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
        <tr>
          <td style="padding: 7px 0; color: #475569;">Professional:</td>
          <td align="right" style="padding: 7px 0; font-weight: 600; color: #1E293B;">${values.contractorName || values.email}</td>
        </tr>
        ${
          values.inviterName
            ? `<tr>
          <td style="padding: 7px 0; color: #475569;">Invited By:</td>
          <td align="right" style="padding: 7px 0; font-weight: 600; color: #1E293B;">${values.inviterName}</td>
        </tr>`
            : ""
        }
        <tr>
          <td style="padding: 7px 0; color: #475569;">Trade / Specialty:</td>
          <td align="right" style="padding: 7px 0; font-weight: 600; color: #4F39F6;">${tradesDisplay}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #475569;">Scope:</td>
          <td align="right" style="padding: 7px 0; font-weight: 600; color: #1E293B;">${propertiesDisplay}</td>
        </tr>
        ${
          values.personalMessage
            ? `<tr>
          <td colspan="2" style="padding-top: 12px; border-top: 1px dashed #E2E8F0;">
            <div style="font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 700; margin-bottom: 4px;">Personal Note:</div>
            <div style="font-style: italic; color: #334155; background-color: #F8FAFC; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #4F39F6;">
              "${values.personalMessage}"
            </div>
          </td>
        </tr>`
            : ""
        }
      </table>
    </div>

    <!-- Security & Multitenant SaaS Note -->
    <p style="margin: 0; font-size: 12px; color: #94A3B8; text-align: center; line-height: 1.5;">
      🔧 You will receive notifications whenever maintenance requests or work orders are assigned to you.
    </p>

  </td>
</tr>
`;

  return {
    to: values.email,
    subject: `Invitation - ${values.inviterName ? `${values.inviterName} on ` : ""}SassFlow`,
    html: baseLayout("Invitation", content),
  };
};

const teamMemberInvitation = (values: ITeamMemberInvitationEmail) => {
  const content = `
<h2
style="
margin:0 0 18px;
font-size:24px;
font-weight:700;
color:${COLORS.text};
"
>
Welcome to the Team, ${values.name}!
</h2>

<p
style="
margin:0;
font-size:15px;
line-height:1.8;
color:${COLORS.secondary};
"
>
You have been added as a team member under <b style="color:${COLORS.text};">${values.tenantName}</b> on SassFlow.
You can now log in to your account using the credentials provided below:
</p>

<table
width="100%"
cellpadding="0"
cellspacing="0"
style="
margin:28px 0;
background:${COLORS.background};
border:1px solid ${COLORS.border};
border-radius:12px;
">
<tr>
<td style="padding:20px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
<tr>
<td style="padding:8px 0; color:${COLORS.secondary}; width:110px; font-weight:600;">Email:</td>
<td style="padding:8px 0; color:${COLORS.text}; font-weight:600;">${values.email}</td>
</tr>
<tr>
<td style="padding:8px 0; color:${COLORS.secondary}; font-weight:600;">Password:</td>
<td style="padding:8px 0; color:${COLORS.primary}; font-weight:700; font-family:monospace; font-size:16px;">${values.password}</td>
</tr>
</table>
</td>
</tr>
</table>

<div style="background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
  <p style="margin: 0; font-size: 13px; color: #3730A3; line-height: 1.6;">
    💡 <b>Security Tip:</b> For your security, we strongly recommend that you log in and change your password immediately from your profile settings.
  </p>
</div>

<p
style="
margin:0;
font-size:14px;
line-height:1.8;
color:${COLORS.secondary};
"
>
If you believe this invitation was sent to you by mistake, please contact your administrator.
</p>
`;

  return {
    to: values.email,
    subject: `Welcome to ${values.tenantName}'s team on SassFlow`,
    html: baseLayout("Team Member Invitation", content),
  };
};

export const emailTemplate = {
  createAccount,
  resetPassword,
  supportNotification,
  contactUsNotification,
  genericNotification,
  tenantInvitation,
  contractorInvitation,
  teamMemberInvitation,
};
