/// <reference types="chance" />
import { Facade } from 'najs-facade';
import { IAutoload } from 'najs-binding';
import { IFactoryBuilder } from './interfaces/IFactoryBuilder';
import { IFactoryManager, FactoryDefinition, ModelClass } from './interfaces/IFactoryManager';
export declare type ChanceFaker = Chance.Chance;
export declare class FactoryManager extends Facade implements IAutoload, IFactoryManager<ChanceFaker> {
    static className: string;
    protected faker: ChanceFaker;
    protected definitions: Object;
    protected states: Object;
    constructor();
    getClassName(): string;
    protected addDefinition(bag: string, className: any, name: string, definition: any): this;
    private parseModelName(className);
    define(className: string | ModelClass, definition: FactoryDefinition<ChanceFaker>, name?: string): this;
    defineAs(className: string | ModelClass, name: string, definition: FactoryDefinition<ChanceFaker>): this;
    state(className: string | ModelClass, state: string, definition: FactoryDefinition<ChanceFaker>): this;
    of(className: string | ModelClass): IFactoryBuilder;
    of(className: string | ModelClass, name: string): IFactoryBuilder;
    create<T>(className: string | ModelClass): T;
    create<T>(className: string | ModelClass, attributes: Object): T;
    createAs<T>(className: string | ModelClass, name: string): T;
    createAs<T>(className: string | ModelClass, name: string, attributes: Object): T;
    make<T>(className: string | ModelClass): T;
    make<T>(className: string | ModelClass, attributes: Object): T;
    makeAs<T>(className: string | ModelClass, name: string): T;
    makeAs<T>(className: string | ModelClass, name: string, attributes: Object): T;
    raw<T>(className: string | ModelClass): T;
    raw<T>(className: string | ModelClass, attributes: Object): T;
    rawOf<T>(className: string | ModelClass, name: string): T;
    rawOf<T>(className: string | ModelClass, name: string, attributes: Object): T;
}
