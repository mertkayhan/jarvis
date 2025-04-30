# Jarvis Frontend

## Running the application

After installing the dependencies via ```npm install```, you can use ```npm run dev``` to start the development server.

## Infrastructure Dependencies

- Running Postgres instance

## Environment Variables

### Auth0 Related
You can use [this](https://auth0.com/docs/quickstart/webapp/nextjs/01-login) guide on how to set Auth0 related environment varibles.

- AUTH0_SECRET: You can use ```openssl rand -hex 32``` to generate this. 
- AUTH0_BASE_URL: The frontend URL, f.ex. 'http://localhost:3000'
- AUTH0_ISSUER_BASE_URL: Can be obtained from Auth0 console
- AUTH0_CLIENT_ID: Can be obtained from Auth0 console
- AUTH0_CLIENT_SECRET: Can be obtained from Auth0 console

### Application Related
- BACKEND_URL: The backend URL, f.ex. "http://127.0.0.1:8000"
- DB_URI: Connection string for the Postgres instance, f.ex. "postgresql://${user}:${pass}@${host}/${database}?sslmode=require&application_name=jarvis"
- NEXT_PUBLIC_GOOGLE_ANALYTICS_KEY: Optional key to enable Google Analytics 
- NEXT_PUBLIC_ENV: Optional, only for development purposes

### API related
You can use [this](https://auth0.com/docs/quickstart/backend/python/01-authorization) guide to set API related environment variables.

- AUTH0_API_CLIENT_ID: Can be obtained from Auth0 console
- AUTH0_API_CLIENT_SECRET: Can be obtained from Auth0 console
- AUTH0_API_AUDIENCE: Can be obtained from Auth0 console