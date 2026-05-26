require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// In-memory store for OTPs
const otpStore = new Map();

// Multer config (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- AUTH ROUTES ---

// Send OTP to Email
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address required.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, otp);

  // Always log mock to console as a backup
  console.log(`\n==================================================`);
  console.log(`[EMAIL MOCK] To: ${email}`);
  console.log(`[EMAIL MOCK] Subject: Uttar Pradesh Police IOVS Verification OTP`);
  console.log(`[EMAIL MOCK] Message: Your 6-digit verification OTP is: ${otp}`);
  console.log(`==================================================\n`);

  // Check if SMTP configuration is set in .env
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
  const isSmtpConfigured = EMAIL_HOST && EMAIL_USER && EMAIL_PASS && 
                           EMAIL_USER !== 'your_email@gmail.com' && 
                           EMAIL_PASS !== 'your_gmail_app_password';

  if (isSmtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: parseInt(EMAIL_PORT) || 587,
        secure: parseInt(EMAIL_PORT) === 465, // true for 465, false for other ports
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"IOVS UP Police" <${EMAIL_USER}>`,
        to: email,
        subject: 'Uttar Pradesh Police IOVS Verification OTP',
        text: `Your 6-digit verification OTP for the Integrated Online Verification System is: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #d4af37; text-align: center;">Uttar Pradesh Police</h2>
            <h3 style="text-align: center;">Integrated Online Verification System (IOVS)</h3>
            <hr style="border: 0; border-top: 1px solid #e0e0e0;">
            <p>Dear Citizen,</p>
            <p>You have requested a secure verification OTP to log in to the IOVS Portal.</p>
            <div style="background-color: #f9f9f9; border: 1px dashed #d4af37; padding: 15px; text-align: center; margin: 20px 0; border-radius: 6px;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1a2a6c;">${otp}</span>
            </div>
            <p>Please enter this code on the verification screen. This OTP is valid for 10 minutes.</p>
            <p style="font-size: 12px; color: #777;">If you did not request this OTP, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2026 Uttar Pradesh Police. All rights reserved.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[EMAIL REAL] OTP sent successfully to ${email}`);
      return res.json({ success: true, message: 'OTP sent to your email.' });
    } catch (error) {
      console.error('[EMAIL REAL] Failed to send email via SMTP:', error);
      // Fall back to showing mock message (so it doesn't block local development/testing)
      return res.json({ 
        success: true, 
        message: 'OTP sent (fall back to mock console output due to mail error).' 
      });
    }
  }

  // If not configured, just respond that we sent it (mocked)
  res.json({ 
    success: true, 
    message: 'OTP sent (mock mode). Check your backend console logs for the code.' 
  });
});

// Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const storedOtp = otpStore.get(email);

  if (storedOtp && storedOtp === otp) {
    otpStore.delete(email); // Clear used OTP
    res.json({ success: true, message: 'OTP verified successfully.' });
  } else {
    res.status(400).json({ error: 'Invalid or expired OTP.' });
  }
});

// --- AI AGENT ROUTES ---

// Generate dynamic question depending on service type
app.get('/api/ai/generate-question', (req, res) => {
  const { serviceType } = req.query;
  
  let question = "Why do you require this verification at this time?";
  
  if (serviceType === 'Character Certificate') {
    question = "Which prospective employer, organization, or educational institution is requesting your Character Certificate, and what specific post or admission is it for?";
  } else if (serviceType === 'Tenant Verification') {
    question = "Please state the complete address of the rented premises, the monthly rent amount agreed, and the landlord's contact phone number.";
  } else if (serviceType === 'Police Verification') {
    question = "For what specific government department, public sector undertaking (PSU), or legal authority do you require this official Police Verification?";
  } else if (serviceType === 'Passport Verification') {
    question = "Please state your Passport Application File Number, and confirm whether you are applying for a Fresh Passport or a Re-issue/Renewal.";
  } else if (serviceType === 'Complaints') {
    question = "Who is the accused party/organization, and what are the specific dates, times, and financial/physical damages involved in this incident?";
  } else if (serviceType === 'Domestic Verification') {
    question = "What is the full name of the domestic helper/worker, their native address, and how long have they been or will they be employed by you?";
  } else if (serviceType === 'Employee Verification') {
    question = "What is the candidate's proposed job title, their department, and their previous employer's name for cross-reference?";
  }

  res.json({ question });
});

// --- APPLICATION ROUTES ---

// Submit Application
app.post('/api/applications/submit', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'aadhaarDoc', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      serviceType, email, firstName, middleName, lastName, 
      fatherName, motherName, mobile, dob, aadhaarNumber, 
      address, aiQuestion, aiAnswer 
    } = req.body;
    
    const files = req.files;

    if (!files || !files.photo || !files.signature || !files.aadhaarDoc) {
      return res.status(400).json({ error: 'All 3 documents are required.' });
    }

    if (supabaseUrl === 'https://placeholder.supabase.co') {
      return res.status(500).json({ error: 'Missing Supabase URL/Key in backend/.env' });
    }

    const applicationId = `IOVS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const uploadedPaths = {};

    const uploadFile = async (fileArray, folderName) => {
      const file = fileArray[0];
      const fileName = `${applicationId}/${folderName}-${Date.now()}-${file.originalname}`;
      
      const { data, error } = await supabase.storage
        .from('iovs_documents')
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (error) throw error;
      return data.path;
    };

    uploadedPaths.photo = await uploadFile(files.photo, 'photo');
    uploadedPaths.signature = await uploadFile(files.signature, 'signature');
    uploadedPaths.aadhaarDoc = await uploadFile(files.aadhaarDoc, 'aadhaarDoc');

    // Insert record with all extended fields
    const { data, error } = await supabase
      .from('iovs_applications')
      .insert([{
        application_id: applicationId,
        service_type: serviceType,
        first_name: firstName,
        middle_name: middleName || '',
        last_name: lastName,
        father_name: fatherName,
        mother_name: motherName,
        mobile_number: mobile,
        email_address: email,
        date_of_birth: dob,
        aadhaar_number: aadhaarNumber,
        address: address,
        ai_question: aiQuestion,
        ai_answer: aiAnswer,
        status: 'Pending Verification',
        photo_path: uploadedPaths.photo,
        signature_path: uploadedPaths.signature,
        aadhaar_doc_path: uploadedPaths.aadhaarDoc
      }]);

    if (error) throw error;

    res.json({ success: true, applicationId });

  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ error: 'Failed to process application. Are Supabase bucket/table created?' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
