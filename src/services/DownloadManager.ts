import logger from "./logger";
import axios from "axios";
const fetch = require("node-fetch");
export default class DownloadManager {
  destPath: string;
  downloadUrl: string;
  downloadManagerUrl: string;
  fileName: string;

  constructor(destPath, downloadUrl, fileName, downloadManagerUrl) {
    this.downloadUrl = downloadUrl;
    this.fileName = fileName;

    this.destPath = destPath;
    if (this.destPath[0] === "C") {
      this.destPath = this.destPath.replace("C:\\docgen\\documents\\", "");
      this.destPath = this.destPath.replace("\\", "/");
    } else {
      this.destPath = this.destPath.replace("/docgen/documents/", "");
    }
    this.destPath = this.destPath.substring(0, this.destPath.indexOf("/", 2));
    if (downloadManagerUrl === undefined) {
      this.downloadManagerUrl = "http://host:3003/api/download_manager";
    } else {
      this.downloadManagerUrl = downloadManagerUrl;
    }
  }

  async downloadFile() {
    const body = {
      url: this.downloadUrl,
      name: this.fileName,
      location: `${this.destPath}`,
      imageSize: {
        height: 250,
        width: 100,
      },
    };
    logger.info(`Downloading:
                    ${this.downloadUrl}
                to:
                  ${this.destPath}`);
    try {
      let res = await axios.post(this.downloadManagerUrl, body);
      logger.info(`downloaded to :${res.data}`);
      if (res.status == 200) return res.data;
      else return null;
    } catch (e) {
      logger.error(`error dowloading : ${this.downloadUrl}`);
    }
  }

  convertToWinodwsPath(linuxPath: string) {
    let windowsPath = linuxPath.split("/").join("\\");
    windowsPath = "C:" + windowsPath;
    return windowsPath;
  }
}
