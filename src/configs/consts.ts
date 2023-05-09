export const configDb = 'db';
export const configDbMonitor = 'db-monitor';
export const configGithub = 'github';
export const configGoogle = 'google';
export const configAuth = 'auth';
export const configLogService = 'logservice';
export const configCommon = 'common';
export const configRedis = 'redis';
export const configTasks = 'tasks';
export const datasourceMonitorDb = 'monitor-db';

export const MONITOR_TASKS_EVENT_QUEUE = "monitor-tasks";

export const REQUEST_SCHEME = process.env.REQUEST_SCHEME || "https";
export const CONFIG_MODE = process.env.CONFIG_MODE;
export const TASK_CONFIG = process.env.TASK_CONFIG;
export const TASK_CONFIG_LOCATION = process.env.TASK_CONFIG_LOCATION;
export const SHARE_CONFIG = process.env.SHARE_CONFIG;
export const SHARE_CONFIG_LOCATION = process.env.SHARE_CONFIG_LOCATION;
export const BLOCK_CHAIN_CONFIG = process.env.BLOCK_CHAIN_CONFIG;
export const BLOCK_CHAIN_CONFIG_LOCATION = process.env.BLOCK_CHAIN_CONFIG_LOCATION;

export enum EStatus {
  ACTIVE = 1,
  INACTIVE = 0,
}

export enum EGatewayStatus {
  CREATED = 'created',
  VERIFIED = 'verified',
  STAKED = 'staked',
  UNSTAKE = 'unstake',
  UNHEALTHY = 'unhealthy',
}

export enum EDapiProvider {
  MASSBIT = 'MASSBIT',
  INFURA = 'INFURA',
  GETBLOCK = 'GETBLOCK',
  QUICKNODE = 'QUICKNODE',
  CUSTOM = 'CUSTOM',
}

export enum PROVIDERS {
  MASSBIT = 0,
  CUSTOM = 1,
  GETBLOCK = 2,
  QUICKNODE = 3,
  INFURA = 4
}

export enum EBlockChain {
  ETHEREUM = 'eth',
  NEAR = 'near',
  Harmony = 'hmny',
  POLKADOT = 'dot',
  AVALANCHE = 'avax',
  FANTOM = 'ftm',
  POLYGON = 'matic',
  BSC = 'bsc',
  SOLANA = 'sol',
}

export enum ENetWork {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  RINKEBY = 'rinkeby',
}

export enum EZONE {
  ASIA = 'AS',
  EUROPE = 'EU',
  NORTH_AMERICA = 'NA',
  SOUTH_AMERICA = 'SA',
  AFRICA = 'AF',
  OCEANIA = 'OC',
}

export enum ENodeStatus {
  CREATED = 'created',
  VERIFIED = 'verified',
  STAKED = 'staked',
  UNSTAKE = 'unstake',
  UNHEALTHY = 'unhealthy',
}

export enum EOperateStatus {
  RUNNING = 'running',
  INVESTIGATE = 'investigate',
  REPORTED = 'reported',
  STOPPED = 'stopped'
}

export enum EBoolean {
  TRUE = 1,
  FALSE = 0,
}

export const INITABLE_GATEWAY_STATUS = [
  EGatewayStatus.CREATED,
]

export const RELOADABLE_GATEWAY_STATUS = [
  EGatewayStatus.VERIFIED,
  EGatewayStatus.STAKED,
  EGatewayStatus.UNHEALTHY,
]

export const INACTIVE_NODE_STATUS = [
  ENodeStatus.CREATED,
  ENodeStatus.VERIFIED,
  ENodeStatus.UNHEALTHY,
  ENodeStatus.UNSTAKE,
]

export const INACTIVE_GATEWAY_STATUS = [
  EGatewayStatus.CREATED,
  EGatewayStatus.VERIFIED,
  EGatewayStatus.UNHEALTHY,
  EGatewayStatus.UNSTAKE,
]

export type DbAction = "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE";
export type DbEventName = "node-change" | "gateway-change" | "geo-change" | "api-change" | "entrypoint-change";
export enum ConfigMode {
  FILE = "file",
  ENV = "env"
}

export enum DatasourceType {
  RunningGateway = "running-gateway",
  InvestigateGateway = "investigate-gateway",
  RunningNode = "running-node",
  InvestigateNode = "investigate-node",
}

export enum ValidateRule{
  Http = "http",
  HttpSuccess = "http-success",
  MapResponseField = "map-response-field",
  ChangeStatusInvestigate = "change-status-investigate",
  ChangeStatusRunning = "change-status-running",
  ChangeStatusReported = "change-status-reported",
  CheckChainId = "check-chain-id",
  CheckBlockLate = "check-block-late",
  Schedule = "schedule",
  ScheduleIfNotExist = "schedule-if-not-exist",
  RemoveFromScheduler = "remove-from-scheduler",
  Reduce = "reduce"
}

export enum ReduceOperator{
  Max = "max",
  ParseHex = "parse-hex",
  Set = "set"
}
