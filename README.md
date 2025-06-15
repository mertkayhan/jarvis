# Jarvis: AI-Powered Personal Assistant

Jarvis is an AI-powered conversational assistant designed for seamless knowledge access and automation. This project aims to provide an intuitive system that can be used by anyone with minimal training or onboarding.

## Overview

- Frontend: Built with Next.js and Shadcn components for a responsive and modern user interface.

- Backend: Utilizes Python, FastAPI, Socket.io, and LangGraph to handle AI interactions and real-time communication.

- Infrastructure requirements: Running Postgres instance, a bucket in S3 compatible storage

## Quick Start

- Copy the environment file via ```cp .env.example .env ``` and add the necessary values (API keys, secrets, etc.). You can find more detailed documentation on this in ```backend``` and ```frontend``` directories respectively.
- Start the stack: ``` docker-compose up --build ```
- Access to services:
    - Frontend: http://localhost:3000
    - Backend: http://localhost:8000
    - MinIO Console: http://localhost:9001

## Modules

### Chat 

The chat functionality supports OpenAI, Google and Antrophic models for a seamless multimodal chat experience. You can also add external knowledge and get AI assistant to provide responses based on your data. 

On the right hand side, you can also see the so called "Context Explorer" which provides refereces to the knowledge pieces the AI agent has used to come up with its answer.

### Personalities

Personalities allow users to create custom AI agents with tailored instructions, default internal knowledge and tool access.

### Knowledge

#### Document Repository

This module is designed for adhoc, singular document analysis. It supports pdf, csv, txt and xlsx formats. 

This module does not support Office formats except Excel on purpose. I have always found it difficult to deal with 3rd party Office plugins, and therefore, the system only accepts PDF inputs from users.

#### Question Packs

This module is the one stop shop for your FAQ data which can cover use cases ranging from customer service to technical documentation.

You can craft answers to your questions using a builtin multimodal rich text editor and the system will be able to integrate your data with AI models perfectly while preserving content layout.

The system uses hybrid search built on Postgres using pgvector and tsvector under the hood.

#### Document Packs

Having singular document analysis does not nearly cover all the use cases. Therefore, the document pack module has been built for your domain specific document sets.

The system uses Microsoft's [GraphRAG](https://microsoft.github.io/graphrag/) under the hood to retain the capability of answering very specific questions as well as generic ones about the documents.

## Roadmap

- Local models for more privacy
- Generative UI for better agentic behaviour outlet
- Web scraping
- Deep research
