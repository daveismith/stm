#!/bin/sh

docker run -it --rm --name envoy -p 8080:8080 -p 9901:9901 -v $(pwd)/envoy-dev.yaml:/etc/envoy/envoy.yaml -v $(pwd)/logs:/tmp/ envoyproxy/envoy:v1.31-latest
