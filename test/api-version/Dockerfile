FROM golang:latest as go-builder
WORKDIR /go/src/github.com/moolen/statusgraph/test/api-version
COPY go.mod go.sum ./
RUN go mod download
COPY main.go /go/src/github.com/moolen/statusgraph/test/api-version/
COPY config.yaml /go/src/github.com/moolen/statusgraph/test/api-version/
RUN CGO_ENABLED=0 go build -o api-version ./main.go

FROM alpine:3.10
COPY --from=go-builder /go/src/github.com/moolen/statusgraph/test/api-version/api-version /usr/local/bin/api-version
COPY config.yaml /etc/statusgraph/config.yaml

EXPOSE 8000
ENTRYPOINT ["/usr/local/bin/api-version", "-config", "/etc/statusgraph/config.yaml"]
