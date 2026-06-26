````markdown
# Candida auris Dashboard Austria

## Overview

The **Candida auris Dashboard Austria** is a web-based application for the collection, management, and visualization of epidemiological data related to *Candida auris* cases in Austria.

The platform provides:

- A publicly accessible dashboard
- A structured reporting form for submitting new case reports
- A protected administration area for authorized users

The goal of the project is to support the epidemiological surveillance, analysis, and documentation of *Candida auris* cases in Austria.

---

# Key Features

## Public Dashboard

- Visualization of aggregated *Candida auris* case numbers
- Display of epidemiological trends over time
- Geographic visualization by Austrian federal state
- Travel history visualization at country level
- Display of clades and epidemiological categories
- Public access without authentication

## Case Reporting

- Structured online reporting form
- Validation of required fields
- Submission of new case reports
- Automatic email forwarding of submitted reports
- Protection against automated submissions (CAPTCHA)

## Data Management

- Protected administration area
- Authentication for authorized users
- Management and updating of stored reports
- Traceability of changes and updates
- Manual integration of reviewed reports into the system

## Information Section

- Background information about *Candida auris*
- Information about the reporting process
- Support for healthcare professionals and interested users

---

# System Architecture

The application follows a **three-tier architecture**.

## Frontend

- React
- Vite
- Responsive user interface
- Interactive charts and maps

## Backend

- FastAPI
- REST-based interfaces
- Authentication and business logic

## Database

- PostgreSQL
- Persistent storage of epidemiological data

## Communication

- REST API
- JSON data exchange

## Authentication

- OAuth2-based authentication
- JWT (JSON Web Token)
- Password hashing using bcrypt
- Protected administration area
- Public dashboard functions accessible without login

---

# Technologies Used

| Component | Technology |
|-----------|------------|
| **Frontend** | React, Vite |
| **Backend** | FastAPI |
| **Database** | PostgreSQL |
| **API** | REST, JSON |
| **Hosting** | AWS |
| **Security** | Authentication, CAPTCHA |

---

# Installation

## Start the Frontend

```bash
cd frontend
npm install
npm run dev
````

## Start the Backend

```bash
cd backend
```

### Optional: Create a virtual Python environment

#### Windows

```bash
python -m venv .venv
.\.venv\Scripts\activate
```

#### Linux/macOS

```bash
python -m venv .venv
source .venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Start the backend server:

```bash
uvicorn app.main:app --reload
```

---

# Environment Configuration

Before starting the backend, create a `.env` file in the `backend` directory.

Example:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cauris_db

MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your_email@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com

SECRET_KEY=your_secret_key

RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

---

# Environment Variables

| Variable               | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `DATABASE_URL`         | PostgreSQL database connection string                  |
| `MAIL_USERNAME`        | Email account used for report submissions              |
| `MAIL_PASSWORD`        | Password or application password for the email account |
| `MAIL_FROM`            | Sender address used for outgoing emails                |
| `MAIL_PORT`            | SMTP server port                                       |
| `MAIL_SERVER`          | SMTP server address (e.g. smtp.gmail.com)              |
| `SECRET_KEY`           | Secret key used to sign JWT tokens                     |
| `RECAPTCHA_SECRET_KEY` | Secret key for Google reCAPTCHA                        |

The values must be adjusted according to the respective development, testing, or production environment.

**Database**

PostgreSQL is used for data storage. Connection settings must be configured according to the local environment.

---

# Deployment

The application is designed for deployment in an AWS-based cloud environment.

The production environment consists of:

* Frontend application
* FastAPI backend
* PostgreSQL database
* Public access through a domain
* HTTPS support using SSL/TLS certificates

---

# Privacy and Security

The dashboard displays only aggregated and anonymized information.

The following data is **not displayed**:

* Personal information
* Patient data
* Sensitive individual records
* Identifiable healthcare institutions

Access to data management functions is restricted to authorized users through a protected administration area.

The reporting form includes protection mechanisms against automated or abusive submissions.

---

# Project Team

* Cristina Postoronca
* Oyu-Erdene Khurelbaatar
* Linlin Kou

---

# Academic Context

**FH Campus Wien**

**Study Program**

Computer Science and Digital Communications (CSDC)

**Course**

Elective Project 1

---

# Project Status

Current status:

* Dashboard implemented
* Administration area implemented
* Reporting form implemented
* Interactive visualizations available
* Deployment and production rollout in preparation

---

# License

This project was developed as part of an academic collaboration and is intended to support the epidemiological surveillance and documentation of *Candida auris* cases in Austria.

```
```
