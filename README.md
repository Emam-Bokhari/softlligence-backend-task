# SassFlow Backend API

Multi-tenant project and subscription management backend platform built with Node.js, Express, TypeScript, and MongoDB.

## Project Overview

SassFlow provides backend services for multi-tenant software as a service environments. The platform manages tenant organizations, team memberships, role-based authorization, tier-based subscription plans, project workflows, activity auditing, and operational analytics.

### Key Capabilities

* Multi-Tenancy Architecture: Strict data isolation per tenant organization with tenant-level scoping across projects and users.
* Role-Based Access Control: Granular permissions for Super Admin, Tenant, and User roles.
* Authentication and Security: JSON Web Token authentication with access and refresh tokens, bcrypt password hashing, one-time password email verification, Helmet security headers, and Cross-Origin Resource Sharing controls.
* Subscription Management: Configurable subscription plans with resource quotas for maximum users and projects, automated feature toggles, and plan assignment.
* Project Management: Project creation, assignment, status tracking, milestone progress updates, and activity audit logging.
* Operational Analytics: Role-specific metrics dashboards providing platform statistics for administrators, resource utilization for tenants, and task metrics for team members.
* Request Validation and Error Handling: Schema-level validation using Zod and a unified global error handling middleware for consistent API error responses.

## Technology Stack

### Core Technologies

* Runtime: Node.js (version 18 or higher)
* Programming Language: TypeScript
* Web Framework: Express.js
* Database: MongoDB
* Object Data Modeling: Mongoose

### Security and Authentication

* Authentication: JSON Web Token (jsonwebtoken)
* Password Hashing: bcrypt
* HTTP Headers Security: Helmet
* CORS Handling: cors

### Utilities and Validation

* Data Validation: Zod
* Mailing Service: Nodemailer
* HTTP Status Codes: http-status-codes

### Development and Build Tools

* Development Server: ts-node-dev
* Code Formatting: Prettier
* Compiler: TypeScript (tsc)

## Project Folder Structure

```text
task/
├── api/
│   └── index.ts
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── logo.png
│   └── logo.svg
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── app/
│   │   ├── builder/
│   │   │   └── queryBuilder.ts
│   │   ├── middlewares/
│   │   │   ├── auth.ts
│   │   │   ├── globalErrorHandler.ts
│   │   │   └── validateRequest.ts
│   │   ├── modules/
│   │   │   ├── analytics/
│   │   │   ├── auth/
│   │   │   ├── project/
│   │   │   ├── resetToken/
│   │   │   ├── subscriptionPlan/
│   │   │   └── user/
│   │   └── routes/
│   │       └── index.ts
│   ├── config/
│   │   └── index.ts
│   ├── DB/
│   │   └── index.ts
│   ├── enums/
│   │   ├── project.ts
│   │   ├── subscription.ts
│   │   └── user.ts
│   ├── errors/
│   │   ├── ApiErrors.ts
│   │   ├── handleValidationError.ts
│   │   └── handleZodError.ts
│   ├── helpers/
│   │   ├── authHelper.ts
│   │   ├── emailHelper.ts
│   │   └── jwtHelper.ts
│   ├── shared/
│   │   ├── catchAsync.ts
│   │   ├── emailTemplate.ts
│   │   ├── logger.ts
│   │   ├── sendResponse.ts
│   │   └── unlinkFile.ts
│   ├── types/
│   └── util/
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

Before setting up the project locally, verify that your environment meets the following requirements:

* Node.js version 18.0.0 or higher
* npm version 9.0.0 or higher
* MongoDB running locally or a remote MongoDB Atlas URI
* SMTP email account credentials for verification emails

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Emam-Bokhari/softlligence-backend-task.git
cd softlligence-backend-task
```

### 2. Install Dependencies

Install project dependencies:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and configure your credentials.

### 4. Database Seeding

The application automatically seeds a default Super Admin account and baseline subscription plans (Free Starter, Professional, Enterprise) on server startup when connecting to the database.

### 5. Start the Application

#### Development Server

Start the development server with live reload:

```bash
npm run dev
```

The application runs by default on http://127.0.0.1:5000 or the port configured in `.env`.

#### Production Build and Start

Compile TypeScript into JavaScript:

```bash
npm run build
```

Run the compiled production server:

```bash
npm start
```

#### Code Formatting

Format source code:

```bash
npm run format
```

## Environment Configuration

Configure the following variables in `.env`:

