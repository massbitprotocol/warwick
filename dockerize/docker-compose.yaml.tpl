version: '3.8'
networks:
  mbr_test_network_99:
    driver: bridge
    external: true
services:
  warwick_99:
    privileged: true
    networks:
      mbr_test_network_99:

    restart: unless-stopped
    image: massbit/massbitroute_warwick:[[WARWICK_TAG]]
    container_name: mbr_warwick_99
    environment:
      - DB_HOST=mbr_db_beta_99
      - DB_PORT=5432
      - DB_USERNAME=postgres
      - DB_PASSWORD=postgres
      - DB_DATABASE=massbit-user
      - DB_LOGGING=false

      - REDIS_HOST=mbr_redis_99
      - REDIS_PORT=6379

      # basic auth
      - BASIC_USER=403716b0f58a7d6ddec769f8ca6008f2c1c0ce33
      - BASIC_PASSWORD=fc78b64c5c33f3f270700b0c4d3e799818803511

      # gwman
      - CONFIG_MODE=file
      - TASK_CONFIG_LOCATION=/massbit/massbitroute/app/src/services/tasks.yaml
      - SHARE_CONFIG_LOCATION=/massbit/massbitroute/app/src/services/shareConfigs.yaml
      - BLOCK_CHAIN_CONFIG_LOCATION=/massbit/massbitroute/app/src/services/blockchainConfigs.yaml
    volumes:
      - ./tasks.yaml:/massbit/massbitroute/app/src/services/tasks.yaml
      - ./shareConfigs.yaml:/massbit/massbitroute/app/src/services/shareConfigs.yaml
      - ./blockchainConfigs.yaml:/massbit/massbitroute/app/src/services/blockchainConfigs.yaml
    extra_hosts:
      - "hostmaster.massbitroute.net:172.24.99.254"
      - "ns1.massbitroute.net:172.24.99.254"
      - "ns2.massbitroute.net:172.24.99.254"
      - "api.massbitroute.net:172.24.99.254"
      - "stat.mbr.massbitroute.net:172.24.99.254"
      - "monitor.mbr.massbitroute.net:172.24.99.254"
      - "chain.massbitroute.net:172.24.99.20"
      - "portal.massbitroute.net:172.24.99.254"
      - "portal-beta.massbitroute.net:172.24.99.254"
      - "admin-beta.massbitroute.net:172.24.99.254"
      - "dapi.massbitroute.net:172.24.99.254"
      - "scheduler.fisherman.massbitroute.net:172.24.99.254"
      - "api.ipapi.com:172.24.99.254"
      - "staking.massbitroute.net:172.24.99.254"
      - "ipv4.icanhazip.com:172.24.99.254"
      - "git.massbitroute.net:172.24.99.5"