#!/bin/sh

docker run -it --rm --name envoy -p 8080:8080 -v $(pwd)/envoy-dev.yaml:/etc/envoy/envoy.yaml envoyproxy/envoy:v1.21-latest
