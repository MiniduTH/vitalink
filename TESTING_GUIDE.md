# 🚀 Quick Test Guide - Firebase Authentication

## Prerequisites Check

Before testing, you need:

-   ✅ Node.js installed
-   ✅ npm dependencies installed (`npm install`)
-   ⏳ Firebase project configured
-   ⏳ Environment variables set

---

## Option 1: Test with Mock Mode (No Firebase Setup Required)

If you want to test the UI without setting up Firebase, we can temporarily mock the Firebase calls.

**Just run:**

```bash
npm run dev
```

Then open http://localhost:3000/auth/login

The forms will work, but actual authentication will fail (expected without Firebase config).

---

## Option 2: Full Firebase Test (Recommended)

### Step 1: Create Firebase Project (5 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Add project" or "Create a project"
3. Project name: `vitalink-test` (or your choice)
4. Disable Google Analytics (optional for testing)
5. Click "Create project"
6. Wait for setup to complete

### Step 2: Enable Authentication

1. In your Firebase project, click **"Authentication"** in left sidebar
2. Click **"Get started"**
3. Click **"Email/Password"** under Sign-in providers
4. Toggle **"Enable"** on
5. Click **"Save"**
6. Click **"Google"** provider
7. Toggle **"Enable"** on
8. Enter support email (your email)
9. Click **"Save"**

### Step 3: Create Firestore Database

1. Click **"Firestore Database"** in left sidebar
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
    - This allows read/write for 30 days
4. Choose location (any close to you, e.g., `us-central1`)
5. Click **"Enable"**
6. Wait for database creation

### Step 4: Get Firebase Configuration

1. Click **⚙️ Settings icon** → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click the **Web icon `</>`** (if no apps exist)
4. App nickname: `Vitalink Web`
5. Don't check "Firebase Hosting" (not needed)
6. Click **"Register app"**
7. You'll see the `firebaseConfig` object:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "vitalink-test.firebaseapp.com",
    projectId: "vitalink-test",
    storageBucket: "vitalink-test.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456",
};
```

8. **Copy these values** - you'll need them next!

### Step 5: Configure Environment Variables

1. **Create `.env.local` file** in your project root:

    ```bash
    cp .env.example .env.local
    ```

2. **Edit `.env.local`** with your Firebase config values:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vitalink-test.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=vitalink-test
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=vitalink-test.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
    NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
    ```

3. **Save the file**

### Step 6: Start Development Server

```bash
npm run dev
```

You should see:

```
✓ Ready in 2.3s
○ Local:        http://localhost:3000
```

### Step 7: Test Authentication!

Open your browser to **http://localhost:3000/auth/register**

---

## 🧪 Testing Checklist

### Test 1: Patient Registration ✅

1. Go to http://localhost:3000/auth/register
2. Select **"Patient"** user type
3. **Step 1 - Account Info:**

    - Email: `john.patient@test.com`
    - Password: `test1234`
    - Confirm Password: `test1234`
    - Click **"Next"**

4. **Step 2 - Personal Info:**

    - First Name: `John`
    - Last Name: `Patient`
    - Contact Number: `0771234567`
    - Date of Birth: `1990-01-01`
    - Gender: `Male`
    - Address: `123 Main St, Colombo`
    - Emergency Contact Name: `Jane Patient`
    - Emergency Relationship: `Spouse`
    - Emergency Phone: `0779876543`
    - ✅ Check "I accept the terms and conditions"
    - Click **"Create Account"**

5. **Expected Result:**
    - Redirects to `/auth/login`
    - Green success message: "Registration successful!"
    - Check Firebase Console:
        - Authentication → Users → See new user
        - Firestore → `patients` collection → See document
        - Firestore → `healthRecords` collection → See health record

### Test 2: Patient Login ✅

1. Go to http://localhost:3000/auth/login (or should already be there)
2. Select **"Patient"** user type
3. Email: `john.patient@test.com`
4. Password: `test1234`
5. Click **"Sign In"**
6. **Expected Result:**
    - Redirects to `/dashboard`
    - Patient portal loads
    - Can see dashboard with stats

### Test 3: Staff Registration ✅

1. Open new incognito window (or sign out first)
2. Go to http://localhost:3000/auth/register
3. Select **"Staff"** user type
4. **Step 1:**

    - Email: `dr.smith@test.com`
    - Password: `test1234`
    - Confirm Password: `test1234`
    - Click **"Next"**

5. **Step 2:**

    - First Name: `Sarah`
    - Last Name: `Smith`
    - Contact Number: `0771234568`
    - Date of Birth: `1985-05-15`
    - Gender: `Female`
    - Address: `456 Hospital Rd, Colombo`
    - _(No emergency contact for staff)_
    - ✅ Check terms
    - Click **"Create Account"**

6. **Expected Result:**
    - Redirects to login
    - Check Firestore → `staff` collection → See document

### Test 4: Staff Login ✅

