import log from 'electron-log';
import { ILogger } from '../plugin/share/types';

class Logger implements ILogger {
  private log = log;

  constructor() {
    // 日志文件等级，默认值：false
    this.log.transports.file.level = 'debug';
    // 日志控制台等级，默认值：false
    this.log.transports.console.level = 'debug';
    // 日志文件名，默认：main.log
    this.log.transports.file.fileName = 'main.log';
    // 日志格式，默认：[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}
    this.log.transports.file.format =
      '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}';
    // 日志大小，默认：10485760（10M），达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
    this.log.transports.file.maxSize = 10485760;
    // 日志文件位置：C:\Users\%USERPROFILE%\AppData\Roaming\Electron\logs
    // 完整的日志路径：log.transports.file.file，优先级高于 appName、fileName

    // Optional, initialize the logger for any renderer processses
    // log.initialize({ preload: true })
    // log.initialize({ spyRendererConsole: true });
  }

  info(...msg: any[]): void {
    this.log.info(msg);
  }

  debug(msg: string | number): void {
    this.log.debug(msg);
  }

  warn(msg: string | number): void {
    this.log.warn(msg);
  }

  error(msg: string | number | Error): void {
    this.log.error(msg);
  }
}

const logger = new Logger();
export default logger;
