WARWICK_TAG=$(cat WARWICK_TAG)

# Gen docker-compose
cat ./docker-compose.yaml.tpl | \
    sed "s/\[\[WARWICK_TAG\]\]/$WARWICK_TAG/g" \
    > ./docker-compose.yaml

# Restart container
docker-compose up -d --force-recreate