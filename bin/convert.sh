#!/bin/bash
INPUT=$1
ffmpeg -i "$INPUT" -ar 16000 -ac 1 -c:a pcm_s16le output.wav