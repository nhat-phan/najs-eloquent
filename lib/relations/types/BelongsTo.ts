/// <reference path="../interfaces/IHasOne.ts" />

export type BelongsTo<T> = NajsEloquent.Relation.IHasOne<T> & { [P in keyof T]: T[P] }
