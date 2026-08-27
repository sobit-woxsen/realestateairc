# Real Estate API

A robust RESTful API backend for a real estate platform, allowing users to browse properties, agents to manage listings, and administrators to oversee the entire system.

## Tech Stack
- Node.js / Express
- PostgreSQL / Prisma ORM
- JWT Authentication
- OpenAPI / Swagger

## Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

## Getting Started

### 1. Clone and Install
```bash
git clone <repo-url>
cd real-estate
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your database URL and secrets
```

**Environment Variables:**
- `DATABASE_URL`: Connection string for PostgreSQL (e.g., `postgresql://user:password@localhost:5432/realestate?schema=public`)
- `PORT`: The port the server will run on (default: `3000`)
- `JWT_SECRET`: Secret key for signing access tokens
- `JWT_REFRESH_SECRET`: Secret key for signing refresh tokens
- `NODE_ENV`: Application environment (`development` or `production`)

### 3. Database Setup
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Seed Database
```bash
npm run seed
```
*Note: The script will prompt you to enter email addresses for the admin, agent, and client accounts. The default password for all seeded users is: `Password123!`*

### 5. Run the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## API Documentation
Once the server is running, you can access the Swagger UI documentation at:
`http://localhost:3000/api-docs`

## API Endpoints Summary

| Method | Path | Access Level | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive tokens |
| POST | `/api/auth/refresh` | Public | Get new access token using refresh token |
| GET | `/api/users/me` | Authenticated | Get current user profile |
| GET | `/api/properties` | Public | List and search properties |
| GET | `/api/properties/:id` | Public | Get property details |
| POST | `/api/properties` | Admin/Agent | Create a new property listing |
| PUT | `/api/properties/:id` | Admin/Agent | Update a property listing |
| DELETE| `/api/properties/:id` | Admin/Agent | Delete a property listing |
| GET | `/api/inquiries` | Admin/Agent/Client | List inquiries (scoped by role) |
| POST | `/api/inquiries` | Client | Create a new inquiry for a property |
| GET | `/api/favorites` | Client | List user's favorite properties |
| POST | `/api/favorites` | Client | Add property to favorites |
| DELETE| `/api/favorites/:id` | Client | Remove property from favorites |

*(See Swagger UI for full endpoint details and payloads)*

## User Roles
- **ADMIN**: Full access to all resources. Can manage users, all properties, and view all inquiries.
- **AGENT**: Can manage their own property listings and view inquiries assigned to them or their properties.
- **CLIENT**: Can view available properties, create inquiries, and manage their own favorite properties.

## Authentication
This API uses JSON Web Tokens (JWT) for authentication.
1. Register or Login to receive an `accessToken` and a `refreshToken`.
2. Include the access token in the `Authorization` header for protected routes:
   `Authorization: Bearer <your_access_token>`
3. Access tokens expire quickly. When expired, use the `/api/auth/refresh` endpoint with your refresh token to obtain a new access token.

## Deploying to Render

### Using Blueprint (render.yaml)
1. Push your code to GitHub.
2. Connect your repository to Render.
3. Select **New Blueprint Instance**.
4. Render will read the `render.yaml` file and automatically provision the web service and the PostgreSQL database.
5. Set any additional environment variables if prompted in the Render dashboard.
6. Deploy the service.

### Manual Setup
1. **Create PostgreSQL Database:** Go to Render dashboard and create a new PostgreSQL database. Note the Internal Database URL.
2. **Create Web Service:** Create a new Web Service and connect your GitHub repository.
3. **Configure Build & Start:**
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `node src/server.js` (or `npm start`)
4. **Environment Variables:** Add the following to your Web Service:
   - `DATABASE_URL`: Set to the Internal Database URL from step 1.
   - `JWT_SECRET`: A secure random string.
   - `JWT_REFRESH_SECRET`: A secure random string.
   - `NODE_ENV`: `production`

## Project Structure
```text
real-estate/
├── prisma/
│   ├── schema.prisma      # Prisma schema definition
│   └── seed.js            # Database seeding script
├── src/
│   ├── controllers/       # Route request handlers
│   ├── middlewares/       # Express middlewares (auth, validation, etc.)
│   ├── routes/            # Express route definitions
│   ├── services/          # Business logic and database operations
│   ├── utils/             # Helper functions and utilities
│   └── server.js          # Express app setup and server entry point
├── .env.example           # Example environment variables
├── package.json           # Project metadata and dependencies
└── README.md              # Project documentation
```

## License
MIT
