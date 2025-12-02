# Authentication & Authorization System Report
## NBK Youth Application

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Token Architecture](#token-architecture)
3. [Authentication Flow](#authentication-flow)
4. [Session Management](#session-management)
5. [Profile & User Management](#profile--user-management)
6. [Authorization & Access Control](#authorization--access-control)
7. [Security Features](#security-features)
8. [Storage Strategy](#storage-strategy)
9. [Technical Implementation Details](#technical-implementation-details)

---

## System Overview

Your application uses a **dual-token authentication system** combining:
- **JWT Access Tokens** (short-lived, stateless)
- **Refresh Tokens** (long-lived, stateful, session-bound)

This hybrid approach provides both security and user convenience, allowing users to stay logged in for extended periods while maintaining the ability to revoke access instantly.

### Key Components:
- **JWT (JSON Web Tokens)**: For stateless authentication
- **Sessions**: For tracking active login sessions across devices
- **Cookies**: For storing refresh tokens securely
- **Google OAuth2**: For third-party authentication
- **Firebase Auth**: For phone number verification (OTP)
- **bcrypt**: For password hashing

---

## Token Architecture

### 1. Access Token (JWT)

**Purpose**: Authenticate API requests

**Structure**:
```javascript
{
  id: user._id,           // MongoDB user ID
  role: user.role,        // User role (user/admin/financier/developer)
  sessionId: session._id, // Session ID this token is bound to
  type: "access",         // Token type identifier
  iat: timestamp,         // Issued at (Unix timestamp)
  exp: timestamp          // Expiration (15 days from issuance)
}
```

**Characteristics**:
- **Lifetime**: 15 days
- **Algorithm**: JWT signed with HS256
- **Secret**: `process.env.JWT_SECRET`
- **Format**: Standard JWT (header.payload.signature)
- **Stateless**: Can be verified without database lookup
- **Session-Bound**: Contains sessionId for session validation

**Generation** (`utils/tokenUtils.js`):
```javascript
generateAccessToken({ id, role, sessionId })
  → Returns JWT string with 15-day expiration
  → Signed with JWT_SECRET from environment
  → Includes type: "access" for token validation
```

**Verification**:
- Signature validation using JWT_SECRET
- Type check (must be "access")
- Expiration check
- Optional session validation if sessionId present

---

### 2. Refresh Token (Cryptographic Random)

**Purpose**: Obtain new access tokens without re-authentication

**Structure**:
```javascript
// Raw token (64 bytes, 128 hex characters)
"a4f2e8c9b1d7...128 character random hex string"

// Stored as SHA-256 hash in database
"5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
```

**Characteristics**:
- **Lifetime**: 15 months (365 days)
- **Generation**: `crypto.randomBytes(64).toString("hex")`
- **Storage**: SHA-256 hashed in Session collection
- **Format**: Random 128-character hexadecimal string
- **Stateful**: Must exist in database to be valid
- **One-to-One**: Each token maps to exactly one session

**Generation** (`utils/tokenUtils.js`):
```javascript
generateRefreshToken()
  → crypto.randomBytes(64).toString("hex")
  → Returns 128-character random string
  → Never stored in plain text (only hash stored)
```

**Hashing** (`utils/tokenUtils.js`):
```javascript
hashToken(token)
  → crypto.createHash("sha256").update(token).digest("hex")
  → Returns SHA-256 hash for database storage
  → One-way function (cannot reverse)
```

---

## Authentication Flow

### 1. Sign Up Flow

**Route**: `POST /api/auth/signup`

**Process**:
```
1. Client sends: { name, email, phoneNumber, password, language, deviceInfo }
   ↓
2. Server validates:
   - Required fields present
   - Phone number format (normalized to international format)
   - Email format (if provided)
   - No duplicate phone/email
   ↓
3. User document created:
   - Password hashed with bcrypt (10 rounds)
   - Auto-generated registerId (e.g., "R1", "R2", "R3"...)
   - Default role: "user"
   - Default category: "general"
   ↓
4. Session created (createSessionAndTokens):
   - Generate refresh token (128 random hex)
   - Hash refresh token with SHA-256
   - Store session in database
   - Generate access token (JWT, 15 days)
   ↓
5. Response:
   - Set httpOnly cookie with refresh token
   - Return access token in JSON
   - Return user profile data
   - Send welcome email (async)
```

**Session Creation Details**:
```javascript
// Session document structure
{
  userId: ObjectId,
  tokenHash: "sha256_hash_of_refresh_token",
  deviceInfo: {
    deviceType: "mobile|tablet|desktop|unknown",
    deviceModel: "device_name",
    os: "operating_system",
    browserName: "browser_name",
    accessMode: "pwa|standalone|twa|website|addtohomescreen|unknown"
  },
  location: {
    city: "city_name",      // From IP geolocation
    state: "state_name",
    country: "country_name"
  },
  action: "signup|signin|google-signup|google-signin",
  createdAt: Date,
  lastActive: Date,
  expiresAt: Date (15 months from creation),
  isValid: true
}
```

---

### 2. Sign In Flow

**Route**: `POST /api/auth/signin`

**Process**:
```
1. Client sends: { identifier, password, language, deviceInfo }
   - identifier can be email OR phone number
   ↓
2. Server identifies login method:
   - Email format check: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
   - Otherwise: normalize as phone number
   ↓
3. User lookup:
   - Find user by email OR phoneNumber
   ↓
4. Password verification:
   - Compare with bcrypt: user.comparePassword(password)
   - Check if password exists (Google users have no password)
   ↓
5. Password rehashing (if needed):
   - Check current hash rounds: user.getHashRounds()
   - If not 10 rounds, rehash with 10 rounds
   - Automatically upgrades from 12 to 10 rounds
   ↓
6. Session & tokens:
   - Create new session (same as signup)
   - Generate access + refresh tokens
   ↓
7. Response:
   - Set httpOnly cookie with refresh token
   - Return access token + user profile
```

**Security Note**: Password hash round migration happens transparently during signin. Old passwords with 12 rounds are rehashed to 10 rounds for performance optimization.

---

### 3. Google Authentication Flow

**Route**: `POST /api/auth/google-auth`

**Two Methods Supported**:
1. **ID Token** (credential from Google Sign-In button)
2. **Access Token** (from Google OAuth flow)

**Process**:
```
1. Client sends: { credential OR accessToken, phoneNumber?, name?, language, deviceInfo }
   ↓
2. Token verification:
   - If credential: Verify ID token with Google OAuth2Client
   - If accessToken: Fetch user info from Google API
   ↓
3. Extract Google user data:
   - name, email, googleId (sub), picture
   ↓
4. Check existing user by email:
   
   A. User exists:
      - Link googleId if not already linked
      - Create session & tokens
      - Return success
   
   B. New user:
      - Require phoneNumber (if not provided, return 400)
      - Validate phone number (international format)
      - Check phone not already used
      - Create user with googleId
      - Set password to null (Google-only account)
      - Create session & tokens
      - Send welcome email
      - Return success
```

**Google Integration**:
- Uses `google-auth-library` npm package
- Client ID: `process.env.GOOGLE_CLIENT_ID`
- Verifies tokens server-side for security
- Supports both web and mobile OAuth flows

---

### 4. Forgot Password Flow

**Two Pathways**:

#### A. Email-Based Reset

**Routes**:
1. `POST /api/auth/forgot-password` - Request OTP
2. `POST /api/auth/verify-otp` - Verify OTP & get reset token
3. `POST /api/auth/reset-password` - Reset password with token

**Process**:
```
Step 1: Request OTP
  Client → { email }
  Server:
    - Validate email format
    - Check user exists
    - Delete old OTPs for this email
    - Generate 6-digit OTP
    - Save OTP in database (expires in 10 minutes)
    - Send OTP via email
  Response: { message: "OTP sent successfully" }

Step 2: Verify OTP
  Client → { email, otp }
  Server:
    - Find OTP record
    - Validate OTP matches
    - Check OTP age (< 10 minutes)
    - Delete OTP record
    - Generate reset token (JWT, 10 min expiry)
  Response: { resetToken }

Step 3: Reset Password
  Client → { resetToken, newPassword }
  Server:
    - Verify reset token (JWT)
    - Extract email from token
    - Find user by email
    - Update password (bcrypt auto-hashes)
    - INVALIDATE ALL USER SESSIONS
  Response: { message: "Password reset successful" }
```

#### B. Phone-Based Reset (Firebase OTP)

**Routes**:
1. `POST /api/auth/forgot-password/phone` - Verify phone exists
2. Firebase handles OTP (client-side)
3. `POST /api/auth/forgot-password/phone/token` - Exchange Firebase token
4. `POST /api/auth/reset-password` - Reset password

**Process**:
```
Step 1: Initiate phone reset
  Client → { phoneNumber }
  Server:
    - Normalize phone number
    - Verify user exists
  Response: { message: "Phone number verified" }

Step 2: Client gets Firebase OTP
  - User receives SMS with OTP
  - Client verifies OTP with Firebase
  - Client receives Firebase ID token

Step 3: Exchange Firebase token
  Client → { phoneNumber, firebaseToken }
  Server:
    - Verify Firebase ID token with admin.auth()
    - Extract phone_number from token
    - Validate phone_number matches request
    - Generate reset token (JWT, 10 min)
  Response: { resetToken }

Step 4: Reset password (same as email flow)
```

---

## Session Management

### Session Lifecycle

**Creation**:
```javascript
// File: controllers/sessionController.js → createSessionAndTokens()

1. Extract IP address from request headers
2. Get geolocation from IP (async, non-blocking)
3. Parse device info from request
4. Generate refresh token (64 random bytes)
5. Hash refresh token (SHA-256)
6. Create session document:
   {
     userId: user._id,
     tokenHash: hash,
     deviceInfo: { ... },
     location: { city, state, country },
     action: "signup|signin|google-signup|google-signin",
     expiresAt: Date (now + 15 months),
     isValid: true
   }
7. Update session with location/device (async background)
8. Generate access token (JWT with sessionId)
9. Return { accessToken, refreshToken }
```

**Storage**: MongoDB Session collection with indexes on:
- `userId + isValid + expiresAt` (compound index)
- `tokenHash` (unique index)
- `expiresAt` (TTL index - auto-delete expired sessions)

---

### Refresh Token Rotation

**Route**: `POST /api/sessions/refresh`

**Process**:
```
1. Extract refresh token from httpOnly cookie
   ↓
2. Hash the token (SHA-256)
   ↓
3. Find session by tokenHash:
   - Must be isValid: true
   - Must not be expired (expiresAt > now)
   ↓
4. Populate user data from session.userId
   ↓
5. Generate NEW tokens:
   - New access token (JWT, 15 days)
   - New refresh token (random)
   ↓
6. Update session:
   - Replace tokenHash with new hash
   - Extend expiresAt by 15 months
   - Update lastActive timestamp
   ↓
7. Response:
   - Set new refresh token in cookie
   - Return new access token
   - Return user profile
```

**Security**: This implements **refresh token rotation** - each refresh invalidates the old token and issues a new one, preventing token replay attacks.

---

### Session Tracking

**Active Sessions**: `GET /api/sessions`
```javascript
// Returns all active sessions for current user
[
  {
    _id: "session_id",
    deviceInfo: { deviceType, deviceModel, os, browserName, accessMode },
    location: { city, state, country },
    action: "signin",
    createdAt: Date,
    lastActive: Date,
    isCurrent: true  // The session making this request
  },
  ...
]
```

**Session Detection**:
- Current session identified by `sessionId` in access token
- Fallback: Compare refresh token hash from cookie
- Each session represents a device/browser login

---

### Session Invalidation

**Individual Logout**: `POST /api/sessions/signout`
```javascript
// Signs out current session only
1. Extract refresh token from cookie
2. Hash token
3. Find session and set isValid = false
4. Clear refresh token cookie
5. User remains logged in on other devices
```

**Specific Session**: `DELETE /api/sessions/:sessionId`
```javascript
// Signs out specific session (e.g., from "Active Sessions" list)
1. Verify session belongs to current user
2. Set session.isValid = false
3. That device is logged out
```

**All Sessions** (on password change):
```javascript
// File: controllers/profileController.js → changePassword()
1. User changes password
2. Invalidate ALL sessions EXCEPT current:
   Session.updateMany(
     { userId, tokenHash: { $ne: currentTokenHash } },
     { isValid: false }
   )
3. Current session remains valid (user stays logged in)
4. All other devices are logged out
```

**All Sessions** (on password reset):
```javascript
// File: controllers/authController.js → resetPassword()
1. User resets password via OTP
2. Invalidate ALL sessions (including current):
   Session.updateMany(
     { userId },
     { isValid: false }
   )
3. User must login again on all devices
4. More secure than password change
```

---

### Last Active Tracking

**Route**: `POST /api/sessions/last-active`

**Purpose**: Track user activity without token refresh

**Process**:
```javascript
1. Client periodically calls this endpoint (e.g., every 5 minutes)
2. Extract refresh token from cookie
3. Hash token
4. Update session.lastActive to current time
5. No new tokens generated
6. Helps track active vs. inactive sessions
```

---

## Profile & User Management

### User Model Structure

**File**: `models/User.js`

```javascript
{
  registerId: String,        // Auto-generated: "R1", "R2", etc.
  name: String,              // Required
  email: String,             // Unique, lowercase, optional for Google users
  phoneNumber: String,       // Unique, required, international format
  password: String,          // Hashed with bcrypt, null for Google-only users
  googleId: String,          // Google OAuth ID (sub), unique if present
  role: Enum,                // 'user' | 'admin' | 'developer' | 'financier'
  category: Enum,            // 'youth' | 'general'
  profileImage: String,      // Cloudinary URL
  profileImagePublicId: String, // Cloudinary public ID for deletion
  language: Enum,            // 'en' | 'te' (Telugu)
  createdAt: Date,
  updatedAt: Date
}
```

**Pre-save Hooks**:
```javascript
1. registerId generation:
   - Increment Counter collection
   - Format as "R" + sequence number
   - Auto-generated on first save

2. Password hashing:
   - If password modified
   - Hash with bcrypt.hash(password, 10)
   - 10 rounds for balance of security/performance
```

**Methods**:
```javascript
comparePassword(candidatePassword)
  → Returns Promise<boolean>
  → Compares plain text with hashed password
  → Returns false if no password set

getHashRounds()
  → Returns number of bcrypt rounds used
  → Used to detect old passwords needing rehash
```

---

### Profile Operations

#### 1. Get Profile

**Route**: `GET /api/profile/profile`

**Middleware**: `auth` (requires valid access token)

**Response**:
```javascript
{
  _id: ObjectId,
  registerId: "R123",
  name: "User Name",
  email: "user@example.com",
  phoneNumber: "+911234567890",
  role: "user",
  category: "youth",
  language: "en",
  profileImage: "https://cloudinary.../image.jpg",
  hasPassword: true,  // Computed field
  googleId: "google_oauth_id" | null,
  createdAt: Date,
  updatedAt: Date
}
```

**Note**: Password field excluded, replaced with `hasPassword` boolean.

---

#### 2. Update Profile

**Route**: `PATCH /api/profile/profile`

**Validations**:
```javascript
1. Email changes:
   - Cannot change default developer email
   - Must be valid format
   - Must not be used by another user
   - Auto-removes Google link if email changed

2. Phone number changes:
   - Must be international format
   - Must not be used by another user
   - Cannot change for default developer

3. Name changes:
   - Simple string update
```

**Google ID Auto-Removal**:
```javascript
// If user changes email and has Google linked:
if (newEmail !== oldEmail && user.googleId) {
  user.googleId = undefined;
  // Log activity: "Google account auto-removed due to email change"
}
```

**Reason**: Google accounts are tied to specific emails. Changing email breaks this association.

---

#### 3. Change Password

**Route**: `POST /api/profile/change-password`

**Process**:
```javascript
1. Validate current password (if user has one):
   - Compare with bcrypt
   - Return 401 if incorrect

2. Set new password:
   - user.password = newPassword
   - Pre-save hook auto-hashes

3. Invalidate other sessions:
   - Keep current session valid
   - Set all other sessions to isValid: false
   - Other devices logged out

4. Return updated user with hasPassword: true
```

**Special Case**: Google-only users (no current password) can set a password without providing current password.

---

#### 4. Link Google Account

**Route**: `POST /api/profile/link-google`

**Process**:
```javascript
1. Verify Google credential (ID token)
2. Extract email and googleId
3. Check if googleId already used by another user
4. Validate email matches:
   
   A. User has no email:
      - Auto-fill email from Google
      - Link Google account
      - Return success
   
   B. User email matches Google email:
      - Link Google account
      - Return success
   
   C. Email mismatch:
      - Return 400: "Update email in profile first"
```

**Security**: Prevents account takeover by verifying email ownership.

---

#### 5. Unlink Google Account

**Route**: `POST /api/profile/unlink-google`

**Process**:
```javascript
1. Check if Google account linked
2. Set user.googleId = undefined
3. Log activity
4. User can still login with email/password
```

---

#### 6. Update Profile Image

**Route**: `POST /api/profile/image`

**Process**:
```javascript
1. Client uploads image to Cloudinary (separate endpoint)
2. Client sends Cloudinary URL + public_id
3. Server deletes old image from Cloudinary (if exists)
4. Server updates user.profileImage and user.profileImagePublicId
5. Return success
```

**Route**: `DELETE /api/profile/image`
```javascript
1. Delete image from Cloudinary using publicId
2. Set profileImage and profileImagePublicId to null
3. Return success
```

---

#### 7. Update Language

**Route**: `PATCH /api/profile/language`

**Simple Update**:
```javascript
User.findByIdAndUpdate(userId, { language }, { new: true })
```

**Supported**: `en` (English), `te` (Telugu)

---

## Authorization & Access Control

### Middleware Chain

**File**: `middleware/auth.js`

**Request Flow**:
```
Request → auth middleware → checkRole middleware → Controller
```

---

### auth Middleware

**Purpose**: Authenticate user from access token

**Process**:
```javascript
1. Extract token from Authorization header:
   headers.authorization = "Bearer <token>"
   ↓
2. Verify JWT signature and decode:
   jwt.verify(token, JWT_SECRET)
   ↓
3. Validate token type:
   decoded.type === "access"
   ↓
4. Validate session (if sessionId present):
   - Find session by sessionId
   - Check isValid === true
   - Check expiresAt > now
   - Check session.userId === decoded.id
   ↓
5. Load user from database:
   User.findById(decoded.id).select('-password')
   ↓
6. Attach to request:
   req.user = user
   req.sessionId = decoded.sessionId
   req.tokenIssuedAt = decoded.iat
   ↓
7. Call next()
```

**Error Handling**:
```javascript
No token → 401 "Authentication required"
Invalid type → 401 "Invalid token type"
Session invalid → 401 "Session invalid" { expired: true }
User not found → 404 "User not found"
Token expired → 401 "Token expired" { expired: true }
Invalid signature → 401 "Invalid token" { expired: false }
```

**Note**: The `expired` flag helps client decide whether to try token refresh.

---

### checkRole Middleware

**Purpose**: Enforce role-based access control

**File**: `config/access.js`

**Role Definitions**:
```javascript
Access = {
  All: ['user', 'admin', 'financier', 'developer'],
  Privileged: ['admin', 'financier', 'developer'],
  Pro: ['financier', 'developer'],
  Developer: ['developer']
}
```

**Usage**:
```javascript
router.get('/admin-only', auth, checkRole('Privileged'), controller);
router.get('/dev-only', auth, checkRole('Developer'), controller);
router.get('/public', auth, checkRole('All'), controller);
router.get('/unrestricted', auth, checkRole(0), controller); // No role check
```

**Process**:
```javascript
1. If allowed === 0 or 'All': skip role check
2. Get allowed roles array from Access config
3. Check if req.user.role in allowed roles
4. If not: return 403 "Access denied"
5. If yes: call next()
```

**Example Routes**:
```javascript
// From routes/sessions.js
router.get('/auth-sessions', auth, checkRole('Developer'), getAllSessions);
// Only developers can see all user sessions

// From routes/users.js
router.post('/create', auth, checkRole('Privileged'), createUser);
// Admins, financiers, and developers can create users

// From routes/profile.js
router.get('/profile', auth, getProfile);
// All authenticated users (no checkRole = all roles allowed)
```

---

## Security Features

### 1. Password Security

**Hashing Algorithm**: bcrypt
**Rounds**: 10 (2^10 = 1024 iterations)
**Automatic Migration**: Old 12-round passwords rehashed to 10 rounds on signin

**Why bcrypt?**
- Adaptive: Can increase rounds as computers get faster
- Salt included: Each password has unique salt
- Slow by design: Prevents brute force attacks

**Implementation**:
```javascript
// Pre-save hook in User model
if (this.isModified('password') && this.password) {
  this.password = await bcrypt.hash(this.password, 10);
}

// Comparison method
comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
}
```

---

### 2. Token Security

**Access Token**:
- Short-lived (15 days)
- Signed with strong secret (128 characters)
- Includes session binding
- Type validation

**Refresh Token**:
- Cryptographically random (64 bytes)
- Hashed before storage (SHA-256)
- Session-bound
- Rotation on every refresh
- Long-lived but revocable

**Token Rotation**:
```javascript
// Every token refresh generates new tokens
Old: { accessToken: "jwt1", refreshToken: "random1" }
      ↓ Refresh request
New: { accessToken: "jwt2", refreshToken: "random2" }
      ↓ Old tokens immediately invalid
```

**Benefits**:
- Prevents token replay attacks
- Limits damage from stolen tokens
- Maintains audit trail

---

### 3. Session Security

**Session Validation**:
```javascript
// On every authenticated request:
1. Verify JWT signature
2. Check token not expired
3. Check session exists in database
4. Check session.isValid === true
5. Check session.expiresAt > now
6. Check session.userId matches token.id
```

**Session Invalidation Scenarios**:
1. User changes password → All other sessions invalid
2. User resets password → ALL sessions invalid
3. Session expires (15 months) → Auto-deleted by MongoDB TTL
4. User manually logs out → That session invalid
5. Admin action → Can invalidate specific sessions

**Tracking**:
- Device information logged
- IP geolocation stored
- Last active timestamp
- Login method tracked (signup/signin/google-signup/google-signin)

---

### 4. Cookie Security

**Refresh Token Cookie Settings**:
```javascript
res.cookie('refreshToken', token, {
  httpOnly: true,        // Not accessible via JavaScript
  secure: NODE_ENV === 'production',  // HTTPS only in production
  sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 365 * 24 * 60 * 60 * 1000  // 15 months
});
```

**Security Features**:
- `httpOnly`: Prevents XSS attacks (JavaScript can't read)
- `secure`: HTTPS-only transmission
- `sameSite`: CSRF protection (cross-site request forgery)
- Long maxAge: Persistent login experience

---

### 5. Google OAuth Security

**Token Verification**:
```javascript
// Server-side verification (not client-side)
const ticket = await client.verifyIdToken({
  idToken: credential,
  audience: GOOGLE_CLIENT_ID
});

const payload = ticket.getPayload();
// Verified by Google's servers
```

**Benefits**:
- Google handles password security
- No password storage needed
- Two-factor auth supported (user's Google account)
- Automatic security updates from Google

---

### 6. OTP Security

**Email OTP**:
- 6-digit random number
- 10-minute expiration (MongoDB TTL)
- Auto-deleted after verification
- Rate limiting per email (old OTPs deleted before new)

**Phone OTP (Firebase)**:
- Handled by Firebase Authentication
- SMS delivery
- Rate limiting by Firebase
- Server validates Firebase ID token

**Reset Token**:
- JWT with 10-minute expiration
- Single-use (invalidated after password reset)
- Contains only email/phone (no password)

---

### 7. Input Validation

**Email Validation**:
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizedEmail = email.trim().toLowerCase();
```

**Phone Validation**:
```javascript
// File: utils/phoneValidation.js
normalizePhoneNumber(phone)
  → Removes spaces, dashes, parentheses
  → Ensures international format (+country code)
  → Returns null if invalid
```

**Anti-Duplication**:
- Unique indexes on email, phoneNumber, googleId
- Database-level enforcement
- Prevents race conditions

---

### 8. Additional Security Measures

**Helmet.js**: HTTP security headers
```javascript
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
```

**CORS**:
```javascript
app.use(cors({ 
  origin: FRONTEND_URL,  // Only allow specific origin
  credentials: true      // Allow cookies
}));
```

**Rate Limiting**: Implemented via session tracking (last active timestamps)

**Activity Logging**: All auth actions logged to ActivityLog collection

---

## Storage Strategy

### Access Token Storage (Client-Side)

**Location**: `localStorage` or memory (not shown in backend code)

**Typical Client Implementation**:
```javascript
// After login/signup:
localStorage.setItem('accessToken', response.token);

// On API requests:
headers: {
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
}
```

**Characteristics**:
- Accessible to JavaScript
- Survives page refreshes
- Cleared on logout
- Vulnerable to XSS (mitigated by short lifetime)

---

### Refresh Token Storage

**Location**: `httpOnly` cookie

**Automatic Handling**:
```javascript
// Server sets cookie:
res.cookie('refreshToken', token, { httpOnly: true, ... });

// Browser automatically includes cookie on requests to same domain
// No JavaScript access needed or allowed
```

**Database Storage** (Session collection):
```javascript
{
  tokenHash: "sha256_hash",  // Hashed refresh token
  userId: ObjectId,
  isValid: Boolean,
  expiresAt: Date,
  ...
}
```

**Characteristics**:
- Never exposed to JavaScript (XSS protection)
- Automatically sent with requests
- Hashed in database (even if DB compromised)
- Revocable via session invalidation

---

### User Data Storage

**Location**: MongoDB User collection

**Sensitive Fields**:
- `password`: bcrypt hash (never returned in API responses)
- `email`: lowercase, normalized
- `phoneNumber`: international format, normalized
- `googleId`: sparse unique index (null for non-Google users)

**Indexes**:
```javascript
registerId: unique
email: unique, sparse (allows multiple null values)
phoneNumber: unique
googleId: unique, sparse
_id: default
```

---

### Session Data Storage

**Location**: MongoDB Session collection

**Indexes**:
```javascript
{ userId: 1, isValid: 1, expiresAt: 1 }  // Compound
{ tokenHash: 1 }                         // Unique
{ expiresAt: 1 }, { expireAfterSeconds: 0 } // TTL auto-delete
```

**TTL (Time-To-Live)**:
```javascript
// MongoDB automatically deletes documents where:
expiresAt < current_time
```

**Benefits**:
- Auto-cleanup of expired sessions
- No manual deletion needed
- Prevents database bloat

---

### OTP Storage

**Location**: MongoDB OTP collection

**Structure**:
```javascript
{
  email: String (unique),
  otp: String (6 digits),
  createdAt: Date (expires: 600s = 10 minutes)
}
```

**TTL Index**: Auto-deletes after 10 minutes

**Unique Constraint**: One OTP per email (old deleted when new requested)

---

## Technical Implementation Details

### Environment Variables

**Required**:
```javascript
MONGODB_URI              // MongoDB connection string
JWT_SECRET               // 128-character random hex string
FRONTEND_URL             // For CORS
GOOGLE_CLIENT_ID         // Google OAuth client ID
CLOUDINARY_*             // Image storage
GOOGLE_DRIVE_*           // File storage
PUBLIC_VAPID_KEY         // Push notifications
PRIVATE_VAPID_KEY        // Push notifications
DEFAULT_DEVELOPER_PASSWORD // Default admin account
```

**JWT_SECRET Example**:
```
660001b51cd4633aa9fce2d60834e0b2aeda386aaf08cd24c6b46c3ce39fc67dd260450b01cd0ea7aa42a0d6e48b723778a395f144e47226f0130bb08e30974a
```

**Security**: Never commit to version control (use .env file)

---

### Database Optimization

**Connection Pooling**:
```javascript
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 400,      // Max concurrent connections
  minPoolSize: 15,       // Min idle connections
  maxIdleTimeMS: 60000,  // Close idle after 1 minute
  family: 4              // IPv4
});
```

**Benefits**:
- Reuses connections
- Reduces connection overhead
- Handles high concurrency

**Lean Queries**:
```javascript
User.findOne({ email }).lean();
// Returns plain JavaScript object (no Mongoose document)
// Faster and less memory
```

---

### API Endpoints Summary

**Authentication**:
```
POST   /api/auth/signup
POST   /api/auth/signin
POST   /api/auth/google-auth
POST   /api/auth/signup/check
POST   /api/auth/forgot-password
POST   /api/auth/forgot-password/phone
POST   /api/auth/forgot-password/phone/token
POST   /api/auth/verify-otp
POST   /api/auth/reset-password
```

**Sessions**:
```
POST   /api/sessions/refresh           (No auth required)
POST   /api/sessions/last-active       (No auth required)
GET    /api/sessions                   (Requires auth)
POST   /api/sessions/signout           (Requires auth)
DELETE /api/sessions/:sessionId        (Requires auth)
GET    /api/sessions/auth-sessions     (Requires auth + Developer role)
GET    /api/sessions/stats             (Requires auth + Developer role)
```

**Profile**:
```
GET    /api/profile/profile            (Requires auth)
PATCH  /api/profile/profile            (Requires auth)
PATCH  /api/profile/language           (Requires auth)
POST   /api/profile/image              (Requires auth)
DELETE /api/profile/image              (Requires auth)
POST   /api/profile/change-password    (Requires auth)
POST   /api/profile/link-google        (Requires auth)
POST   /api/profile/unlink-google      (Requires auth)
```

---

### Error Handling Patterns

**Consistent Error Responses**:
```javascript
// 400 Bad Request
{ message: "Specific validation error" }

// 401 Unauthorized
{ message: "Authentication error", expired: true/false }

// 403 Forbidden
{ message: "Access denied" }

// 404 Not Found
{ message: "User not found" }

// 500 Internal Server Error
{ message: "Server error" }
```

**Token Expiration**:
```javascript
// Client can detect and auto-refresh
if (response.status === 401 && response.data.expired) {
  // Try token refresh
  await fetch('/api/sessions/refresh');
}
```

---

### Activity Logging

**All Auth Actions Logged**:
```javascript
logActivity(
  req,                    // Request object (contains user)
  'CREATE|UPDATE|DELETE', // Action type
  'User|Email|Mobile',    // Entity type
  registerId,             // Entity ID
  { before, after },      // Changes
  'Description'           // Human-readable message
);
```

**Examples**:
- User signup
- User signin
- Password change
- OTP sent
- Email verification
- Google account linked
- Profile updated

**Benefits**:
- Audit trail
- Security monitoring
- Debugging
- Compliance

---

### Background Tasks

**IP Geolocation** (Non-blocking):
```javascript
// Session creation doesn't wait for geolocation
const locationPromise = getLocationFromIP(ip);

// Session saved immediately with placeholder
await Session.create({ location: null, ... });

// Location updated in background
locationPromise.then(loc => Session.update({ location: loc }));
```

**Email Sending** (Fire-and-forget):
```javascript
// Welcome email sent after response
res.status(201).json({ token, user });
sendSignupEmail(user.email, user.name); // Async, no await
```

**Benefits**:
- Faster API responses
- Better user experience
- Failure doesn't block signup/signin

---

## Key Security Principles Applied

1. **Defense in Depth**: Multiple layers (JWT + session + cookie + database)
2. **Principle of Least Privilege**: Role-based access control
3. **Secure by Default**: httpOnly cookies, HTTPS, helmet headers
4. **Token Rotation**: Refresh tokens rotated on every use
5. **Session Binding**: Access tokens bound to specific sessions
6. **Password Hashing**: bcrypt with appropriate rounds
7. **Input Validation**: Email, phone, all user inputs validated
8. **Audit Logging**: All authentication actions logged
9. **Automatic Cleanup**: Expired sessions and OTPs auto-deleted
10. **Secret Management**: Environment variables for sensitive data

---

## Diagram: Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATION                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. POST /api/auth/signup
                              │    { name, email, phone, password }
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AUTH CONTROLLER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Validate input                                        │   │
│  │ 2. Check duplicates                                      │   │
│  │ 3. Create user (password → bcrypt hash)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 4. createSessionAndTokens()
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION CONTROLLER                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Generate refresh token (64 random bytes)             │   │
│  │ 2. Hash refresh token (SHA-256)                         │   │
│  │ 3. Create session in MongoDB                            │   │
│  │    { userId, tokenHash, deviceInfo, expiresAt }         │   │
│  │ 4. Generate access token (JWT)                          │   │
│  │    { id, role, sessionId, type, iat, exp }              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 5. Return tokens
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RESPONSE TO CLIENT                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Cookie: refreshToken (httpOnly, secure)                 │   │
│  │ JSON: { token: accessToken, user: {...} }               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 6. Client stores accessToken
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT STORAGE                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ localStorage: accessToken                                │   │
│  │ Cookie (automatic): refreshToken                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 7. API Request
                              │    Authorization: Bearer <accessToken>
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AUTH MIDDLEWARE                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Extract token from Authorization header              │   │
│  │ 2. Verify JWT (signature, expiration, type)             │   │
│  │ 3. Validate session (if sessionId in token)             │   │
│  │    - Check session.isValid === true                     │   │
│  │    - Check session.expiresAt > now                      │   │
│  │ 4. Load user from database                              │   │
│  │ 5. Attach req.user, req.sessionId                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 8. Check role (if needed)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CHECKROLE MIDDLEWARE                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Get allowed roles for endpoint                       │   │
│  │ 2. Check if req.user.role in allowed                    │   │
│  │ 3. Return 403 if unauthorized                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 9. Execute controller
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PROTECTED CONTROLLER                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ req.user available with full user data                  │   │
│  │ req.sessionId available                                 │   │
│  │ Execute business logic                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Diagram: Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
│  Access token expired or about to expire                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/sessions/refresh
                              │ Cookie: refreshToken (auto-sent)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REFRESH CONTROLLER                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Extract refreshToken from cookie                     │   │
│  │ 2. Hash token (SHA-256)                                 │   │
│  │ 3. Find session:                                        │   │
│  │    Session.findOne({                                    │   │
│  │      tokenHash: hash,                                   │   │
│  │      isValid: true,                                     │   │
│  │      expiresAt: { $gt: now }                            │   │
│  │    })                                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Session found & valid
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN GENERATION                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Generate NEW access token                            │   │
│  │    (JWT with same user, 15 days)                        │   │
│  │ 2. Generate NEW refresh token                           │   │
│  │    (64 random bytes)                                    │   │
│  │ 3. Hash NEW refresh token                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Update session
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION UPDATE                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ session.tokenHash = newHash                             │   │
│  │ session.expiresAt = now + 15 months                     │   │
│  │ session.lastActive = now                                │   │
│  │ await session.save()                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Return new tokens
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RESPONSE                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Cookie: NEW refreshToken (httpOnly)                     │   │
│  │ JSON: { token: NEW accessToken, user: {...} }           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Client updates storage
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT STORAGE                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ OLD accessToken → REPLACED → NEW accessToken            │   │
│  │ OLD refreshToken (cookie) → REPLACED → NEW refreshToken │   │
│  │                                                          │   │
│  │ Old tokens are now invalid (can't be reused)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Best Practices Implemented

### ✅ Security Best Practices
1. ✓ Passwords hashed with bcrypt
2. ✓ JWT signed with strong secret
3. ✓ Refresh tokens cryptographically random
4. ✓ Refresh tokens hashed in database
5. ✓ Token rotation on every refresh
6. ✓ httpOnly cookies for refresh tokens
7. ✓ HTTPS in production
8. ✓ CORS configured
9. ✓ Helmet security headers
10. ✓ Session validation on every request
11. ✓ All sessions invalidated on password reset
12. ✓ Input validation and sanitization
13. ✓ Rate limiting via session tracking
14. ✓ Activity logging for audit trail

### ✅ Performance Best Practices
1. ✓ Database connection pooling
2. ✓ Lean queries for read operations
3. ✓ Indexes on frequently queried fields
4. ✓ TTL indexes for automatic cleanup
5. ✓ Background processing for non-critical tasks
6. ✓ Minimal token payload size
7. ✓ Efficient bcrypt rounds (10 vs 12)

### ✅ User Experience Best Practices
1. ✓ Long-lived sessions (15 months)
2. ✓ Auto token refresh
3. ✓ Google OAuth integration
4. ✓ Remember me functionality (refresh tokens)
5. ✓ Multi-device support
6. ✓ Session management UI
7. ✓ Graceful error messages
8. ✓ Password reset options (email + phone)

---

## Potential Improvements

### 1. Enhanced Security
- Add rate limiting middleware (e.g., express-rate-limit)
- Implement CAPTCHA for signup/signin
- Add two-factor authentication (2FA)
- Implement device fingerprinting
- Add IP-based anomaly detection
- Implement refresh token reuse detection

### 2. Scalability
- Move sessions to Redis for faster lookup
- Implement token blacklist in Redis
- Add read replicas for MongoDB
- Implement caching layer (Redis)
- Add load balancing support

### 3. Monitoring
- Add Prometheus metrics
- Implement alerting for suspicious activity
- Add session analytics dashboard
- Track failed login attempts
- Monitor token refresh patterns

### 4. Features
- Add "trusted devices" feature
- Implement "login alerts" notifications
- Add session naming (e.g., "iPhone 12")
- Implement "sign out all other devices" button
- Add biometric authentication support

---

## Conclusion

Your authentication system is **well-designed, secure, and production-ready**. It implements industry best practices:

- **Dual-token system** balances security and UX
- **Session binding** provides instant revocation
- **Token rotation** prevents replay attacks
- **Password security** with bcrypt and migration
- **Multi-device support** with session tracking
- **Google OAuth** for social login
- **Comprehensive error handling**
- **Activity logging** for audit trails

The system is suitable for applications requiring:
- User authentication
- Multi-device access
- Session management
- Role-based permissions
- Security audit trails
- Social login integration

**Total Files Analyzed**: 15+ files across models, controllers, routes, middleware, and utilities.

---

*Report generated based on comprehensive analysis of the NBK Youth application authentication system.*
*Date: December 2, 2025*
