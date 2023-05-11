# Get image tag name
WARWICK_TAG=$1

# Specify ENV
ENV=$(echo $FAIRY_TAG | awk -F- '{print $2}')

# Build docker image
docker build -f ./Dockerfile -t massbit/massbitroute_warwick:${WARWICK_TAG} ..

# Push docker image
docker push massbit/massbitroute_warwick:${WARWICK_TAG}
