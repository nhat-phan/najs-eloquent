/// <reference path="../contracts/Driver.ts" />

import { NajsEloquent } from '../constants'
import { RecordBaseDriver } from './based/RecordDriverBase'

export class KnexDriver extends RecordBaseDriver {
  protected tableName: string
  protected connectionName: string
  protected primaryKeyName: string

  constructor(model: NajsEloquent.Model.IModel<any> & NajsEloquent.Model.IModelSetting) {
    super(model)

    this.tableName = model.getSettingProperty('table', this.formatRecordName())
    this.connectionName = model.getSettingProperty('connection', 'default')
    this.primaryKeyName = model.getSettingProperty('primaryKey', 'id')
  }

  initialize(model: NajsEloquent.Model.IModel<any>, isGuarded: boolean, data?: Object): void {}

  getClassName() {
    return NajsEloquent.Driver.KnexDriver
  }

  shouldBeProxied(key: string): boolean {
    return key !== 'table' && key !== 'primaryKey' && key !== 'connection'
  }

  getRecordName(): string {
    return this.tableName
  }
}
