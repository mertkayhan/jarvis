# Cloud Run Deployment

## Frontend 

You can deploy the frontend as a standard Cloud Run application without much custom configuration. You can use the ```mkayhan/jarvis-frontend:${IMAGE_TAG}``` and set the necessary environment variables outlined under ```frontend``` folder.

## Backend

You can refer to [this](https://cloud.google.com/run/docs/triggering/websockets) guide on how to deploy Jarvis backend on Cloud Run and use ```mkayhan/jarvis-backend:${IMAGE_TAG}``` and set the necessary environment variables outlined under ```backend``` folder.

### TL;DR

- Increase the request timeout period to the maximum duration you would like to keep the WebSockets stream open, for example 60 minutes.
- Don't enable HTTP/2 end-to-end.