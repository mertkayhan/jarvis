#!/bin/sh
set -e;
sleep 5;
echo "Connecting to minio instance...";
mc alias set myminio http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD;
echo "Creating document bucket...";
mc mb -p myminio/jarvis-docs;
echo "Done.";
