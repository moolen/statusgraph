
.PHONY: binary
binary: bin
	go build -o bin/statusgraph ./main.go

bin:
	mkdir bin
