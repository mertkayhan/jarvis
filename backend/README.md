# Jarvis Backend 

## Running the application

After installing the dependencies via ```poetry```, you can use ```python jarvis/app.py``` to start the development server.

## Infrastructure Dependecies

- Running Postgres instance
- Google Cloud Storage bucket

## Environment Variables

### Auth0 Related 
You can use [this](https://auth0.com/docs/quickstart/backend/python/01-authorization) guide to set Auth0 related environment variables.

- AUTH0_DOMAIN: Can be obtained from the console
- AUTH0_AUDIENCE: Can be obtained from the console

### LLM Related

- GOOGLE_APPLICATION_CREDENTIALS: Create a service account with ```Storage Bucket Viewer```, ```Storage Object User```, ```Vertex AI User```, ```Service Account Token Creator``` permissions and download the JSON key and pass the path to the key.
- OPENAI_API_KEY: Can be created in OpenAI console
- ANTHROPIC_API_KEY: Optional, can be created in Antophic console

### Tool Related

- TAVILY_API_KEY: Web search tool is powered by [Tavily](https://tavily.com/). API key can be created in the console.
- LLAMA_CLOUD_API_KEY: Accurate PDF parsing is powered by [LlamaParse](https://cloud.llamaindex.ai/login). API key can be created in the console.

### Object Storage Related

- GOOGLE_PROJECT: Google project id
- DOCUMENT_BUCKET: Name of the Cloud Storage Bucket

### API Related

- CORS_ALLOWED_ORIGINS: A semi-colon seperated list of allowed origins for API and websocket access, f.ex. "http://localhost:3000;http://127.0.0.1:3000"
- HOST: Server host parameter, f.ex. "127.0.0.1" or "0.0.0.0"
