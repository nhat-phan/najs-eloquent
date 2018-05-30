/// <reference path="../../contracts/Component.ts" />
/// <reference path="../interfaces/IModel.ts" />

import { register } from 'najs-binding'
import { NajsEloquent } from '../../constants'
import { Relation } from './../../relations/Relation'
import { RelationFactory } from '../../relations/RelationFactory'
import { Eloquent } from '../Eloquent'
import { find_base_prototypes, parse_string_with_dot_notation } from '../../util/functions'
import { flatten } from 'lodash'

function get_value_and_type_of_property(descriptor: PropertyDescriptor, instance: Object) {
  // perform getter or function for sample, the sample will contains "relationName"
  const sample = instance['getClassSetting']().getSample()

  if (typeof descriptor.value === 'function') {
    descriptor.value!.call(sample)
    return {
      value: descriptor.value!.call(instance),
      relationName: sample.relationName,
      type: 'function'
    }
  }

  if (typeof descriptor.get === 'function') {
    descriptor.get.call(sample)
    return {
      value: descriptor.get.call(instance),
      relationName: sample.relationName,
      type: 'getter'
    }
  }

  return undefined
}

function find_relation(name: string, descriptor: PropertyDescriptor, instance: Object, relationsMap: Object) {
  try {
    const result = get_value_and_type_of_property(descriptor, instance)
    if (result && result['value'] instanceof Relation) {
      relationsMap[result['relationName']] = {
        mapTo: name,
        type: result['type']
      }
    }
  } catch (error) {
    // console.error(error)
  }
}

function find_relations_in_prototype(instance: Object, prototype: Object, relationsMap: Object) {
  const descriptors = Object.getOwnPropertyDescriptors(prototype)
  for (const name in descriptors) {
    if (name === 'constructor' || name === 'hasAttribute') {
      continue
    }
    find_relation(name, descriptors[name], instance, relationsMap)
  }
}

function bind_relations_map_to_model(model: NajsEloquent.Model.IModel<any>) {
  const relationsMap = {}
  const modelPrototype = Object.getPrototypeOf(model)
  find_relations_in_prototype(model, modelPrototype, relationsMap)

  const basePrototypes = find_base_prototypes(modelPrototype, Eloquent.prototype)
  for (const prototype of basePrototypes) {
    if (prototype !== Eloquent.prototype) {
      find_relations_in_prototype(model, prototype, relationsMap)
    }
  }

  Object.defineProperty(modelPrototype, 'relationsMap', {
    value: relationsMap
  })
}

function define_relation_property_if_needed(model: NajsEloquent.Model.IModel<any>, name: string) {
  const prototype = Object.getPrototypeOf(model)
  const propertyDescriptor = Object.getOwnPropertyDescriptor(prototype, name)
  if (propertyDescriptor) {
    return
  }

  Object.defineProperty(prototype, name, {
    get: function(this: NajsEloquent.Model.IModel<any>) {
      if (typeof this['relationsMap'] === 'undefined' || typeof this['relationsMap'][name] === 'undefined') {
        throw new Error(`Relation "${name}" is not defined in model "${this.getModelName()}".`)
      }
      return this.getRelationByName(name).getData()
    }
  })
}

export class ModelRelation implements Najs.Contracts.Eloquent.Component {
  static className = NajsEloquent.Model.Component.ModelRelation
  getClassName(): string {
    return NajsEloquent.Model.Component.ModelRelation
  }

  extend(prototype: Object, bases: Object[], driver: Najs.Contracts.Eloquent.Driver<any>): void {
    prototype['load'] = ModelRelation.load
    prototype['bindRelationMapIfNeeded'] = ModelRelation.bindRelationMapIfNeeded
    prototype['getRelationByName'] = ModelRelation.getRelationByName
    prototype['defineRelationProperty'] = ModelRelation.defineRelationProperty
    prototype['getRelationDataBucket'] = ModelRelation.getRelationDataBucket
  }

  static getRelationDataBucket: NajsEloquent.Model.ModelMethod<any> = function() {
    return this['relationDataBucket']
  }

  static load: NajsEloquent.Model.ModelMethod<any> = async function() {
    const relations: string[] = flatten(arguments)
    for (const relationName of relations) {
      await this.getRelationByName(relationName).load()
    }
  }

  static bindRelationMapIfNeeded: NajsEloquent.Model.ModelMethod<any> = function(name: string) {
    if (typeof this['relationsMap'] === 'undefined') {
      bind_relations_map_to_model(this)
    }
  }

  static getRelationByName: NajsEloquent.Model.ModelMethod<any> = function(name: string) {
    this['bindRelationMapIfNeeded']()

    const info = parse_string_with_dot_notation(name)
    if (typeof this['relationsMap'] === 'undefined' || typeof this['relationsMap'][info.first] === 'undefined') {
      throw new Error(`Relation "${info.first}" is not found in model "${this.getModelName()}".`)
    }
    const mapping = this['relationsMap'][info.first]
    const relation = mapping.type === 'getter' ? this[mapping.mapTo] : this[mapping.mapTo].call(this)
    if (info.afterFirst) {
      relation.with(info.afterFirst)
    }
    return relation
  }

  static defineRelationProperty: NajsEloquent.Model.ModelMethod<any> = function(name: string) {
    if (this['__sample']) {
      this['relationName'] = name
      return new RelationFactory(this, name, true)
    }

    if (typeof this['relations'][name] === 'undefined') {
      define_relation_property_if_needed(this, name)
      this['relations'][name] = {
        factory: new RelationFactory(this, name, false)
      }
    }
    return this['relations'][name].factory
  }
}
register(ModelRelation)
