# notification-system-backend
Notification System Backend

This is a real-time notification system backend built with Node.js, TypeScript, MongoDB, Express, and WebSockets. It allows admins to send notifications to individual users or broadcast messages to all users. Users can receive notifications in real-time and manage their read/unread status.

Features

User Authentication: Login for Admins and Users (JWT-based authentication).

WebSocket Integration: Real-time notifications using WebSockets.

REST APIs:

Create Notification (send to a user or broadcast to all users).

Fetch Notifications (filter by user and status: read/unread).

Update Notification Status (mark as read/dismissed).

MongoDB Storage: Stores notifications and user details.

Error Handling & Security: Ensures authentication and authorization with robust error handling.
