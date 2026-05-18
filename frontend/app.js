const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Module Navigation
function switchModule(moduleName) {
  // Update buttons
  $$('.module-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  // Update views
  $$('.module-view').forEach(view => view.style.display = 'none');
  $(`#module-${moduleName}`).style.display = 'block';
  
  // Close open citizen modals if switching
  closeApplication();
}

// Active Citizen Session Variables
let selectedService = '';
let currentEmail = ''; 

// Send OTP to Email (Gate)
async function mockSendOTP() {
  const email = $('#email-input').value;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if(!emailRegex.test(email)) {
    alert("Please enter a valid email address.");
    return;
  }
  
  const btn = $('#btn-send-otp');
  btn.textContent = "Sending OTP...";
  btn.disabled = true;

  try {
    const res = await fetch('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    
    if (res.ok) {
      currentEmail = email;
      btn.style.display = 'none';
      $('#otp-area').style.display = 'block';
      alert('OTP sent successfully! Check your backend terminal for the 6-digit mock OTP.');
    } else {
      alert(data.error || "Failed to send OTP");
      btn.textContent = "Send OTP";
      btn.disabled = false;
    }
  } catch(err) {
    alert("Error communicating with backend. Is the Node server running?");
    btn.textContent = "Send OTP";
    btn.disabled = false;
  }
}

// Verify OTP (Gate)
async function mockVerifyOTP() {
  const otp = $('#otp-input').value;
  if(otp.length !== 6 || isNaN(otp)) {
    alert("Please enter a valid 6-digit OTP.");
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail, otp })
    });
    const data = await res.json();

    if (res.ok) {
      // Transition out of the Gate and into the Dashboard Grid
      $('#citizen-gate').style.display = 'none';
      $('#citizen-dashboard').style.display = 'block';
      $('#user-email-display').textContent = currentEmail;
    } else {
      alert(data.error || "Invalid OTP");
    }
  } catch(err) {
    alert("Error communicating with backend.");
  }
}

// Google Login Mock
function loginWithGoogle() {
  const width = 500;
  const height = 600;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  
  window.open('mock-google-login.html', 'Google Login', `width=${width},height=${height},left=${left},top=${top}`);
}

window.onGoogleLoginSuccess = function(email) {
  currentEmail = email;
  // Transition out of the Gate and into the Dashboard Grid
  $('#citizen-gate').style.display = 'none';
  $('#citizen-dashboard').style.display = 'block';
  $('#user-email-display').textContent = currentEmail;
};

// Logout Citizen
function logoutCitizen() {
  currentEmail = '';
  $('#email-input').value = '';
  $('#otp-input').value = '';
  $('#otp-area').style.display = 'none';
  $('#btn-send-otp').style.display = 'block';
  $('#btn-send-otp').textContent = "Send OTP";
  $('#btn-send-otp').disabled = false;
  
  // Transition back to the Gate
  $('#citizen-dashboard').style.display = 'none';
  $('#citizen-gate').style.display = 'block';
}

// Open Application Modal (From Dashboard Grid)
function openApplication(serviceName) {
  selectedService = serviceName;
  $('#form-title').textContent = `${serviceName} - Registration Form`;
  $('#citizen-application-area').style.display = 'block';
  
  // Reset form inputs
  $('#verification-form').reset();
  
  // Load AI Agent dynamic question
  fetchAIQuestion();
}

function closeApplication() {
  $('#citizen-application-area').style.display = 'none';
}

// Fetch dynamic AI question based on service type
async function fetchAIQuestion() {
  const textContainer = $('#ai-question-text');
  textContainer.textContent = "Generating custom agent question...";
  
  try {
    const res = await fetch(`http://localhost:3000/api/ai/generate-question?serviceType=${encodeURIComponent(selectedService)}`);
    const data = await res.json();
    if(res.ok) {
      textContainer.textContent = data.question;
    } else {
      textContainer.textContent = "Why do you require this verification at this time?";
    }
  } catch(err) {
    textContainer.textContent = "Why do you require this verification at this time?";
  }
}

// Submit Application
async function submitApplication(e) {
  e.preventDefault();
  
  const firstName = $('#app-firstname').value;
  const middleName = $('#app-middlename').value;
  const lastName = $('#app-lastname').value;
  const fatherName = $('#app-fathername').value;
  const motherName = $('#app-mothername').value;
  const mobile = $('#app-mobile').value;
  const dob = $('#app-dob').value;
  const aadhaarNumber = $('#app-aadhaar').value;
  const address = $('#app-address').value;
  const aiQuestion = $('#ai-question-text').textContent;
  const aiAnswer = $('#app-ai-answer').value;

  const photoFile = $('#app-photo').files[0];
  const signatureFile = $('#app-signature').files[0];
  const aadhaarDocFile = $('#app-aadhaar-doc').files[0];
  
  const formData = new FormData();
  formData.append('serviceType', selectedService);
  formData.append('email', currentEmail);
  formData.append('firstName', firstName);
  formData.append('middleName', middleName);
  formData.append('lastName', lastName);
  formData.append('fatherName', fatherName);
  formData.append('motherName', motherName);
  formData.append('mobile', mobile);
  formData.append('dob', dob);
  formData.append('aadhaarNumber', aadhaarNumber);
  formData.append('address', address);
  formData.append('aiQuestion', aiQuestion);
  formData.append('aiAnswer', aiAnswer);

  formData.append('photo', photoFile);
  formData.append('signature', signatureFile);
  formData.append('aadhaarDoc', aadhaarDocFile);

  const btn = $('button[type="submit"]');
  btn.textContent = "Submitting...";
  btn.disabled = true;

  try {
    const res = await fetch('http://localhost:3000/api/applications/submit', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (res.ok) {
      alert(`Application submitted successfully!\nReference ID: ${data.applicationId}\nStatus: Verification Pending.`);
      closeApplication();
    } else {
      alert(data.error || "Submission failed. Please check Supabase configuration.");
    }
  } catch (err) {
    alert("Error connecting to server. Is the backend running?");
  } finally {
    btn.textContent = "Submit Application";
    btn.disabled = false;
  }
}
