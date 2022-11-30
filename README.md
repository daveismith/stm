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
3. Start proxy, frontend and backend
4. Run `./run_grok.sh`
5. Update the variable `serviceUrl` in `frontend/shoot-client/src/components/App/App.context.tsx` with the ngrok tunnel pointing to port 8080.
6. Navigate to the tunnel point to port 8001