import { registerAs } from "@nestjs/config";
import { configRedis } from "./consts";

export default registerAs(configRedis, () => ({
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
}))