# Weather Subscription API

A weather subscription service built with **NestJS** that allows users to subscribe for regular weather updates by email for a selected city. This project is implemented as part of the Software Engineering School 5.0 case task.

## 🌤️ Features

- Subscribe to weather updates (daily or hourly) by email
- Confirm subscription via unique tokenized email link
- Unsubscribe at any time
- Get real-time weather data (temperature, humidity, description)
- Swagger API documentation
- Fully dockerized setup
- Scheduled email notifications via cron
- Functional tests included

---

## 📦 Tech Stack

- **Backend**: NestJS, TypeORM
- **Database**: PostgreSQL
- **Email**: Nodemailer
- **Scheduler**: @nestjs/schedule
- **Weather API**: [weatherapi.com](https://www.weatherapi.com/)
- **Testing**: Jest, Supertest
- **Containerization**: Docker, Docker Compose
- **Deployment**: Render.com

---

## 🚀 Live Demo

- **API**: [https://weather-subscription-api-h5i1.onrender.com](https://weather-subscription-api-h5i1.onrender.com)
- **HTML Subscription Page**: [https://weather-subscription-api-h5i1.onrender.com/subscribe.html](https://weather-subscription-api-h5i1.onrender.com/subscribe.html)
- **Swagger UI**: [https://weather-subscription-api-h5i1.onrender.com/api/docs](https://weather-subscription-api-h5i1.onrender.com/api/docs)

---

## 📑 API Endpoints

| Method | Endpoint                      | Description                                 |
|--------|-------------------------------|---------------------------------------------|
| GET    | `/api/weather?city={city}`    | Get current weather for a given city        |
| POST   | `/api/subscribe`              | Subscribe email to weather updates          |
| GET    | `/api/confirm/{token}`        | Confirm the subscription via email token    |
| GET    | `/api/unsubscribe/{token}`    | Unsubscribe from weather notifications      |

> 📌 API contract strictly follows the `swagger.yaml` provided with the assignment.

---

## 🔧 Installation & Local Development

Before you start, make sure the following tools are installed on your machine:

| Tool        | Version    | Download link |
|-------------|------------|----------------|
| **Git**     | any        | [https://git-scm.com/](https://git-scm.com/) |
| **Node.js** | >= 20.x    | [https://nodejs.org/](https://nodejs.org/) |
| **Docker**  | Desktop v4+| [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) |
| **npm**     | bundled with Node.js | — |

> ✅ Recommended: Use Docker to simplify local setup and avoid installing PostgreSQL manually.

---

### 1. Clone the Repository

Run the following commands in your terminal:

- `git clone https://github.com/Denis-Bredun/Weather-Subscription-API.git`
- `cd Weather-Subscription-API`

---

### 2. Configure Environment Variables

Copy the example environment file:

- `cp .env.example .env`

Update the `.env` file with your API key (e.g., from weatherapi.com).

---

### 3. Start the App with Docker

To build and run the app using Docker Compose:

- `docker-compose up --build`

This will:
- Start the PostgreSQL database
- Run database migrations automatically
- Launch the API at `http://localhost:3000`

---

### 4. Access the Application

- **Swagger UI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Subscription Page**: [http://localhost:3000/subscribe.html](http://localhost:3000/subscribe.html)
- **Example Endpoint**: `GET /api/weather?city=Kyiv`

---

## 🧪 Testing

The project uses [Jest](https://jestjs.io/) for testing.

To run all tests, use:

- `npm test`

This command is configured as:

- `jest --verbose --silent=false --coverage`

It runs all tests with:
- Verbose output
- Code coverage report
- Non-silent mode (logs and console output are shown)

All tests are written using Jest and stored next to the source files in `src/`.  
There are **no** end-to-end tests in this project.

Mocking is done via [`jest-mock-extended`](https://www.npmjs.com/package/jest-mock-extended).

---

## 🏗️ Architecture & Design Notes

This project is built with [NestJS 11](https://docs.nestjs.com) and follows modular design principles with strong separation of concerns.

### Main Modules
- **WeatherModule**: Fetches real-time weather data using `axios`
- **SubscriptionModule**: Handles subscribing, confirming and unsubscribing emails
- **TasksModule**: Periodically sends weather emails via cron jobs

### Core Design Features
- 📦 Dependency injection via NestJS's DI container
- 🔁 Scheduled jobs with `@nestjs/schedule` and `node-cron`
- 📬 Email sending via `nodemailer`
- 🌍 Weather data fetching via HTTP using `axios`
- 🧾 API documentation via `@nestjs/swagger` (`/api/docs`)
- ✅ Input validation using `class-validator` and `ValidationPipe`
- 🧱 PostgreSQL with `TypeORM` and `typeorm` CLI for migrations
- 🔒 UUID-based token confirmation for subscriptions
- 🗂️ Static assets served from `public/` (`subscribe.html`, etc.)

### App Bootstrap Flow
- Loads `.env` config globally using `@nestjs/config`
- Registers TypeORM with custom `ormconfig.ts`
- Initializes and documents the API using Swagger
- Applies global validation pipe (`whitelist`, `transform`, etc.)
- Serves static HTML pages via `NestExpressApplication`

### Key Dependencies

**Runtime:**
- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`
- `@nestjs/typeorm`, `typeorm`, `pg`
- `@nestjs/schedule`, `node-cron`
- `@nestjs/swagger`, `swagger-ui-express`
- `class-validator`, `class-transformer`
- `axios`, `nodemailer`, `uuid`, `dotenv`

**Dev Tools:**
- `jest`, `ts-jest`, `jest-mock-extended`
- `eslint`, `prettier`, `typescript`, `@nestjs/testing`
- `ts-node`, `@swc/cli` for fast builds

---

## 🐳 Docker Overview

This project is fully dockerized using multi-stage builds for optimized performance and portability.

### 🧱 Components

- **Dockerfile** — builds, compiles, and runs the NestJS application  
- **docker-compose.yml** — defines services for the API and PostgreSQL  
- **wait-for-it.sh** — ensures PostgreSQL is ready before the app starts and migrations run

### 🚀 Usage

- **Start the entire stack:**  
  - `docker-compose up --build`

- **Stop and remove containers, networks, and volumes:**  
  - `docker-compose down -v`

- **Fully remove everything (including images):**  
  - `docker-compose down -v --rmi all`

- **Restart from scratch:**  
  - `docker-compose down -v --rmi all && docker-compose up --build`

### 📦 Features

- **Automatic migration execution on container startup:**  
  - `npx typeorm migration:run --dataSource dist/config/ormconfig.js`

- **PostgreSQL data** is persisted in a named Docker volume: `pgdata`

### 🌐 Default Ports

- **API:** http://localhost:3000  
- **Swagger Docs:** http://localhost:3000/api/docs  
- **Subscribe Page:** http://localhost:3000/subscribe.html  
- **PostgreSQL:** localhost:5432

---

## 🧪 Known Limitations / Future Improvements

- **No e2e tests yet** — only core logic is covered with tests
- **No rate limiting or CAPTCHA** — could be useful to prevent abuse of the subscription form
- **No unsubscribe confirmation page** — currently returns plain JSON; could be enhanced with an HTML page
- **Basic error pages** — errors return raw JSON, consider customizing error responses for better UX
- **No retry logic for failed emails** — mailer currently logs failures without retries
- **Token expiration** — not implemented for confirmation/unsubscribe tokens
- **i18n support** — responses and emails are in English only

---

## 📬 Contact

For feedback, bug reports, or feature requests:

- **GitHub:** [github.com/Denis-Bredun/Weather-Subscription-API](https://github.com/Denis-Bredun/Weather-Subscription-API)
- **Author:** Denis Bredun  
- **Email:** bredun.denis@gmail.com