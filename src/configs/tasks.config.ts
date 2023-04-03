import { registerAs } from "@nestjs/config";
import { classToPlain, instanceToPlain, plainToClass } from "class-transformer";
import { ApplicationTask, SchedulerTask } from "src/models/scheduler-task.model";
import { TaskConfig } from "src/models/share-config.model";
import { configTasks, ConfigMode, TASK_CONFIG, TASK_CONFIG_LOCATION, CONFIG_MODE, SHARE_CONFIG_LOCATION, SHARE_CONFIG } from "./consts";
const yaml = require("js-yaml");
const fs = require("fs");

export const compileConfig = (taskConfig: TaskConfig, shareConfigs: Map<string, TaskConfig>): TaskConfig => {
    if (taskConfig.useConfig) {
        let finalConfig = taskConfig.useConfig.reduce((cfg, configName) => {
            const shareConfig = shareConfigs.get(configName);
            if (!shareConfig) {
                throw new Error(`Not found share config ${configName}`)
            }
            return {
                ...cfg,
                ...(instanceToPlain(shareConfig))
            }
        }, {})
        finalConfig = {
            ...finalConfig,
            ...(instanceToPlain(taskConfig))
        }
        return plainToClass(TaskConfig, finalConfig)
    }
    return taskConfig
}

export default registerAs(configTasks, () => {
    let taskConfigs = [], shareConfigs = {}
    switch (CONFIG_MODE) {
        case ConfigMode.FILE:
            console.log("Load task config from file")
            taskConfigs = yaml.load(fs.readFileSync(TASK_CONFIG_LOCATION, 'utf8'));
            shareConfigs = yaml.load(fs.readFileSync(SHARE_CONFIG_LOCATION, 'utf8'))
            break
        case ConfigMode.ENV:
            console.log("Load task config from env")
            taskConfigs = yaml.load(TASK_CONFIG);
            shareConfigs = yaml.load(SHARE_CONFIG);
            break
        default:
            break
    }
    shareConfigs = Object.keys(shareConfigs).reduce((acc, shareConfigName) => {
        const shareConfig = plainToClass(TaskConfig, shareConfigs[shareConfigName])
        acc.set(shareConfigName, shareConfig)
        return acc
    }, new Map<string, TaskConfig>()) as Map<string, TaskConfig>
    taskConfigs = taskConfigs.map((json) => {
        const taskConfig = plainToClass(SchedulerTask, json)
        taskConfig.config = compileConfig(taskConfig.config, shareConfigs as Map<string, TaskConfig>)
        return taskConfig;
    })
    return new ApplicationTask(shareConfigs as Map<string, TaskConfig>, taskConfigs);
})