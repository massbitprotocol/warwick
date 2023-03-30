export const configDb = 'db';
export const configGithub = 'github';
export const configGoogle = 'google';
export const configAuth = 'auth';
export const configLogService = 'logservice';
export const configCommon = 'common';
export const configRedis = 'redis';
export const configTasks = 'tasks';

export const DB_EVENT_QUEUE = "db-event";

export const REQUEST_SCHEME = process.env.REQUEST_SCHEME || "https";
export const TASK_CONFIG_LOCATION = process.env.TASK_CONFIG_LOCATION;
export const TASK_CONFIG_MODE = process.env.TASK_CONFIG_MODE;
export const TASK_CONFIG = process.env.TASK_CONFIG;

export enum EStatus {
  ACTIVE = 1,
  INACTIVE = 0,
}

export enum EGatewayStatus {
  CREATED = 'created',
  INSTALLED = 'installed',
  VERIFYING = 'verifying',
  VERIFIED = 'verified',
  FAILED = 'failed',
  APPROVED = 'approved',
  STAKED = 'staked',
  UNSTAKE = 'unstake',
  REPORTED = 'reported',
  STOPPED = 'stopped',
  INVESTIGATE = 'investigate',
  INVESTIGATING = 'investigating',
  INVESTIGATE_FAIL = 'investigate_fail',
  DISAPPROVED = 'disapproved',
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
  INSTALLED = 'installed',
  VERIFYING = 'verifying',
  VERIFIED = 'verified',
  FAILED = 'failed',
  APPROVED = 'approved',
  STAKED = 'staked',
  UNSTAKE = 'unstake',
  REPORTED = 'reported',
  STOPPED = 'stopped',
  INVESTIGATE = 'investigate',
  INVESTIGATING = 'investigating',
  INVESTIGATE_FAIL = 'investigate_fail',
  DISAPPROVED = 'disapproved',
}

export enum EOperateStatus {
  IGNORED = 'ignored',
  WAITING = 'waiting',
  SUCCESS = 'success',
}

export enum EBoolean {
  TRUE = 1,
  FALSE = 0,
}

export const INITABLE_GATEWAY_STATUS = [
  EGatewayStatus.CREATED,
  EGatewayStatus.INSTALLED,
  EGatewayStatus.VERIFYING,
]

export const RELOADABLE_GATEWAY_STATUS = [
  EGatewayStatus.VERIFIED,
  EGatewayStatus.STAKED,
  EGatewayStatus.INVESTIGATE,
  EGatewayStatus.INVESTIGATING,
  EGatewayStatus.INVESTIGATE_FAIL,
  EGatewayStatus.REPORTED,
]

export const INACTIVE_NODE_STATUS = [
  ENodeStatus.CREATED,
  ENodeStatus.FAILED,
  ENodeStatus.UNSTAKE,
  ENodeStatus.REPORTED,
  ENodeStatus.STOPPED,
  ENodeStatus.DISAPPROVED
]

export const INACTIVE_GATEWAY_STATUS = [
  EGatewayStatus.CREATED,
  EGatewayStatus.VERIFIED,
  EGatewayStatus.FAILED,
  EGatewayStatus.UNSTAKE,
  EGatewayStatus.REPORTED,
  EGatewayStatus.STOPPED,
  EGatewayStatus.DISAPPROVED
]

export type DbAction = "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE";
export type DbEventName = "node-change" | "gateway-change" | "geo-change" | "api-change" | "entrypoint-change";
export enum ConfigMode {
  FILE = "file",
  ENV = "env"
}

export enum DatasourceType {
  StakedGateway = "staked-gateway",
  StakedNode = "staked-node"
}

export enum ValidateRule{
  Http = "http",
  HttpSuccess = "http-success",
  MapResponseField = "map-response-field",
  ChangeStatusInvestigate = "change-status-investigate",
  CheckBlockLate = "check-block-late",
  Reduce = "reduce"
}

export enum ReduceOperator{
  Max = "max",
  ParseHex = "parse-hex"
}