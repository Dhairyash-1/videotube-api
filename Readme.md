# Videotube API

A video sharing platform API built with Node.js, Express.js, and MongoDB, featuring user authentication, video uploads, playlists, subscriptions, and more.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Validation**: Express Validator
- **Rate Limiting**: Express Rate Limit
- **Containerization**: Docker, Docker Compose

## Setup Instructions

### Prerequisites

- Docker installed on your system
- Docker Compose installed on your system

### Steps

1. Clone the repository: `git clone https://github.com/your-username/videotubeapi.git`
2. Navigate to the project directory: `cd videotubeapi`
3. Create environment variables: `cp .env.sample .env`
4. Edit `.env` file and enter your:
   - Cloudinary Cloud Name
   - Cloudinary API Key
   - Cloudinary API Secret
   - Other secrets (e.g., JWT secret, MongoDB URI)
5. Build and start containers: `docker-compose up -d`
6. Test the API: `curl http://localhost:8080/api/v1/healthcheck`
