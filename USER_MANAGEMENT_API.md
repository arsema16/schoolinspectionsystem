# User Management API Endpoints

## Overview
Complete user management functionality for administrators and user profile management for all authenticated users.

## Base URL
All endpoints are prefixed with `/api/users`

---

## Authentication Required
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Get All Users
**GET** `/api/users`

**Access:** Admin only

**Description:** Retrieve a list of all users in the system.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "users": [
    {
      "_id": "user_id",
      "username": "admin",
      "role": "Admin",
      "isActive": true,
      "lastLogin": "2026-03-08T10:30:00.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 2. Get User by ID
**GET** `/api/users/:id`

**Access:** Admin only

**Description:** Retrieve details of a specific user.

**Parameters:**
- `id` (path parameter) - User ID

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "username": "inspector1",
    "role": "Inspector",
    "isActive": true,
    "lastLogin": "2026-03-07T14:20:00.000Z",
    "createdAt": "2026-02-15T00:00:00.000Z"
  }
}
```

---

### 3. Create User
**POST** `/api/users`

**Access:** Admin only

**Description:** Create a new user account.

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "role": "Inspector"
}
```

**Validation:**
- `username`: Required, minimum 3 characters, must be unique
- `password`: Required, minimum 6 characters
- `role`: Required, must be "Admin" or "Inspector"

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "_id": "new_user_id",
    "username": "newuser",
    "role": "Inspector",
    "isActive": true,
    "createdAt": "2026-03-08T12:00:00.000Z"
  }
}
```

---

### 4. Update User
**PUT** `/api/users/:id`

**Access:** Admin only

**Description:** Update user details (username, role, active status, password).

**Parameters:**
- `id` (path parameter) - User ID

**Request Body:** (all fields optional)
```json
{
  "username": "updatedusername",
  "role": "Admin",
  "isActive": false,
  "password": "newpassword123"
}
```

**Restrictions:**
- Cannot deactivate your own account
- Username must be unique if changed
- Password must be at least 6 characters if provided

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "_id": "user_id",
    "username": "updatedusername",
    "role": "Admin",
    "isActive": true,
    "lastLogin": "2026-03-07T14:20:00.000Z",
    "createdAt": "2026-02-15T00:00:00.000Z"
  }
}
```

**Note:** When a user is deactivated, all their active sessions are cleared.

---

### 5. Delete User
**DELETE** `/api/users/:id`

**Access:** Admin only

**Description:** Permanently delete a user account.

**Parameters:**
- `id` (path parameter) - User ID

**Restrictions:**
- Cannot delete your own account

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 6. Get Current User Profile
**GET** `/api/users/me`

**Access:** Any authenticated user

**Description:** Retrieve the profile of the currently logged-in user.

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "username": "currentuser",
    "role": "Inspector",
    "isActive": true,
    "lastLogin": "2026-03-08T10:30:00.000Z",
    "createdAt": "2026-01-15T00:00:00.000Z"
  }
}
```

---

### 7. Update Password
**PUT** `/api/users/me/password`

**Access:** Any authenticated user

**Description:** Change the current user's password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Validation:**
- `currentPassword`: Required, must match existing password
- `newPassword`: Required, minimum 6 characters

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully. Please login again."
}
```

**Note:** All active sessions are cleared after password change, requiring re-login.

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (user doesn't exist)
- `409` - Conflict (username already exists)
- `500` - Internal Server Error

---

## Audit Logging

All user management operations are automatically logged to the audit system:
- User creation
- User updates
- User deletion
- Password changes

Logs include:
- Action performed
- Admin who performed the action
- Timestamp
- IP address
- User agent

---

## Usage Examples

### Example 1: Admin creates a new inspector
```javascript
fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    username: 'inspector2',
    password: 'secure123',
    role: 'Inspector'
  })
});
```

### Example 2: User changes their password
```javascript
fetch('/api/users/me/password', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    currentPassword: 'oldpass',
    newPassword: 'newpass123'
  })
});
```

### Example 3: Admin deactivates a user
```javascript
fetch('/api/users/USER_ID', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    isActive: false
  })
});
```

---

## Security Features

1. **Role-Based Access Control:** Admin-only operations are protected
2. **Self-Protection:** Users cannot delete or deactivate their own accounts
3. **Password Security:** Passwords are hashed using bcrypt
4. **Session Management:** Deactivation and password changes clear active sessions
5. **Audit Trail:** All operations are logged for accountability
6. **Input Validation:** All inputs are validated before processing
