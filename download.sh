#!/usr/bin/env bash

rm -rf typescript
curl -L https://github.com/Microsoft/TypeScript/archive/v1.8.10.tar.gz | tar xvz --exclude=*/tests/* --exclude=*/doc/*;
mv TypeScript-* typescript;