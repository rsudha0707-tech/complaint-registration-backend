require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5001;

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

// Send OTP to Email (Mock)
app.post('/api/auth/send-otp', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address required.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, otp);

  console.log(`\n==================================================`);
  console.log(`[EMAIL MOCK] To: ${email}`);
  console.log(`[EMAIL MOCK] Subject: Uttar Pradesh Police IOVS Verification OTP`);
  console.log(`[EMAIL MOCK] Message: Your 6-digit verification OTP is: ${otp}`);
  console.log(`==================================================\n`);

  res.json({ success: true, message: 'OTP sent successfully.' });
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
