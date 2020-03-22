FROM golang:latest as go-builder
WORKDIR /go/src/github.com/moolen/statusgraph
COPY go.mod go.sum ./
RUN go mod download
COPY ./cmd /go/src/github.com/moolen/statusgraph/cmd
COPY ./pkg /go/src/github.com/moolen/statusgraph/pkg
COPY main.go /go/src/github.com/moolen/statusgraph/
RUN CGO_ENABLED=0 go build -o statusgraph ./main.go

FROM node:13 as client-builder
RUN npm install webpack -g
WORKDIR /tmp
COPY client/package.json /tmp/
RUN npm install
WORKDIR /usr/src/app
COPY client /usr/src/app/
RUN cp -a /tmp/node_modules /usr/src/app/
ENV NODE_ENV=production
RUN npm run build:prod

FROM alpine:3.10

COPY --from=go-builder /go/src/github.com/moolen/statusgraph/statusgraph /usr/local/bin/statusgraph
COPY config.yaml /etc/statusgraph/config.yaml
COPY --from=client-builder /usr/src/app/dist /www
EXPOSE 8000
ENTRYPOINT ["/usr/local/bin/statusgraph"]
