
.PHONY: binary
binary: bin
	go build -o bin/statusgraph ./main.go

.PHONY: test
test:
	go test -v -cover ./...

bin:
	mkdir bin
