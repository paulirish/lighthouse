## How to compile protos + use locally

1. Install the proto compiler
    1. Manual install
        1. Get the latest proto [release](https://github.com/protocolbuffers/protobuf/releases) (select one with python included if you want to run this validator)
        1. Install the [C++ Protocol Buffer Runtime](https://github.com/protocolbuffers/protobuf/blob/master/src/README.md)
    1. Brew install
        1. `brew install protobuf`
1. Run `yarn compile-proto` then `yarn build-proto-roundtrip`

## Proto Resources
- [Protobuf Github Repo](https://github.com/protocolbuffers/protobuf) 
- [Protobuf Docs](https://developers.google.com/protocol-buffers/docs/overview)

## LHR Round Trip Flow
```
LHR round trip flow:
    (Compiling the Proto)
    lighthouse_result.proto -> protoc --python_out ... -> lighthouse_result.pb2
                                                                  ⭏
                                                               (used by)
    (Making a Round Trip JSON)                                     ⭏
    lhr.json --> proto_preprocessor.js -> lhr_processed.json -> json_roundtrip_via_proto.py -> lhr.round_trip.json
```

## Hacking Hints
- Clean out compiled proto and json with `yarn clean`
- Round trips might jumble the order of your JSON keys and lists!
- Is your `six` installation troubling your `pip install protobuf`? Mine did.  Try `pip install --ignore-installed six`.