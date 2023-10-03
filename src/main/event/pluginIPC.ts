import {
  app as APP,
  dialog,
  ipcMain,
  IpcMainEvent,
  IpcMainInvokeEvent,
} from 'electron';
import path from 'path';
import { TextFileSync } from '@commonify/lowdb';
import {
  DataType,
  IPetPluginInterface,
  PetExpose,
  SlotMenu,
} from '../plugin/share/types';
import windowManger from '../window/windowManger';
import { showNotification } from '../utils';
import { handleStreamlinePluginName } from '../plugin/common';
import logger from '../utils/logger';
import dbMap from '../data/db';
import { DBList, IWindowList } from '../../common/enum';
import { install, uninstall, update } from '../plugin/PluginHandler';
import { IPluginLoader } from '../plugin/types';

export default {
  listen(pluginLoader: IPluginLoader, ctx: PetExpose) {
    // const fullList = pluginLoader.getAllPluginsNameList();
    // fullList.forEach(async (pluginName) => {
    //   let plugin = await pluginLoader.getPlugin(pluginName);
    //   logger.info(`plugin: `, plugin)
    // plugin.config();
    // plugin.handle(DataType.Image).then(res => logger.info(`handle res: `, res))
    // await plugin.stop()
    // });
    // ------------ plugin 测试 ------------

    // 获取插件的信息
    // const allPluginsNameList = pluginLoader.getAllPluginsNameList();
    // allPluginsNameList.forEach((pluginName) => {
    //   pluginLoader
    //     .getPlugin(pluginName)
    //     .then(() => {
    //       // logger.info(`\n======================== ${plugin.name} ${plugin.version} ========================`)
    //       // logger.info(`plugin: `, plugin)
    //       //
    //       // // 获取需要渲染的配置页面
    //       // let iPluginConfigs = plugin.config(ctx);
    //       // logger.info(`plugin needed config: `, iPluginConfigs)
    //       //
    //       // logger.info(`slotMenu: `, plugin.slotMenu)
    //       // logger.info(`======================== ${plugin.name} ${plugin.version} ========================\n`)
    //       return null;
    //     })
    //     .catch((e) => {
    //       throw e;
    //     });
    // });

    ipcMain.handle(
      'plugin.getConfig',
      async (event: IpcMainInvokeEvent, pluginName: string) => {
        const plugin = await pluginLoader.getPlugin(pluginName);
        return plugin?.config?.(ctx);
      },
    );

    ipcMain.handle('plugin.getSlotMenu', async () => {
      const pluginSlotMenuList: {
        name: string;
        menu: SlotMenu[] | undefined;
      }[] = [];
      const allPluginsNameList = pluginLoader.getAllPluginsNameList();
      allPluginsNameList
        .map(async (pluginName) => {
          const plugin: IPetPluginInterface | undefined =
            await pluginLoader.getPlugin(pluginName);
          if (!plugin || !plugin.slotMenu) {
            return undefined;
          }

          pluginSlotMenuList.push({
            name: pluginName, // pluginName
            menu: plugin.slotMenu(ctx),
          });
          return pluginName;
        })
        .filter((item) => item !== undefined);

      return pluginSlotMenuList;
    });

    // const pluginListenList = [
    //   {
    //     type: 'config',
    //     action: 'update',
    //   },
    //   {
    //     type: 'func',
    //     action: 'handle',
    //   },
    // ];
    const pluginsNameList = pluginLoader.getAllPluginsNameList();
    pluginsNameList.forEach((name) => {
      const purePluginName = name.slice(14);
      // 监听插件的config的update事件
      ipcMain.on(
        `plugin.${purePluginName}.config.update`,
        (event: IpcMainEvent, args: { name: string; data: any }) => {
          logger.info(
            `[ipcMain] plugin.${purePluginName}.config.update`,
            ` args:`,
            args,
          );
          // 只用发送核心的config数据，不用发name
          ctx.emitter.emit(`plugin.${purePluginName}.config.update`, args.data);
        },
      );

      // 监听插件的核心handle事件，调用插件的核心方法
      ipcMain.on(
        `plugin.${purePluginName}.func.handle`,
        (
          event: IpcMainEvent,
          args: { pluginName: string; input: any; reload: boolean },
        ) => {
          logger.info(
            `[ipcMain] plugin.${purePluginName}.func.handle`,
            ` args:`,
            args,
          );
          pluginLoader
            .getPlugin(`petgpt-plugin-${args.pluginName}`)
            .then((plugin) => {
              // 调用插件的handle方法
              plugin?.handle(
                { type: DataType.Text, data: args.input },
                args.reload,
              );
            })
            .catch((e) => {
              throw e;
            });
        },
      );

      // 监听renderer的插件的slot的push事件，推送到插件中，提醒插件slot的数据更新了
      ipcMain.on(
        `plugin.${purePluginName}.slot.push`,
        (event: IpcMainEvent, newSlotData) => {
          // logger.info(`[ipcMain] plugin.${purePluginName}.slot.push`, ` newSlotData(${typeof newSlotData})(len: ${newSlotData.length}):`, newSlotData)
          ctx.emitter.emit(
            `plugin.${purePluginName}.slot.push`,
            JSON.stringify(newSlotData),
          );
        },
      );

      // 调用clear方法
      ipcMain.on(`plugin.${purePluginName}.func.clear`, () => {
        // logger.info(`[ipcMain] plugin.${purePluginName}.func.clear`, ` newSlotData(${typeof newSlotData})(len: ${newSlotData.length}):`, newSlotData)
        ctx.emitter.emit(`plugin.${purePluginName}.func.clear`);
      });
    });

    // 监听插件返回的应答数据
    ctx.emitter.on('upsertLatestText', (args: any) => {
      // logger.info(`[ipMain] from plugin upsertLatestText`, ` args:`, args)
      windowManger
        ?.get(IWindowList.PET_CHAT_WINDOW)
        ?.webContents.send('upsertLatestText', args);
    });

    // 监听插件返回的更新slotMenu事件
    ctx.emitter.on('updateSlotMenu', (args: any) => {
      windowManger
        ?.get(IWindowList.PET_CHAT_WINDOW)
        ?.webContents.send('updateSlotMenu', args);
    });

    // =========== plugin install or uninstall or update ===========
    ipcMain.on(
      'installPlugin',
      async (event: IpcMainEvent, fullName: string) => {
        console.log(`[install]fullName: `, fullName);
        const res = await install([fullName], pluginLoader);
        // TODO: 根据res里的信息，进行通知
        windowManger
          ?.get(IWindowList.PET_SETTING_WINDOW)
          ?.webContents.send('installSuccess', {
            success: res.success,
            body: fullName,
            errMsg: res.success ? '' : res.body,
          });
        if (res.success) {
          // shortKeyHandler.registerPluginShortKey(res.body[0])
        } else {
          showNotification({
            title: 'PLUGIN_INSTALL_FAILED',
            body: res.body as string,
          });
        }
      },
    );

    ipcMain.on(
      'uninstallPlugin',
      async (event: IpcMainEvent, fullName: string) => {
        const res = await uninstall([fullName], pluginLoader);
        if (res.success) {
          windowManger
            ?.get(IWindowList.PET_SETTING_WINDOW)
            ?.webContents.send('uninstallSuccess', res.body[0]);
          // shortKeyHandler.unregisterPluginShortKey(res.body[0])
        } else {
          showNotification({
            title: 'PLUGIN_UNINSTALL_FAILED',
            body: res.body as string,
          });
        }
      },
    );

    ipcMain.on(
      'enablePlugin',
      async (event: IpcMainEvent, args: { name: string; enabled: boolean }) => {
        logger.info(`[ipcMain] enablePlugin`, ` args:`, args);
        const plugin: IPetPluginInterface | undefined =
          await pluginLoader.getPlugin(`petgpt-plugin-${args.name}`);
        if (!plugin) return;
        if (args.enabled) {
          plugin.register();
          dbMap
            ?.get(DBList.Config_DB)
            ?.set(`petPlugins.petgpt-plugin-${args.name}`, true);
        } else {
          plugin.unregister();
          dbMap
            ?.get(DBList.Config_DB)
            ?.set(`petPlugins.petgpt-plugin-${args.name}`, false);
        }
      },
    );

    ipcMain.on(
      'updatePlugin',
      async (event: IpcMainEvent, fullName: string) => {
        const res = await update([fullName]);
        if (res.success) {
          // TODO: 发送最新的插件信息，例如版本等
          windowManger
            ?.get(IWindowList.PET_SETTING_WINDOW)
            ?.webContents.send('updateSuccess', res.body[0]);
        } else {
          showNotification({
            title: 'PLUGIN_UPDATE_FAILED',
            body: res.body as string,
          });
        }
      },
    );

    const getPluginList = async () => {
      const pluginList = pluginLoader.getAllPluginsNameList();
      const list: any[] = [];

      pluginList
        .map(async (pluginName) => {
          const plugin: IPetPluginInterface | undefined =
            await pluginLoader.getPlugin(pluginName);
          const pluginPath = path.join(
            APP.getPath('userData'),
            `/node_modules/${pluginName}`,
          );
          const pluginPKGText = new TextFileSync(
            path.join(pluginPath, 'package.json'),
          ).read();
          if (!pluginPKGText) {
            logger.error(`pluginPKG is null`);
            return undefined;
          }
          const pluginPKG = JSON.parse(pluginPKGText);

          const enabled = dbMap
            ?.get(DBList.Config_DB)
            ?.get(`petPlugins.${pluginName}`);
          const obj = {
            name: handleStreamlinePluginName(pluginName),
            version: pluginPKG.version,
            description: pluginPKG.description,
            fullName: pluginName,
            author: pluginPKG.author.name || pluginPKG.author,
            logo: `file://${path
              .join(pluginPath, 'logo.png')
              .split(path.sep)
              .join('/')}`,
            homepage: pluginPKG.homepage ? pluginPKG.homepage : '',
            config: plugin && plugin.config ? plugin.config(ctx) : undefined,
            enabled,
          };
          list.push(obj);
          return pluginName;
        })
        .filter((item) => item !== undefined);

      return list;
    };

    ipcMain.handle('plugin.getAllPluginName', async () => {
      return getPluginList();
    });

    ipcMain.on('plugin.register', (event: IpcMainEvent, name: string) => {
      pluginLoader
        .getPlugin(`petgpt-plugin-${name}`)
        .then((plugin: IPetPluginInterface | undefined) => {
          plugin?.register();
          return null;
        })
        .catch((e) => {
          throw e;
        });
    });

    ipcMain.on('plugin.init', (event: IpcMainEvent, name: string) => {
      pluginLoader
        .getPlugin(`petgpt-plugin-${name}`)
        .then((plugin: IPetPluginInterface | undefined) => {
          if (!plugin || !plugin.init) return;
          plugin?.init();
        })
        .catch((e) => {
          throw e;
        });
    });

    ipcMain.on('importLocalPlugin', async () => {
      const settingWindow = windowManger?.get(IWindowList.PET_SETTING_WINDOW)!;

      // 获取到文件路径
      const res = await dialog.showOpenDialog(settingWindow, {
        properties: ['openDirectory'],
      });

      const { filePaths } = res;
      if (filePaths.length > 0) {
        const result = await install(filePaths, pluginLoader);
        if (result.success) {
          try {
            const list = getPluginList();
            windowManger
              ?.get(IWindowList.PET_SETTING_WINDOW)
              ?.webContents.send('pluginList', list);
          } catch (e: any) {
            windowManger
              ?.get(IWindowList.PET_SETTING_WINDOW)
              ?.webContents.send('pluginList', []);
            showNotification({
              title: 'TIPS_GET_PLUGIN_LIST_FAILED',
              body: e.message,
            });
          }
          showNotification({
            title: 'PLUGIN_IMPORT_SUCCEED',
            body: '',
          });
        } else {
          showNotification({
            title: 'PLUGIN_IMPORT_FAILED',
            body: result.body as string,
          });
        }
      }
      windowManger
        ?.get(IWindowList.PET_SETTING_WINDOW)
        ?.webContents.send('hideLoading');
    });
  },
};
