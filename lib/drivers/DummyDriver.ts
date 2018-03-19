import { snakeCase } from 'lodash'
import { Eloquent } from '../model/Eloquent'
import { IEloquentDriver } from './interfaces/IEloquentDriver'
import { IBasicQuery } from '../query-builders/interfaces/IBasicQuery'
import { IConditionQuery } from '../query-builders/interfaces/IConditionQuery'

export class DummyDriver<T extends Object = {}> implements IEloquentDriver<T> {
  static className: string = 'NajsEloquent.DummyDriver'

  attributes: Object = {}
  model: Eloquent<T>

  initialize(data?: T): void {
    this.attributes = data || {}
  }

  getRecord(): T {
    return <T>this.attributes
  }

  getAttribute(name: string): any {
    return this.attributes[name]
  }

  setAttribute(name: string, value: any): boolean {
    this.attributes[name] = value
    return true
  }

  getId(): any {
    return this.getAttribute('id')
  }

  setId(id: any): void {
    this.setAttribute('id', id)
  }

  newQuery(): IBasicQuery & IConditionQuery {
    return <any>{}
  }

  toObject(): Object {
    return this.attributes
  }

  toJSON(): Object {
    return this.attributes
  }

  is(model: Eloquent<T>): boolean {
    return this.attributes['id'] === model['driver']['attributes']['id']
  }

  getReservedNames(): string[] {
    return ['dummy']
  }

  getDriverProxyMethods() {
    return ['is', 'getId', 'setId', 'newQuery']
  }

  getQueryProxyMethods() {
    return ['where', 'orWhere']
  }

  formatAttributeName(name: string): string {
    return snakeCase(name)
  }
}
