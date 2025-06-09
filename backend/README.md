# Jarvis Backend 

## Running the application

After installing the dependencies via ```poetry```, you can use ```python jarvis/app.py``` to start the development server.

## Infrastructure Dependecies

- Running Postgres instance
- A bucket in S3 compatible storage

## Environment Variables

### JWT Auth Related 

- AUTH0_SECRET: Secret key for JWT signature verification
- AUTH0_API_AUDIENCE: API audience for JWT token verification

### LLM Related

- GOOGLE_APPLICATION_CREDENTIALS: Create a service account with ```Storage Bucket Viewer```, ```Storage Object User```, ```Vertex AI User```, ```Service Account Token Creator``` permissions and download the JSON key and pass the path to the key.
- OPENAI_API_KEY: Can be created in OpenAI console
- ANTHROPIC_API_KEY: Optional, can be created in Antophic console

### Tool Related

- TAVILY_API_KEY: Web search tool is powered by [Tavily](https://tavily.com/). API key can be created in the console.
- LLAMA_CLOUD_API_KEY: Accurate PDF parsing is powered by [LlamaParse](https://cloud.llamaindex.ai/login). API key can be created in the console.

### Object Storage Related

- DOCUMENT_BUCKET: Name of the storage bucket. It should either start with "s3://" or "gs://"

For S3 compatible object stores following additional enviroment variables are included for flexibility:

- AWS_ACCESS_KEY_ID: Access key ID or user name
- AWS_SECRET_ACCESS_KEY: Secret access key or password
- AWS_ENDPOINT_URL: Override default URL to point to a different provider

### API Related

- CORS_ALLOWED_ORIGINS: A semi-colon seperated list of allowed origins for API and websocket access, f.ex. "http://localhost:3000;http://127.0.0.1:3000"
- HOST: Server host parameter, f.ex. "127.0.0.1" or "0.0.0.0"
