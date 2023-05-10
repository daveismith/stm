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

### Starting the proxy locally

```sh
cd proxy
docker run -it --rm --name envoy -p 8080:8080 -v $(pwd)/envoy-dev.yaml:/etc/envoy/envoy.yaml envoyproxy/envoy:v1.17-latest
```

### Starting the frontend locally

```sh
cd frontend/shoot-client
npm install
npm start
```

### Generating Typescript Files from schema

This assumes that you've got protoc and the appropriate extension for generating the gRPC-web services installed and in your path. You can find more info at [grpc-web github](https://github.com/grpc/grpc-web) in the code generator plugin section.

```sh
cd frontend/shoot-client
protoc -I ../../backend/ShootTheMoon/ShootTheMoon/schema shoot.proto --js_out=import_style=commonjs,binary:src/proto --grpc-web_out=import_style=typescript,mode=grpcwebtext:src/proto
```

## Hosting with ngrok

1. Sign up for an account
2. Create `ngrok_auth.yml` and add content
   ```yaml
   version: "2"
   authtoken: <your_auth_token>
   ```
3. Run `./run_grok.sh`
4. Start proxy and backend
5. Start your front-end and it will auto-detect if ngrok is in use and update the pointer to the server.
6. Navigate to the URL ngrok shows as forwarding to local port 8001/