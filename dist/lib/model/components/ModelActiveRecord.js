"use strict";
/// <reference path="../../contracts/Component.ts" />
/// <reference path="../interfaces/IModel.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const najs_binding_1 = require("najs-binding");
const lodash_1 = require("lodash");
const constants_1 = require("../../constants");
const Event_1 = require("../Event");
class ModelActiveRecord {
    getClassName() {
        return constants_1.NajsEloquent.Model.Component.ModelActiveRecord;
    }
    extend(prototype, bases, driver) {
        prototype['isNew'] = ModelActiveRecord.isNew;
        prototype['isDirty'] = ModelActiveRecord.isDirty;
        prototype['getDirty'] = ModelActiveRecord.getDirty;
        prototype['delete'] = ModelActiveRecord.delete;
        prototype['save'] = ModelActiveRecord.save;
        prototype['fresh'] = ModelActiveRecord.fresh;
    }
}
ModelActiveRecord.className = constants_1.NajsEloquent.Model.Component.ModelActiveRecord;
ModelActiveRecord.isNew = function () {
    return this['driver'].isNew();
};
ModelActiveRecord.isDirty = function () {
    const fields = lodash_1.flatten(arguments);
    for (const field of fields) {
        if (!this['driver'].isModified(field)) {
            return false;
        }
    }
    return true;
};
ModelActiveRecord.getDirty = function () {
    return this['driver'].getModified();
};
ModelActiveRecord.delete = async function () {
    await this.fire(Event_1.Event.Deleting, []);
    const result = await this['driver'].delete(this.hasSoftDeletes());
    await this.fire(Event_1.Event.Deleted, []);
    return result;
};
ModelActiveRecord.save = async function () {
    const isCreate = this['driver'].isNew();
    await this.fire(isCreate ? Event_1.Event.Creating : Event_1.Event.Updating, []);
    await this.fire(Event_1.Event.Saving, []);
    await this['driver'].save();
    await this.fire(isCreate ? Event_1.Event.Created : Event_1.Event.Updated, []);
    await this.fire(Event_1.Event.Saved, []);
    return this;
};
ModelActiveRecord.fresh = async function () {
    if (!this.isNew()) {
        return this.findById(this.getPrimaryKey());
    }
    // tslint:disable-next-line
    return null;
};
exports.ModelActiveRecord = ModelActiveRecord;
najs_binding_1.register(ModelActiveRecord);
