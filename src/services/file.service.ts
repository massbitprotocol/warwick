import { Injectable, Logger } from '@nestjs/common';
const fs = require("fs")
const fsp = require("fs/promises")
const AdmZip = require("adm-zip");

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  async readTemplate(path: string) {
    this.logger.debug('Read template from: ', path);
    try {
      const content = await fs.readFile(path, { encoding: 'utf8' });
      return content;
    } catch (err) {
      this.logger.error(err);
    }
  }
  async readFolder(path: string) {
    const files = await this.listFolders(path);
    return (await Promise.all(files.map(async(file: string) => await this.readFile(path + "/" + file)))).join("\n")
  }
  async listFolders(path: string) {
    return await fsp.readdir(path)
  }
  async readFile(path: string) {
    return await fsp.readFile(path)
  }
  async makeDir(path: string) {
    return await fsp.mkdir(path, { recursive: true })
  }
  writeFile(path: string, data: any) {
    this.logger.debug(`Writing to ${path}`)
    return fsp.writeFile(path, data, { encoding: 'utf8' })
  }
  deleteFile(path: string) {
    this.logger.debug("Deleting file " + path)
    return fsp.unlink(path)
  }
  deleteFolderRecursive(path: string) {
    this.logger.debug("Deleting folder " + path)
    return fs.rmSync(path, { recursive: true, force: true })
  }
  archiveFolder(folder: string, archiveFolder: string, destination: string) {
    this.logger.debug("Create archive folder " + destination);
    const zip = new AdmZip();
    zip.addLocalFolder(folder, archiveFolder);
    zip.writeZip(destination);
  }
}
