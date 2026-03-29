# 🔐 Authentication API Documentation

## 📌 Base URL

```
http://localhost:5000/api/auth
```

---

# 👤 User Routes

## 📝 Register User

**Endpoint**

```
POST /register/user
```

**Request Body**

```json
{
  "username": "john123",
  "password": "StrongPass@123",
  "role": "User"
}
```

**Success Response (201)**

```json
{
  "success": true,
  "message": "User registration successful, please login",
  "data": {
    "id": "user_id",
    "username": "john123",
    "role": "User",
    "isVerified": false
  }
}
```

**Errors**

* `400` - Validation error / Missing fields
* `409` - Username already exists

---

## 🔑 Login User

**Endpoint**

```
POST /login/user
```

**Request Body**

```json
{
  "username": "john123",
  "password": "StrongPass@123"
}
```

**Success Response (200)**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "id": "user_id",
      "username": "john123",
      "role": "User",
      "isVerified": true
    }
  }
}
```

**Errors**

* `401` - Invalid credentials
* `403` - Account not verified

---

# 🏪 Vendor Routes

## 📝 Register Vendor

**Endpoint**

```
POST /register/vendor
```

**Request Body**

```json
{
  "username": "shopowner",
  "password": "StrongPass@123"
}
```

**Success Response (201)**

```json
{
  "success": true,
  "message": "Vendor registration successful, please login",
  "data": {
    "id": "vendor_id",
    "username": "shopowner",
    "isVerified": false
  }
}
```

**Errors**

* `400` - Validation error
* `409` - Username already taken

---

## 🔑 Login Vendor

**Endpoint**

```
POST /login/vendor
```

**Request Body**

```json
{
  "username": "shopowner",
  "password": "StrongPass@123"
}
```

**Success Response (200)**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "JWT_TOKEN",
    "vendor": {
      "id": "vendor_id",
      "username": "shopowner",
      "isVerified": true
    }
  }
}
```

**Errors**

* `401` - Invalid credentials
* `403` - Vendor not verified

---

# 🔐 Common Routes

## 🔁 Change Password

**Endpoint**

```
POST /change-password
```

**Request Body**

```json
{
  "userId": "id_here",
  "userType": "Vendor",
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@123"
}
```

**Success Response (200)**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors**

* `400` - Missing fields / Weak password
* `401` - Incorrect current password
* `404` - Account not found

---

# 🔑 Authentication

For protected routes, include the JWT token in headers:

```
Authorization: Bearer <JWT_TOKEN>
```

---

# 📊 Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 500  | Internal Server Error |

---

# ⚡ Best Practices

* Always hash passwords before storing
* Never return password in API response
* Use strong password validation
* Store JWT securely (HTTP-only cookies recommended)
* Implement rate limiting for login endpoints

---

# 🚀 Future Improvements

* Email verification system
* Refresh tokens
* OTP-based login
* Google / OAuth authentication
* Role-based access middleware

---

# 📌 Notes

* Vendors must be verified before login
* User roles supported: `User`, `Vendor`, `Admin`
* Password strength validation is enforced

---

# 👨‍💻 Author

Built with ❤️ using Node.js, Express, and MongoDB
