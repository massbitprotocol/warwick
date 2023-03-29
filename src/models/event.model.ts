import { DbAction, DbEventName } from "src/configs/consts"

export class DbEvent<T> {
  eventName: DbEventName
  action: DbAction
  new: T
  old: T
  constructor(eventName: DbEventName, action: DbAction, newData: T, oldData: T) {
    this.eventName = eventName
    this.action = action
    this.new = newData
    this.old = oldData
  }
}