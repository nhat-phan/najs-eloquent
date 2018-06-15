/// <reference types="najs-event" />
/// <reference path="../contracts/Driver.ts" />

import { NajsEloquent } from '../constants'
import { Record } from '../model/Record'
import { RecordBaseDriver } from './RecordDriverBase'
import { MongodbProviderFacade } from '../facades/global/MongodbProviderFacade'
import { Collection } from 'mongodb'
import * as Moment from 'moment'

export class MongodbDriver extends RecordBaseDriver implements Najs.Contracts.Eloquent.Driver<Record> {
  protected collection: Collection

  protected eventEmitter?: Najs.Contracts.Event.AsyncEventEmitter

  getClassName() {
    return NajsEloquent.Driver.MongodbDriver
  }

  initialize(model: NajsEloquent.Model.IModel<any>, isGuarded: boolean, data?: Object): void {
    this.collection = MongodbProviderFacade.getDatabase().collection(this.formatRecordName())

    if (data instanceof Record) {
      this.attributes = data
      return
    }

    if (typeof data === 'object') {
      if (isGuarded) {
        model.fill(data)
      } else {
        this.attributes = new Record(data)
      }
    } else {
      this.attributes = new Record()
    }
  }

  getRecordName(): string {
    return this.collection.collectionName
  }

  getPrimaryKeyName(): string {
    return '_id'
  }

  isNew(): boolean {
    return typeof this.attributes.getAttribute(this.getPrimaryKeyName()) === 'undefined'
  }

  getModelComponentName(): string | undefined {
    return undefined
  }

  getModelComponentOrder(components: string[]): string[] {
    return components
  }

  newQuery<T>(dataBucket?: NajsEloquent.Relation.IRelationDataBucket): NajsEloquent.Wrapper.IQueryBuilderWrapper<T> {
    return <any>{}
    // return make<NajsEloquent.Wrapper.IQueryBuilderWrapper<T>>(NajsEloquent.Wrapper.MongooseQueryBuilderWrapper, [
    //   this.modelName,
    //   this.getRecordName(),
    //   make(NajsEloquent.QueryBuilder.MongooseQueryBuilder, [this.modelName, this.softDeletesSetting]),
    //   dataBucket
    // ])
  }

  async delete(softDeletes: boolean): Promise<any> {}

  async restore(): Promise<any> {
    // if (this.softDeletesSetting) {
    //   return new Promise((resolve, reject) => {
    //     this.collection.update
    //   })
    // }
    // return false
  }

  async save(): Promise<any> {
    const isNew = this.isNew()

    if (this.timestampsSetting) {
      this.setAttribute(this.timestampsSetting.updatedAt, Moment().toDate())

      if (isNew) {
        this.setAttribute(this.timestampsSetting.createdAt, Moment().toDate())
      }
    }

    return new Promise((resolve, reject) => {
      this.collection.save(this.attributes, function(error, result) {
        if (error) {
          return reject(error)
        }
        resolve(result)
      })
    })
  }
}