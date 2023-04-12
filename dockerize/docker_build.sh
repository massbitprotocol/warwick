# Get latest tag
git ls-remote --tags --sort='v:refname' git@github.com:massbitprotocol/warwick.git| tail -n1 | cut -d/ -f3 > WARWICK_TAG

# Get the version of WARWICK from tag
WARWICK_TAG=$(cat WARWICK_TAG)

# Get latest tag
git fetch --all --tags --force

# Checkout latest tag
git checkout tags/${WARWICK_TAG}

# Build docker image
docker build -f ./Dockerfile -t massbit/massbitroute_warwick:${WARWICK_TAG} ..

# docker-compose up -d --force-recreate