# Jarvis Frontend

## Running the application

After installing the dependencies via ```npm install```, you can use ```npm run dev``` to start the development server.

## Infrastructure Dependencies

- Running Postgres instance

## Environment Variables

### Auth0 Related
You can use [this](https://auth0.com/docs/quickstart/webapp/nextjs/01-login) guide on how to set Auth0 related environment varibles.

- AUTH0_BASE_URL: The frontend URL, f.ex. 'http://localhost:3000'
- AUTH0_ISSUER_BASE_URL: Can be obtained from Auth0 console
- AUTH0_CLIENT_ID: Can be obtained from Auth0 console
- AUTH0_CLIENT_SECRET: Can be obtained from Auth0 console

### Application Related
- PRIVATE_BACKEND_URL: The private backend URL for increased security and speed. By default all API requests are done via server components which means if the API server is in the same private network, the request does not need to traverse the public internet. This is optional, public backend url will be used as a fallback value.
- PUBLIC_BACKEND_URL: Backend URL which is accessible via public internet. Since websocket requests originate from the browser, this is necessary to achieve connectivity with the socket server
- DB_URI: Connection string for the Postgres instance, f.ex. "postgresql://${user}:${pass}@${host}/${database}?sslmode=require&application_name=jarvis"
- NEXT_PUBLIC_GOOGLE_ANALYTICS_KEY: Optional key to enable Google Analytics 

### JWT Auth related

- AUTH0_API_AUDIENCE: Can be obtained from Auth0 console
- AUTH0_SECRET: You can use ```openssl rand -hex 32``` to generate this. 