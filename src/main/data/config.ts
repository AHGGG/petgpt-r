import { app } from 'electron';
import dbMap from './db';
import { DBList } from '../../common/enum';
import {
  ChatWindowHeight,
  ChatWindowWidth,
  DetailWindowHeight,
  DetailWindowWidth,
  MainWindowHeight,
  MainWindowWidth,
} from '../../common/constants';

function dbSetIfNotPresent(db: DBList, key: string, value: any) {
  if (dbMap.has(db) && !dbMap?.get(db)?.has(key))
    dbMap?.get(db)?.set(key, value);
}

export default {
  setConfig() {
    dbSetIfNotPresent(DBList.Config_DB, MainWindowWidth, 260);
    dbSetIfNotPresent(DBList.Config_DB, MainWindowHeight, 220);
    dbSetIfNotPresent(DBList.Config_DB, DetailWindowWidth, 900);
    dbSetIfNotPresent(DBList.Config_DB, DetailWindowHeight, 600);
    dbSetIfNotPresent(DBList.Config_DB, ChatWindowWidth, 900);
    dbSetIfNotPresent(DBList.Config_DB, ChatWindowHeight, 600);
    dbSetIfNotPresent(DBList.Config_DB, 'baseDir', app.getPath('userData'));
  },
};
