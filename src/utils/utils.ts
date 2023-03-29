import { EGatewayStatus, REQUEST_SCHEME, INACTIVE_GATEWAY_STATUS, INITABLE_GATEWAY_STATUS, RELOADABLE_GATEWAY_STATUS } from "src/configs/consts";
import { Gateway } from "src/entities/gateway.entity";

export class Utils {
  public static isNodeApproved(status: EGatewayStatus) {
    return [
      EGatewayStatus.APPROVED,
      EGatewayStatus.STAKED,
      EGatewayStatus.INVESTIGATE,
      EGatewayStatus.INVESTIGATING,
      EGatewayStatus.INVESTIGATE_FAIL
    ].includes(status)
  }

  public static isNodeApprovedI(status: EGatewayStatus) {
    return this.isNodeApproved(status) ? 1 : 0
  }

  public static allowedTraffic(status: EGatewayStatus) {
    return [
      EGatewayStatus.STAKED,
    ].includes(status)
  }

  public static allowedTrafficI(status: EGatewayStatus) {
    return this.allowedTraffic(status) ? 1 : 0
  }

  public static isGatewayReadyToInit(status: EGatewayStatus) {
    return INITABLE_GATEWAY_STATUS.includes(status)
  }

  public static isGatewayReloadable(status: EGatewayStatus) {
    return RELOADABLE_GATEWAY_STATUS.includes(status)
  }

  public static buildGatewayHost(gw: Gateway) {
    return `${REQUEST_SCHEME}://${gw.ip}`
  }

  public static isGatewayActive(status: EGatewayStatus) {
    return !INACTIVE_GATEWAY_STATUS.includes(status)
  }
}