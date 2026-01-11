#!/bin/bash

#
# Run this script from the root directory of the project or it will fail
#

curl -s https://models.dev/api.json -o src/assets/model-lists/models-dev.json
