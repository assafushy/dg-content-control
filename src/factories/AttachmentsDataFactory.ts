import DgDataProviderAzureDevOps from "@doc-gen/dg-data-provider-azuredevops";
import DownloadManager from "../services/DownloadManager";
import logger from "../services/logger";

export default class AttachmentsDataFactory {
  teamProject: string = "";
  wiId: string = null;
  templatePath: string = "";
  dgDataProviderAzureDevOps: DgDataProviderAzureDevOps;

  constructor(
    teamProject: string,
    wiId: string,
    templatePath: string,
    dgDataProvider: any
  ) {
    this.teamProject = teamProject;
    this.templatePath = templatePath;
    this.wiId = wiId;
    this.dgDataProviderAzureDevOps = dgDataProvider;
  }

  async fetchWiAttachments() {
    let attachments;
    try {
        attachments = await this.dgDataProviderAzureDevOps.getTicketsDataProvider().GetWorkitemAttachments(
        this.teamProject,
        this.wiId
      );
    } catch (e) {
      attachments = [];
    }
    logger.debug(
      `for work item - ${this.wiId} fetched ${attachments.length} attachments`
    );
    try {
      let attachmentData = [];
      for (let i = 0; i < attachments.length; i++) {
        let relativeAttachmentLink = "";
        let tableCellAttachmentLink = "";
        let attachmentFileName = attachments[i].downloadUrl.substring(
          attachments[i].downloadUrl.lastIndexOf("/") + 1,
          attachments[i].downloadUrl.length
        );
        let attachmentUrl = attachments[i].downloadUrl.substring(
          0,
          attachments[i].downloadUrl.lastIndexOf("/")
        );
        let downloadedAttachmentPath = await this.downloadAttachment(
          attachmentUrl,
          attachmentFileName
        );
        if (downloadedAttachmentPath) {
          relativeAttachmentLink =
            "file:///" +
            downloadedAttachmentPath.substring(
              downloadedAttachmentPath.indexOf("downloads"),
              downloadedAttachmentPath.length
            );

          // .replace(/\\/g, "/");
          let pathArray = downloadedAttachmentPath.split(".");
          tableCellAttachmentLink = pathArray[0] + "-TableCell." + pathArray[1];
        }
        attachmentData.push({
          attachmentComment: attachments[i].attributes.comment || "",
          attachmentFileName: attachmentFileName,
          attachmentLink: downloadedAttachmentPath,
          relativeAttachmentLink: relativeAttachmentLink,
          tableCellAttachmentLink: tableCellAttachmentLink
        });
      }

      // await Promise.all(
      //   attachments.map(async (attachment: any) => {
      //     let relativeAttachmentLink = "";
      //     let tableCellAttachmentLink = "";
      //     let attachmentFileName = attachment.downloadUrl.substring(
      //       attachment.downloadUrl.lastIndexOf("/") + 1,
      //       attachment.downloadUrl.length
      //     );
      //     let attachmentUrl = attachment.downloadUrl.substring(
      //       0,
      //       attachment.downloadUrl.lastIndexOf("/")
      //     );
      //     let downloadedAttachmentPath = await this.downloadAttachment(
      //       attachmentUrl,
      //       attachmentFileName
      //     );
      //     if (downloadedAttachmentPath) {
      //       relativeAttachmentLink =
      //         "file:///" +
      //         downloadedAttachmentPath.substring(
      //           downloadedAttachmentPath.indexOf("downloads"),
      //           downloadedAttachmentPath.length
      //         );

      //       // .replace(/\\/g, "/");
      //       let pathArray = downloadedAttachmentPath.split(".");
      //       tableCellAttachmentLink =
      //         pathArray[0] + "-TableCell." + pathArray[1];
      //     }
      //     attachmentData.push({
      //       attachmentComment: attachment.attributes.comment || "",
      //       attachmentFileName: attachmentFileName,
      //       attachmentLink: downloadedAttachmentPath,
      //       relativeAttachmentLink: relativeAttachmentLink,
      //       tableCellAttachmentLink: tableCellAttachmentLink
      //     });
      //   })
      // );

      return attachmentData;
    } catch (e) {
      logger.error(
        `error creating attachmets array for work item ${this.wiId}`
      );
      logger.error(JSON.stringify(e));
      return [];
    }
  }

  async downloadAttachment(attachmentUrl, attachmentFileName) {
    try {
      let downloadManager = new DownloadManager(
        this.templatePath,
        attachmentUrl,
        attachmentFileName,
        process.env.DOWNLOAD_MANAGER_URL
      );
      let res = await downloadManager.downloadFile();
      return res;
    } catch (e) {
      logger.error(
        `error downloading attachmet : ${attachmentFileName} for work item ${
          this.wiId
        }`
      );
      logger.error(JSON.stringify(e));
      return "";
    }
  }
}