* `PORT`: Application port number (Default: 5000)
* `IP`: Application IP address binding (Default: 127.0.0.1)
* `DATABASE_URL`: MongoDB connection URI
* `NODE_ENV`: Application environment (development or production)
* `BCRYPT_SALT_ROUNDS`: Number of rounds for password hashing (Default: 12)
* `JWT_SECRET`: Secret key for access token signing
* `JWT_EXPIRE_IN`: Access token expiration duration (e.g. 1d)
* `JWT_REFRESH_SECRET`: Secret key for refresh token signing
* `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration duration (e.g. 30d)
* `EMAIL_HOST`: SMTP mail server host (e.g. smtp.gmail.com)
* `EMAIL_PORT`: SMTP mail server port (e.g. 587)
* `EMAIL_USER`: SMTP account username or email
* `EMAIL_PASS`: SMTP account password or app password
* `EMAIL_FROM`: Sender address and display name for outbound emails
* `ADMIN_EMAIL`: Initial Super Admin email for automatic database seed
* `ADMIN_PASSWORD`: Initial Super Admin password for automatic database seed

## Postman API Documentation

Interactive API documentation containing complete endpoint specifications, request payloads, headers, and response examples is available at:

* Postman Documentation: https://documenter.getpostman.com/view/60453547/2sBYPwWrT1#1b1faf5e-063f-4a3d-a6a0-c480e6731aa5

## API Endpoints Reference

Base URL path: `/api/v1`

### Authentication (`/api/v1/auth`)

* POST `/signup` [Public]
  Register a new tenant or user account.

* POST `/login` [Public]
  Authenticate user and return access token and refresh token.

* POST `/verify-email` [Public]
  Verify user email address using one-time verification code.

* POST `/resend-otp` [Public]
  Resend a new email verification code.

* POST `/forget-password` [Public]
  Send password reset verification code to user email.

* POST `/reset-password` [Public]
  Reset account password using verified token.

* POST `/change-password` [Authenticated]
  Change password for currently authenticated user.

* POST `/refresh-token` [Public]
  Generate a new access token using a valid refresh token.

* DELETE `/delete-account` [Authenticated]
  Delete the currently authenticated user account.

### User Management (`/api/v1/users`)

* GET `/profile` [Authenticated]
  Get current user profile information.

* PATCH `/profile` [Authenticated]
  Update current user profile information.

* DELETE `/profile` [Authenticated]
  Delete current user profile.

* GET `/` [Super Admin, Admin, Tenant]
  Get list of users with search, filtering, and pagination.

* POST `/` [Public]
  Create a new user.

* POST `/create-member` [Tenant]
  Create and invite a new team member to tenant workspace.

* PATCH `/status/:id` [Super Admin, Tenant]
  Activate or deactivate user account by ID.

* PATCH `/:id/subscription` [Super Admin]
  Assign or update subscription plan for tenant by ID.

* GET `/:id` [Super Admin, Tenant]
  Retrieve details of a user by ID.

* PATCH `/:id` [Super Admin, Tenant]
  Update user or team member details by ID.

* DELETE `/:id` [Super Admin, Tenant]
  Delete user record by ID.

### Subscription Plans (`/api/v1/subscription-plans`)

* POST `/purchase` [Tenant]
  Purchase or subscribe to a subscription plan.

* GET `/my-plan` [Tenant, User]
  Get active subscription plan and resource quota status.

* POST `/` [Super Admin]
  Create a new subscription plan tier.

* GET `/` [Public]
  List all active subscription plans.

* GET `/:id` [Public]
  Get details of a specific subscription plan by ID.

* PATCH `/:id` [Super Admin]
  Update subscription plan pricing, limits, or description.

* DELETE `/:id` [Super Admin]
  Delete a subscription plan.

* PATCH `/:id/toggle-feature` [Super Admin]
  Enable or disable specific features within a plan.

### Project Management (`/api/v1/projects`)

* POST `/` [Tenant]
  Create a new project within tenant limits.

* GET `/` [Super Admin, Tenant, User]
  List all projects accessible to the caller.

* GET `/:id` [Super Admin, Tenant, User]
  Get single project details by ID.

* PATCH `/:id` [Tenant]
  Update project information and assignments.

* DELETE `/:id` [Tenant]
  Delete a project.

* PATCH `/:id/progress` [Tenant, User]
  Update project progress percentage and status.

* GET `/:id/activities` [Super Admin, Tenant, User]
  Retrieve activity audit history for a project.

### Analytics (`/api/v1/analytics`)

* GET `/admin-stats` [Super Admin, Admin]
  Retrieve platform metrics including total users, tenants, and active subscriptions.

* GET `/tenant-stats` [Tenant]
  Retrieve workspace metrics including project counts, member counts, and quota usage.

* GET `/user-stats` [User, Tenant]
  Retrieve personal project assignments and completion metrics.

## Contact Information

* Maintainer: Moshfiqur Rahman
* Email: moshfiqurrahman37@gmail.com
* GitHub: https://github.com/Emam-Bokhari
