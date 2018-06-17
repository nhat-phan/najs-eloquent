/// <reference path="../interfaces/IFetchResultQuery.ts" />
/// <reference path="../../collect.js/index.d.ts" />

import { register } from 'najs-binding'
import { Collection } from 'mongodb'
import { isEmpty } from 'lodash'
import { MongodbQueryBuilderBase } from './MongodbQueryBuilderBase'
import { MongodbQueryLog } from './MongodbQueryLog'
import { NajsEloquent as NajsEloquentClasses } from '../../constants'
import * as Moment from 'moment'

export class MongodbQueryBuilder<T> extends MongodbQueryBuilderBase
  implements NajsEloquent.QueryBuilder.IFetchResultQuery<T> {
  protected modelName: string
  protected collection: Collection
  protected timestamps?: NajsEloquent.Model.ITimestampsSetting
  protected nativeHandlePromise: any
  protected primaryKey: string

  constructor(
    modelName: string,
    collection: Collection,
    softDelete?: NajsEloquent.Model.ISoftDeletesSetting | undefined,
    timestamps?: NajsEloquent.Model.ITimestampsSetting | undefined,
    primaryKey: string = '_id'
  ) {
    super(softDelete)
    this.modelName = modelName
    this.collection = collection
    this.timestamps = timestamps
    this.primaryKey = primaryKey
  }

  getClassName(): string {
    return NajsEloquentClasses.QueryBuilder.MongodbQueryBuilder
  }

  get(): Promise<T[]> {
    const query = this.resolveMongodbConditionConverter().convert()
    const options = this.createQueryOptions()
    const logger = this.resolveMongodbQueryLog()
    this.logQueryAndOptions(logger, query, options, 'find')
      .raw('.toArray()')
      .end()
    return this.collection.find(query, options).toArray()
  }

  first(): Promise<T | null> {
    const query = this.resolveMongodbConditionConverter().convert()
    const options = this.createQueryOptions()
    const logger = this.resolveMongodbQueryLog()
    this.logQueryAndOptions(logger, query, options, 'findOne').end()
    return this.collection.findOne(query, options)
  }

  count(): Promise<number> {
    if (this.fields.select) {
      this.fields.select = []
    }
    if (!isEmpty(this.ordering)) {
      this.ordering = {}
    }
    const query = this.resolveMongodbConditionConverter().convert()
    const options = this.createQueryOptions()
    const logger = this.resolveMongodbQueryLog()
    this.logQueryAndOptions(logger, query, options, 'count').end()
    return this.collection.count(query)
  }

  update(data: Object): Promise<object> {
    const conditions = this.resolveMongodbConditionConverter().convert()

    if (this.timestamps) {
      if (typeof data['$set'] === 'undefined') {
        data['$set'] = {}
      }
      data['$set'][this.timestamps.updatedAt] = Moment().toDate()
    }
    this.resolveMongodbQueryLog()
      .raw('db.', this.collection.collectionName, '.updateMany(', conditions, ', ', data, ')')
      .end()
    return this.collection.updateMany(conditions, data).then(function(response) {
      return response.result
    })
  }

  delete(): Promise<object> {
    const conditions = this.isNotUsedOrEmptyCondition()
    if (conditions === false) {
      return Promise.resolve({ n: 0, ok: 1 })
    }
    this.resolveMongodbQueryLog()
      .raw('db.', this.collection.collectionName, '.deleteMany(', conditions, ')')
      .end()
    return this.collection.deleteMany(conditions).then(function(response) {
      return response.result
    })
  }

  async restore(): Promise<object> {
    if (!this.softDelete) {
      return { n: 0, nModified: 0, ok: 1 }
    }

    const conditions = this.isNotUsedOrEmptyCondition()
    if (conditions === false) {
      return { n: 0, nModified: 0, ok: 1 }
    }

    const query = this.resolveMongodbConditionConverter().convert()
    const data = {
      $set: { [this.softDelete.deletedAt]: this.convention.getNullValueFor(this.softDelete.deletedAt) }
    }
    this.resolveMongodbQueryLog()
      .raw('db.', this.collection.collectionName, '.updateMany(', conditions, ', ', data, ')')
      .end()
    return this.collection.updateMany(query, data).then(function(response) {
      return response.result
    })
  }

  execute(): Promise<any> {
    if (this.nativeHandlePromise) {
      return this.nativeHandlePromise.then((response: any) => {
        this.nativeHandlePromise = undefined
        return response.result || response
      })
    }
    return this.get()
  }

  native(
    handler: (collection: Collection, conditions: object, options?: object) => Promise<any>
  ): { execute(): Promise<any> } {
    const conditions = this.resolveMongodbConditionConverter().convert()
    const options = this.createQueryOptions()
    this.nativeHandlePromise = handler(this.collection, conditions, options)
    return this
  }

  // -------------------------------------------------------------------------------------------------------------------
  protected logQueryAndOptions(
    logger: MongodbQueryLog,
    query: object,
    options: object | undefined,
    func: string
  ): MongodbQueryLog {
    return logger.raw('db.', this.collection.collectionName, `.${func}(`, query).raw(options ? ', ' : '', options, ')')
  }

  createQueryOptions(): object | undefined {
    const options = {}

    if (this.limitNumber) {
      options['limit'] = this.limitNumber
    }

    if (this.ordering && !isEmpty(this.ordering)) {
      options['sort'] = Object.keys(this.ordering).reduce((memo: any[], key) => {
        memo.push([key, this.ordering[key] === 'asc' ? 1 : -1])
        return memo
      }, [])
    }

    if (!isEmpty(this.fields.select)) {
      options['projection'] = this.fields.select!.reduce((memo: object, key) => {
        memo[key] = 1
        return memo
      }, {})
    }

    return isEmpty(options) ? undefined : options
  }
}
register(MongodbQueryBuilder, NajsEloquentClasses.QueryBuilder.MongodbQueryBuilder)
