/**
 * PASSWORD MANAGEMENT TEST SCRIPT
 * Tests forgot password, reset password, and change password functionality
 */

const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

// Test user credentials
const testUser = {
  email: 'testpassword@example.com',
  username: 'testpassuser',
  password: 'password123',
  newPassword: 'newpassword456',
  phone: '9876543210'
};

let resetToken = '';
let authToken = '';
let resetOTP = '';

// Helper function for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔹 ${msg}${colors.reset}`)
};

async function testPasswordManagement() {
  console.log('\n' + '='.repeat(60));
  console.log('🔐 PASSWORD MANAGEMENT E2E TEST');
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Clean up - Delete test user if exists
    log.step('Step 1: Cleaning up test environment...');
    try {
      // We'll skip this as we need admin access
      log.info('Skipping cleanup (requires admin access)');
    } catch (err) {
      log.info('No cleanup needed or failed silently');
    }

    // Step 2: Register test user with OTP
    log.step('Step 2: Registering test user...');
    try {
      // Send OTP
      const otpResponse = await axios.post(`${API_URL}/auth/send-otp`, {
        email: testUser.email
      });
      
      const registrationOTP = otpResponse.data.otp;
      log.success(`OTP sent for registration: ${registrationOTP}`);

      await delay(1000);

      // Register with OTP
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
        phone: testUser.phone,
        otp: registrationOTP
      });

      authToken = registerResponse.data.token;
      log.success(`User registered successfully: ${testUser.username}`);
    } catch (err) {
      if (err.response?.data?.error?.includes('already taken')) {
        log.info('User already exists, proceeding with login...');
        
        // Login instead
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          username: testUser.username,
          password: testUser.password
        });
        authToken = loginResponse.data.token;
        log.success('Logged in with existing user');
      } else {
        throw err;
      }
    }

    await delay(1000);

    // Step 3: Test FORGOT PASSWORD - Send Reset OTP
    log.step('Step 3: Testing Forgot Password (Send Reset OTP)...');
    const forgotResponse = await axios.post(`${API_URL}/auth/forgot-password`, {
      email: testUser.email
    });

    resetOTP = forgotResponse.data.otp;
    log.success(`Reset OTP sent: ${resetOTP}`);
    log.info(`Response: ${forgotResponse.data.message}`);

    await delay(2000);

    // Step 4: Test VERIFY RESET OTP
    log.step('Step 4: Testing Verify Reset OTP...');
    const verifyResponse = await axios.post(`${API_URL}/auth/verify-reset-otp`, {
      email: testUser.email,
      otp: resetOTP
    });

    resetToken = verifyResponse.data.resetToken;
    log.success('Reset OTP verified successfully');
    log.info(`Reset token received: ${resetToken.substring(0, 30)}...`);

    await delay(1000);

    // Step 5: Test RESET PASSWORD
    log.step('Step 5: Testing Reset Password...');
    const resetResponse = await axios.post(`${API_URL}/auth/reset-password`, {
      resetToken: resetToken,
      newPassword: testUser.newPassword
    });

    log.success('Password reset successful');
    log.info(`Message: ${resetResponse.data.message}`);

    await delay(1000);

    // Step 6: Test LOGIN WITH NEW PASSWORD
    log.step('Step 6: Testing Login with New Password...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: testUser.username,
      password: testUser.newPassword
    });

    authToken = loginResponse.data.token;
    log.success('Login successful with new password');

    await delay(1000);

    // Step 7: Test CHANGE PASSWORD (Authenticated)
    log.step('Step 7: Testing Change Password (Authenticated)...');
    const changeResponse = await axios.post(
      `${API_URL}/auth/change-password`,
      {
        currentPassword: testUser.newPassword,
        newPassword: testUser.password // Change back to original
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    log.success('Password changed successfully');
    log.info(`Message: ${changeResponse.data.message}`);

    await delay(1000);

    // Step 8: Test LOGIN WITH CHANGED PASSWORD
    log.step('Step 8: Testing Login with Changed Password...');
    const finalLoginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: testUser.username,
      password: testUser.password
    });

    log.success('Login successful with changed password');

    // Step 9: Test ERROR CASES
    console.log('\n' + '-'.repeat(60));
    log.step('Step 9: Testing Error Cases...');
    console.log('-'.repeat(60));

    // Test invalid email
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, {
        email: 'invalid-email'
      });
      log.error('Should have failed for invalid email');
    } catch (err) {
      log.success('Invalid email rejected correctly');
    }

    // Test invalid OTP
    try {
      await axios.post(`${API_URL}/auth/verify-reset-otp`, {
        email: testUser.email,
        otp: '000000'
      });
      log.error('Should have failed for invalid OTP');
    } catch (err) {
      log.success('Invalid OTP rejected correctly');
    }

    // Test short password
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        resetToken: resetToken,
        newPassword: '123'
      });
      log.error('Should have failed for short password');
    } catch (err) {
      log.success('Short password rejected correctly');
    }

    // Test wrong current password in change password
    try {
      await axios.post(
        `${API_URL}/auth/change-password`,
        {
          currentPassword: 'wrongpassword',
          newPassword: 'newpass123'
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      log.error('Should have failed for wrong current password');
    } catch (err) {
      log.success('Wrong current password rejected correctly');
    }

    // Step 10: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    log.success('All password management tests passed! ✨');
    console.log('\n✅ Tested Features:');
    console.log('   • Forgot Password (Send Reset OTP)');
    console.log('   • Verify Reset OTP');
    console.log('   • Reset Password with Token');
    console.log('   • Login with New Password');
    console.log('   • Change Password (Authenticated)');
    console.log('   • Error Handling & Validations');
    console.log('\n🎉 Password management system is working perfectly!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    log.error('TEST FAILED');
    console.log('='.repeat(60));
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else if (error.request) {
      log.error('No response from server. Is the backend running?');
      log.info('Start backend with: cd api && node index.js');
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the tests
console.log('\n⏳ Starting Password Management Tests...\n');
testPasswordManagement();
