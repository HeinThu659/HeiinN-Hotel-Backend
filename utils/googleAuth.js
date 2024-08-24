import { google } from "googleapis";
import nodemailer from "nodemailer";
import 'dotenv/config.js';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const getAccessToken = async () => {
  try {
    const { token } = await oauth2Client.getAccessToken();
    return token;
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw new Error('Failed to get access token');
  }
};

export const createTransporter = async () => {
  try {
   
  const accessToken = await getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_SENDER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken,
    },
  }); 
  } catch (error) {
    console.error('Error creating transporter:', error);
    throw new Error('Error creating transporter');
  }
};
