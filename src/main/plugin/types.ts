import { IPetPluginInterface } from './share/types';

export type Nullable<T> = T | null;
export type Undefinable<T> = T | undefined;
export type IPetPlugin = (ctx: any) => IPetPluginInterface;
// 用户端的发来的数据类型

export interface IPluginLoader {
  getAllPluginsNameList(): string[];

  getPlugin(pluginName: string): Promise<IPetPluginInterface | undefined>;

  hasPlugin(pkgName: string): Boolean;

  unregisterPlugin(pluginName: string): void;

  registerPlugin(pluginName: string): void;
}
export interface IPluginHandlerOptions {
  proxy?: string;
  registry?: string;
}
export interface IResult {
  code: number;
  data: string;
}
export interface IProcessEnv {
  [propName: string]: Undefinable<string>;
}
