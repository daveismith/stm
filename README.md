# Shoot The Moon

## Getting Started

### Prerequisites

* docker
* dotnetcore
* nodejs
  
### Starting the service containers

By default the backend runs on port 8000 and the frontend runs on port 8001

```sh
docker-compose up
```

### Starting the backend locally

```sh
cd backend/ShootTheMoon/ShootTheMoon
dotnet run
```

### Starting the frontend locally

```sh
cd frontend/shoot-client
npm install
npm start
```

### Swagger Documentation

```sh
localhost:8000/swagger/index.html
```