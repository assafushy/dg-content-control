import logger from "../services/logger";
import { writeFileSync } from "fs";

export default class ChangesTableDataSkinAdapter {
  rawChangesArray: any = [];
  adoptedData: any = [];
  constructor(rawChangesArray) {
    this.rawChangesArray = rawChangesArray;
  }
  getAdoptedData() {
    return this.adoptedData;
  }
  /*
  table structure:
  Col1: # (Row number). 
  Col2: Change# (the ID of the change from GIT / TFS) 
  Col3: Related WI -   Req/ CR/ Task/ Bug   - The data is WI Type and WI ID. Each ID in separate row.
  Col4: Change description / WI description or Title  - according to configuration 
  Option – the user that made the change. 
  Col5: Committed Date & Time. 
  TBD – Linked WI 
  */
  async adoptSkinData() {
    let i = 0;
    this.rawChangesArray.forEach((artifact) => {
      let artifactTitle: any = [
        {
          fields: [{ name: "Artifact name", value: artifact.artifact.name }],
        },
      ];
      let artifactChanges: any = [];
      artifact.changes.forEach((change) => {
        let changeTableRow = {
          fields: [
            { name: "#", value: i + 1 },
            {
              name: "Change #",
              value: "commit sha / pr id",
              url: null,
            },
            {
              name: "Related WI", 
              value: `${change.workItem.fields["System.Title"]} - ${change.workItem.fields["System.WorkItemType"]} ${change.workItem.id}`,
              url: change.workItem._links.html.href
            },
            {
              name: "Change description",
              value: change.workItem.fields["System.Title"],
            },
            { name: "Committed Date & Time", value: "date time" },
            { name: "Commited by", value: "commited by" },
          ],
        };
        if (change.build) {
          //Change#
          changeTableRow.fields[1].value = change.build;
          changeTableRow.fields[1].url = change.workItem.url;
          //Commited time
          changeTableRow.fields[4].value =
            change.workItem.fields["Microsoft.VSTS.Common.ClosedDate"] ||
            "This item has'nt been Closed yet";
          //commited by
          changeTableRow.fields[5].value = change.workItem.fields[
            "Microsoft.VSTS.Common.ClosedBy"
          ]
            ? change.workItem.fields["Microsoft.VSTS.Common.ClosedBy"]
                .displayName
            : "This item has'nt been Closed yet";
        }
        if (change.pullrequest) {
          //Change#
          changeTableRow.fields[1].value = change.pullrequest.pullRequestId;
          changeTableRow.fields[1].url = change.pullrequest.url;
          //Commited time
          changeTableRow.fields[4].value = change.pullrequest.closedDate;
          //commited by
          changeTableRow.fields[5].value =
            change.pullrequest.createdBy.displayName;
        }
        if (change.commit) {
          //Change#
          changeTableRow.fields[1].value = change.commit.commitId.substring(0, 5);
          changeTableRow.fields[1].url = change.commit.remoteUrl;
          //Commited time
          changeTableRow.fields[4].value = change.commit.author.date;
          //commited by
          changeTableRow.fields[5].value = change.commit.committer.name;
        }
        artifactChanges.push(changeTableRow);
        i++;
      });
      this.adoptedData.push({
        artifact: artifactTitle,
        artifactChanges: artifactChanges,
      });
    });
  }
}
