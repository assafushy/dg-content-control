import DgDataProviderAzureDevOps from '@doc-gen/dg-data-provider-azuredevops'
import logger from "../services/logger";
import ChangesTableDataSkinAdapter from "../adapters/ChangesTableDataSkinAdapter";

const styles = {
  isBold: false,
  IsItalic: false,
  IsUnderline: false,
  Size: 10,
  Uri: null,
  Font: "New Times Roman",
  InsertLineBreak: false,
  InsertSpace: false,
};

export default class ChangeDataFactory {
  dgDataProviderAzureDevOps: DgDataProviderAzureDevOps;
  teamProject: string;
  templatePath: string;

  repoId: string;
  from: string | number;
  to: string | number;
  rangeType: string;
  linkTypeFilterArray: string[];
  contentControlTitle: string;
  headingLevel?: number;

  rawChangesArray: any = [];
  adoptedChangeData: any;

  constructor(
    teamProjectName,
    repoId: string,
    from: string | number,
    to: string | number,
    rangeType: string,
    linkTypeFilterArray: string[],
    dgDataProvider: any
  ) {
    this.dgDataProviderAzureDevOps = dgDataProvider;
    this.teamProject = teamProjectName;

    this.from = from;
    this.to = to;
    this.repoId = repoId;
    this.rangeType = rangeType;
    this.linkTypeFilterArray = linkTypeFilterArray;
  }//constructor
  
  /*fetches Change table data and adopts it to json skin format */
  async fetchData() {
    let focusedArtifact;
    let artifactChanges;
    let gitDataProvider = await this.dgDataProviderAzureDevOps.getGitDataProvider()
    let pipelinesDataProvider = await this.dgDataProviderAzureDevOps.getPipelinesDataProvider()
    if (this.repoId) {
      focusedArtifact = await gitDataProvider.GetGitRepoFromRepoId(
        this.repoId
      );
      console.log(focusedArtifact)
    }
    switch (this.rangeType) {
      
      case "commitSha":
        let commitsInCommitRange = await gitDataProvider.GetCommitsInCommitRange(
           this.teamProject,
           this.repoId,
           String(this.from),
           String(this.to)
         );
         artifactChanges = await gitDataProvider.GetItemsInCommitRange(
           this.teamProject,
           this.repoId,
           commitsInCommitRange
         );
         this.rawChangesArray.push({
           artifact: focusedArtifact,
           changes: artifactChanges,
         });
         break;
       case "date":
         let commitsInDateRange = await gitDataProvider.GetCommitsInDateRange(
           this.teamProject,
           this.repoId,
           String(this.from),
           String(this.to)
         );
         artifactChanges = await gitDataProvider.GetItemsInCommitRange(
           this.teamProject,
           this.repoId,
           commitsInDateRange
         );
         this.rawChangesArray.push({
           artifact: focusedArtifact,
           changes: artifactChanges,
         });
         break;
      case "pipeline":
        focusedArtifact = await pipelinesDataProvider.getPipelineFromPipelineId(
          this.teamProject,
          Number(this.to)
        );
        artifactChanges = await gitDataProvider.GetItemsForPipelinesRange(
          this.teamProject,
          Number(this.from),
          Number(this.to)
        );
        this.rawChangesArray.push({
          artifact: { name: focusedArtifact.repository.name },
          changes: artifactChanges,
        });
        break;
      case "release":
        //get list of artifacts for each release
        let fromRelease = await pipelinesDataProvider.GetReleaseByReleaseId(
          this.teamProject,
          Number(this.from)
        );
        let toRelease = await pipelinesDataProvider.GetReleaseByReleaseId(
          this.teamProject,
          Number(this.to)
        );
        logger.info(
          `retrived release artifacts for releases : ${fromRelease} - ${toRelease}`
        );
        //create factory for each aritfact
        await Promise.all(
          toRelease.artifacts.map(async (toArtifact) => {
            let fromArtifact = fromRelease.artifacts.filter(
              (artifact) => artifact.sourceId === toArtifact.sourceId
            );
            //checks if artifacts did not exist in previos release
            fromArtifact = fromArtifact[0] || null;
            if (fromArtifact == null) {
              fromArtifact = toArtifact;
            }
            switch (toArtifact.type) {
              case "Build":
                logger.debug(
                  `fetching links between ${fromArtifact.definitionReference.version.id}-${toArtifact.definitionReference.version.id}`
                );
                let buildChangeFactory = new ChangeDataFactory(
                  this.teamProject,
                  fromArtifact.definitionReference.repository.name,
                  fromArtifact.definitionReference.version.id,
                  toArtifact.definitionReference.version.id,
                  "pipeline",
                  null,
                  this.dgDataProviderAzureDevOps
                );
                await buildChangeFactory.fetchData();
                let rawData = buildChangeFactory.getRawData();
                this.rawChangesArray = [...this.rawChangesArray, ...rawData];
                break;
              case "Git":
                break;
            }
          })
        );
        break;
      default:
        break;
    }
    logger.info(`fetch ${this.rawChangesArray.length} changes for range`);
  }//fetchData
  
  /*arranging the test data for json skins package*/
  async jsonSkinDataAdpater() {
    let changesTableDataSkinAdapter = new ChangesTableDataSkinAdapter(
      this.rawChangesArray
    );
    changesTableDataSkinAdapter.adoptSkinData();
    this.adoptedChangeData = changesTableDataSkinAdapter.getAdoptedData();
  }//jsonSkinDataAdpater
  
  getRawData() {
    return this.rawChangesArray;
  }//getRawData
  
  getAdoptedData() {
    return this.adoptedChangeData;
  }//getAdoptedData
}
