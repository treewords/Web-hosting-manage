# WebPanel - Modern & Open-Source Hosting Control Panel

WebPanel is an open-source, containerized web hosting control panel designed to be a modern alternative to cPanel. It runs on a VPS or Dedicated Server and provides a full suite of tools for managing web hosting resources.

## ✨ Features (Goal)

- **Authentication:** Secure JWT-based auth with 2FA and role-based access (Admin, Reseller, Client).
- **Domain Management:** Add/remove domains, and manage DNS records (A, CNAME, MX, etc.).
- **Email Management:** Create mailboxes, forwarders, and auto-replies.
- **Database Management:** Full control over MySQL/MariaDB databases and users.
- **File Management:** A web-based file manager and SFTP integration.
- **Resource Monitoring:** Real-time graphs for CPU, RAM, and disk usage.
- **SSL Certificates:** Free, automatic SSL certificates via Let's Encrypt.
- **Containerized:** Easy and fast installation with Docker and Docker Compose.

## 🛠️ Technology Stack

- **Backend:** Node.js (Express)
- **Frontend:** React
- **Database:** MariaDB (MySQL compatible)
- **Caching/Sessions:** Redis
- **Containerization:** Docker & Docker Compose

## 🚀 Getting Started

### Prerequisites

- A Linux server (Debian/Ubuntu recommended)
- Docker
- Docker Compose

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd webpanel
    ```

2.  **Run the installation script:**
    This script will guide you through the setup process.
    ```bash
    chmod +x install.sh
    ./install.sh
    ```

3.  **Review Configuration:**
    The script will create a `.env` file from the `.env.example` template. Make sure to open this file and change the default passwords and secrets.

    ```bash
    nano .env
    ```
    After saving your changes, you may need to restart the containers for them to take effect:
    ```bash
    docker-compose restart
    ```

## 🌐 Accessing the Panel

- **Frontend:** `http://<your_server_ip>`
- **Backend API:** `http://<your_server_ip>:4000`

## ⚙️ Development

To run in development mode with live reloading:

- **Backend:** In `docker-compose.yml`, change the `command` for the `backend` service to `npm run dev`.
- **Frontend:** The default `create-react-app` setup with Docker doesn't support live reloading out-of-the-box easily. The recommended approach for development is to run the frontend locally on your machine and have it connect to the backend API running in Docker.
