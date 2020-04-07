FROM golang:latest as go-builder
WORKDIR /go/src/github.com/moolen/statusgraph/test/prom-tester
COPY go.mod go.sum ./
RUN go mod download
COPY main.go /go/src/github.com/moolen/statusgraph/test/prom-tester/
COPY config.yaml /go/src/github.com/moolen/statusgraph/test/prom-tester/
RUN CGO_ENABLED=0 go build -o prom-tester ./main.go

FROM alpine:3.10
COPY --from=go-builder /go/src/github.com/moolen/statusgraph/test/prom-tester/prom-tester /usr/local/bin/prom-tester
COPY config.yaml /etc/statusgraph/config.yaml

EXPOSE 8000
ENTRYPOINT ["/usr/local/bin/prom-tester", "-config", "/etc/statusgraph/config.yaml"]
