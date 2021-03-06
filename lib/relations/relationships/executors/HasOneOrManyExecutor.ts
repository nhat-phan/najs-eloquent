/// <reference path="../../../definitions/data/IDataCollector.ts" />
/// <reference path="../../../definitions/relations/IRelationDataBucket.ts" />
/// <reference path="../../../definitions/query-builders/IConditionMatcher.ts" />
/// <reference path="../../../definitions/query-builders/IQueryBuilder.ts" />

import IDataCollector = NajsEloquent.Data.IDataCollector
import IDataReader = NajsEloquent.Data.IDataReader
import IConditionMatcher = NajsEloquent.QueryBuilder.IConditionMatcher
import IQueryBuilder = NajsEloquent.QueryBuilder.IQueryBuilder
import IRelationDataBucket = NajsEloquent.Relation.IRelationDataBucket

export interface IHasOneOrManyExecutor<T> {
  setCollector(collector: IDataCollector<any>, conditions: IConditionMatcher<any>[], reader: IDataReader<any>): this

  setQuery(query: IQueryBuilder<any>): this

  executeCollector(): T | undefined | null

  getEmptyValue(): T | undefined

  executeQuery(): Promise<T | undefined | null>
}

export abstract class HasOneOrManyExecutor<T> implements IHasOneOrManyExecutor<T> {
  protected dataBucket: IRelationDataBucket
  protected targetModel: IModel
  protected collector: IDataCollector<any>
  protected query: IQueryBuilder<any>

  constructor(dataBucket: IRelationDataBucket, targetModel: IModel) {
    this.dataBucket = dataBucket
    this.targetModel = targetModel
  }

  setCollector(collector: IDataCollector<any>, conditions: IConditionMatcher<any>[], reader: IDataReader<any>): this {
    this.collector = collector
    this.collector.filterBy({ $and: conditions })

    return this
  }

  setQuery(query: IQueryBuilder<any>): this {
    this.query = query

    return this
  }

  abstract executeCollector(): T | undefined | null

  abstract getEmptyValue(): T | undefined

  abstract executeQuery(): Promise<T | undefined | null>
}