1. At login page, select **"Staff"** user type
2. Email: `dr.smith@test.com`
3. Password: `test1234`
4. Click **"Sign In"**
5. **Expected Result:**
    - Redirects to `/staff/dashboard`
    - Staff portal loads

### Test 5: Wrong User Type ❌

1. Try to login as **Patient** with staff credentials:

    - Select: **"Patient"**
    - Email: `dr.smith@test.com` (staff account)
    - Password: `test1234`
    - Click **"Sign In"**

2. **Expected Result:**
    - Error: "This account is registered as a staff. Please select the correct user type."
    - User is NOT logged in

### Test 6: Wrong Password ❌

1. Email: `john.patient@test.com`
2. Password: `wrongpassword`
3. Click **"Sign In"**
4. **Expected Result:**
    - Error: "Incorrect password"

### Test 7: Google Sign-In ⚠️

1. Click **"Continue with Google"**
2. Select Google account
3. **If user hasn't registered first:**
    - Error: "No account found. Please register first using the Sign Up page."
4. **If user already registered (with same email):**
    - Successfully logs in
    - Redirects to correct portal

### Test 8: Password Reset ✅

1. Go to http://localhost:3000/auth/forgot-password
2. Email: `john.patient@test.com`
3. Click **"Send Reset Link"**
4. **Expected Result:**
    - Success screen shows
    - Check your email inbox
    - Click reset link
    - Change password
    - Login with new password

### Test 9: Protected Routes 🔒

1. Sign out (close browser or clear cookies)
2. Try to access http://localhost:3000/dashboard
3. **Expected Result:**
    - Redirects to `/auth/login?redirect=/dashboard`
    - After login, redirects back to `/dashboard`

---

## 🔍 Debugging Tips

### Issue: "Firebase: Error (auth/invalid-api-key)"

**Solution:** Check `.env.local` has correct `NEXT_PUBLIC_FIREBASE_API_KEY`

### Issue: "Firebase: Error (auth/project-not-found)"

**Solution:** Verify `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches your Firebase project

### Issue: "Missing or insufficient permissions"

**Solution:**

1. Go to Firestore Database
2. Click "Rules" tab
3. Make sure it's in test mode:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

### Issue: Environment variables not loading

**Solution:**

1. Make sure `.env.local` is in project root (same level as `package.json`)
2. Restart the dev server (`Ctrl+C` then `npm run dev`)
3. Verify all variables start with `NEXT_PUBLIC_`

### Issue: "Registration successful but can't login"

**Solution:**

1. Check Firebase Console → Authentication → Users (user should be listed)
2. Check Firestore → Collections (patient/staff document should exist)
3. Try signing in again with correct user type

---

## 📊 Verify in Firebase Console

After testing, you should see in Firebase Console:

### Authentication Tab

```
Users (2 total)
├── john.patient@test.com (UID: abc123...)
└── dr.smith@test.com (UID: xyz789...)
```

### Firestore Tab

```
Collections
├── patients/
│   └── abc123.../
│       ├── firstName: "John"
│       ├── lastName: "Patient"
│       ├── email: "john.patient@test.com"
│       └── ... (all fields)
│
├── healthRecords/
│   └── abc123.../
│       ├── patientId: "abc123..."
│       ├── allergies: []
│       └── ... (initial record)
│
└── staff/
    └── xyz789.../
        ├── firstName: "Sarah"
        ├── lastName: "Smith"
        └── ... (all fields)
```

---

## 🎯 What You Can Test

✅ **Working Features:**

-   Patient registration (creates patient + health record)
-   Staff registration (creates staff profile)
-   Email/password login
-   Google Sign-In (if user already registered)
-   Password reset emails
-   User type verification
-   Protected routes (redirect to login)
-   Success/error messages
-   Form validation
-   Loading states

⏳ **Not Yet Implemented:**

-   Email verification
-   Role-based portal access control
-   Remember me persistence
-   Session timeout
-   Account settings/profile updates

---

## 🚀 Quick Commands

```bash
# Start dev server
npm run dev

# Stop dev server
Ctrl+C

# Check for TypeScript errors
npx tsc --noEmit

# Run tests
npm test

# Clear cache if needed
rm -rf .next
npm run dev
```

---

## 📸 Expected Screenshots

### Registration Success

![Green banner: "Registration successful! Please log in with your credentials."]

### Login Success (Patient)

![Dashboard page with stats cards and quick actions]

### Login Success (Staff)

![Staff dashboard with appointments table and system status]

### User Type Mismatch Error

![Red banner: "This account is registered as a staff. Please select the correct user type."]

### Password Reset Email Sent

![Success screen: "Check Your Email - Password reset instructions have been sent"]

---

**Ready to test?** Just run `npm run dev` and follow the checklist above! 🚀

**No Firebase setup yet?** That's okay - the UI will still work, you'll just see auth errors (which is expected). Set up Firebase when you're ready to test the full flow.
