import { registerAs } from "@nestjs/config";
import { plainToClass } from "class-transformer";
import { SchedulerTask } from "src/models/scheduler-task.model";
import { configTasks, ConfigMode, TASK_CONFIG, TASK_CONFIG_LOCATION, TASK_CONFIG_MODE } from "./consts";
const yaml = require("js-yaml");
const fs = require("fs");

export default registerAs(configTasks, () => {
    let jsons = []
    switch (TASK_CONFIG_MODE) {
        case ConfigMode.FILE:
            console.log("Load task config from file")
            jsons = yaml.load(fs.readFileSync(TASK_CONFIG_LOCATION, 'utf8'));
            break
        case ConfigMode.ENV:
            console.log("Load task config from env")
            jsons = yaml.load(TASK_CONFIG);
            break
        default:
            break
    }
    jsons = jsons.map((j) => plainToClass(SchedulerTask, j))
    console.log(JSON.stringify(jsons))
    return jsons;
})