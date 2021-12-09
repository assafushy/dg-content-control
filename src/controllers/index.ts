import Skins from "@doc-gen/dg-skins";
import DgDataProviderAzureDevOps from "@doc-gen/dg-data-provider-azuredevops";
import TestDataFactory from "../factories/TestDataFactory";
import TraceDataFactory from "../factories/TraceDataFactory";
import RichTextDataFactory from "../factories/RichTextDataFactory";
import ChangeDataFactory from "../factories/ChangeDataFactory";
import logger from "../services/logger";
import { json } from "express";
import contentControl from "../models/contentControl";
import { trace } from "console";


let styles = {
  isBold: false,
  IsItalic: false,
  IsUnderline: false,
  Size: 10,
  Uri: null,
  Font: "New Times Roman",
  InsertLineBreak: false,
  InsertSpace: false,
};

//!ADD HANDLING OF DEFUALT STYLES
export default class DgContentControls {
  uri: string;
  PAT: string;
  teamProjectName: string;
  outputType;
  templatePath;
  dgDataProviderAzureDevOps: DgDataProviderAzureDevOps;
  skins: Skins;

  constructor(uri, PAT, teamProjectName, outputType, templatePath) {
    this.uri = uri;
    this.PAT = PAT;
    this.teamProjectName = teamProjectName;
    this.outputType = outputType;
    this.templatePath = templatePath;
  }

  async init() {
    logger.debug(`Initilizing DGContentControls`);
    //initilizing azureDevops connection
    this.dgDataProviderAzureDevOps = new DgDataProviderAzureDevOps(
      this.uri,
      this.PAT
      );
    if (!this.templatePath)
    {
      this.templatePath = "template path"
    }
    this.skins = new Skins("json",this.templatePath)
    logger.debug(`Initilized`);
    return true;
  } //init

  async generateDocTemplate() {
    try {
      return this.skins.getDocumentSkin();
    } catch (error) {
      logger.error(`Error initlizing Skins:
      ${JSON.stringify(error)} `);
    }
  }

  async generateContentControl(contentControlOptions) {
    try {
      switch (contentControlOptions.type) {
        case "query":
          await this.addQueryBasedContent(
            contentControlOptions.data.queryId,
            contentControlOptions.title,
            contentControlOptions.skinType,
            contentControlOptions.headingLevel
          );
          break;
        case "test-description":
          await this.addTestDescriptionContent(
            contentControlOptions.data.testPlanId,
            contentControlOptions.data.testSuiteArray,
            contentControlOptions.title,
            contentControlOptions.headingLevel,
            contentControlOptions.data.includeAttachments
          );
          break;
        case "trace-table":
          await this.addTraceTableContent(
            contentControlOptions.data.testPlanId,
            contentControlOptions.data.testSuiteArray,
            contentControlOptions.data.queryId,
            contentControlOptions.data.linkTypeFilterArray,
            contentControlOptions.title,
            contentControlOptions.headingLevel
          );
          break;
        case "test-result-test-group-summary-table":
          await this.addTestResultTestGroupSummaryTable(
            contentControlOptions.data.testPlanId,
            contentControlOptions.data.testSuiteArray,
            contentControlOptions.title,
            contentControlOptions.headingLevel,
            contentControlOptions.data.includeAttachments
          );
          break;
        case "change-description-table":
          return this.addChangeDescriptionTable(
            contentControlOptions.data.repoId,
            contentControlOptions.data.from,
            contentControlOptions.data.to,
            contentControlOptions.data.rangeType,
            contentControlOptions.data.linkTypeFilterArray,
            contentControlOptions.title,
            contentControlOptions.headingLevel
          );
      }
    } catch (error) {
      logger.error(`Error initlizing Skins:
      ${JSON.stringify(error)} `);
    }
  }

  async addQueryBasedContent(
    queryId: string,
    contentControlTitle: string,
    skinType: string,
    headingLevel?: number,
    contentControl?: contentControl
  ) {
    logger.debug(`running GetQueryResultById with params:
      queryId:${queryId}
      teamProjectName:${this.teamProjectName}`);
    let res: any;
    try {
      let ticketsDataProvider =
        await this.dgDataProviderAzureDevOps.getTicketsDataProvider();
      res = await ticketsDataProvider.GetQueryResultById(
        queryId,
        this.teamProjectName
      );
    } catch (error) {
      logger.error(`Error Quering Azure with query id :${queryId}`);
      console.log(error);
    }

    res.forEach((wi, i) => {
      wi.fields.forEach(async (field, t) => {
        if (
          field.name === "Description" ||
          field.name === "Test Description:"
        ) {
          let richTextFactory = new RichTextDataFactory(
            field.value || "No description",
            this.templatePath
          );
          await richTextFactory.createRichTextContent();
          res[i].fields[t].richText = richTextFactory.skinDataContentControls;
        }
      });
    });
    try {
      if (!contentControl){
        contentControl = { title: contentControlTitle, wordObjects: [] };
      }
      logger.debug(JSON.stringify(contentControlTitle));
      logger.debug(JSON.stringify(skinType));
      logger.debug(JSON.stringify(styles));
      logger.debug(JSON.stringify(headingLevel));
      let skin =  await this.skins.addNewContentToDocumentSkin(
        contentControlTitle,
        skinType,
        res,
        styles,
        headingLevel
      );
      contentControl.wordObjects.push(skin[0]);
      return contentControl;

    } catch (error) {
      logger.error(`Error adding content contorl:`);
      console.log(error.data);
    }
  }

  async addTestDescriptionContent(
    testPlanId: number,
    testSuiteArray: number[],
    contentControlTitle: string,
    headingLevel?: number,
    includeAttachments: boolean = true,
    contentControl?: contentControl
  ) {
    logger.debug(`fetching test data with params:
      testPlanId:${testPlanId}
      testSuiteArray:${testSuiteArray}
      teamProjectName:${this.teamProjectName}`);
    let testDataFactory: TestDataFactory;
    try {
      testDataFactory = new TestDataFactory(
        this.teamProjectName,
        testPlanId,
        testSuiteArray,
        includeAttachments,
        false,
        this.dgDataProviderAzureDevOps,
        this.templatePath
      );
      await testDataFactory.fetchTestData();
      // await changeDataFactory.jsonSkinDataAdpater();
      // adoptedChangesData = changeDataFactory.getAdoptedData();
    } catch (error) {
      logger.error(`Error initilizing test data factory`);
      console.log(error);
    }
    try {
      if (!contentControl){
        contentControl = { title: contentControlTitle, wordObjects: [] };
      }
      logger.debug(JSON.stringify(contentControlTitle));
      logger.debug(JSON.stringify(this.skins.SKIN_TYPE_TEST_PLAN));
      logger.debug(JSON.stringify(styles));
      logger.debug(JSON.stringify(headingLevel));
      let skin = await this.skins.addNewContentToDocumentSkin(
        contentControlTitle,
        this.skins.SKIN_TYPE_TEST_PLAN,
        testDataFactory.adoptedTestData,
        styles,
        headingLevel,
        includeAttachments
      );
      contentControl.wordObjects.push(skin[0]);
      return contentControl;
    } catch (error) {
      logger.error(`Error adding content contorl:`);
      console.log(error.data);
    }
  }

  async addTraceTableContent(
    testPlanId: number,
    testSuiteArray: number[],
    queryId: string,
    linkTypeFilterArray: string[],
    contentControlTitle: string,
    headingLevel?: number,
    contentControl?: contentControl

  ) {
    let traceFactory;
    logger.debug(`fetching data with params:
      testPlanId:${testPlanId}
      testSuiteArray:${testSuiteArray}
      queryId:${queryId}
      filterArray: ${JSON.stringify(linkTypeFilterArray)}
      teamProjectName:${this.teamProjectName}`);
    try {
      traceFactory = new TraceDataFactory(
        this.teamProjectName,
        testPlanId,
        testSuiteArray,
        queryId,
        linkTypeFilterArray,
        this.dgDataProviderAzureDevOps
      );
      await traceFactory.fetchData();
    } catch (error) {
      logger.error(`Error initilizing tracedata factory`);
      console.log(error);
    }
      try {
        if (!contentControl){
          contentControl = { title: contentControlTitle, wordObjects: [] };
        }
      logger.debug(JSON.stringify(contentControlTitle));
      logger.debug(JSON.stringify(this.skins.SKIN_TYPE_TEST_PLAN));
      logger.debug(JSON.stringify(styles));
      logger.debug(JSON.stringify(headingLevel));
      let skin = await this.skins.addNewContentToDocumentSkin(
        contentControlTitle,
        this.skins.SKIN_TYPE_TABLE,
        traceFactory.adoptedData,
        styles,
        headingLevel
      );
      contentControl.wordObjects.push(skin[0]);
      return contentControl
    } catch (error) {
      logger.error(`Error adding content contorl:`);
      console.log(error.data);
    }
  }

  async addTestResultTestGroupSummaryTable(
    testPlanId: number,
    testSuiteArray: number[],
    contentControlTitle: string,
    headingLevel?: number,
    includeAttachments: boolean = true,
    contentControl?: contentControl
  ) {
    let testDataFactory: TestDataFactory;
    logger.debug(`fetching data with params:
      testPlanId:${testPlanId}
      testSuiteArray:${testSuiteArray}
      teamProjectName:${this.teamProjectName}`);
    try {
      testDataFactory = new TestDataFactory(
        this.teamProjectName,
        testPlanId,
        testSuiteArray,
        includeAttachments,
        true,
        this.dgDataProviderAzureDevOps,
        this.templatePath
      );
      await testDataFactory.fetchTestData();
    } catch (error) {
      logger.error(`Error initilizing test data factory`);
      console.log(error);
    }
    try {
      if (!contentControl){
        contentControl = { title: contentControlTitle, wordObjects: [] };
      }
      logger.debug(JSON.stringify(contentControlTitle));
      logger.debug(JSON.stringify(this.skins.SKIN_TYPE_TABLE));
      logger.debug(JSON.stringify(styles));
      logger.debug(JSON.stringify(headingLevel));
      let adoptedData = await testDataFactory.getAdoptedTestData();
      let skin = await this.skins.addNewContentToDocumentSkin(
        contentControlTitle,
        this.skins.SKIN_TYPE_TEST_PLAN,
        adoptedData,
        styles,
        headingLevel
      );
      contentControl.wordObjects.push(skin[0]);
      return contentControl
    } catch (error) {
      logger.error(`Error adding content contorl:`);
      console.log(error.data);
    }
  }
  async addChangeDescriptionTable(
    repoId: string,
    from: string | number,
    to: string | number,
    rangeType: string,
    linkTypeFilterArray: string[],
    contentControlTitle: string,
    headingLevel?: number,
    contentControl?: contentControl
  ) {
    let adoptedChangesData;
    logger.debug(`fetching data with params:
      repoId:${repoId}
      from:${from}
      to:${to}
      rangeType: ${rangeType},
      linkTypeFilterArray:${linkTypeFilterArray}
      teamProjectName:${this.teamProjectName}`);

    try {
      let changeDataFactory = new ChangeDataFactory(
        this.teamProjectName,
        repoId,
        from,
        to,
        rangeType,
        linkTypeFilterArray,
        this.dgDataProviderAzureDevOps
      );
      await changeDataFactory.fetchData();
      await changeDataFactory.jsonSkinDataAdpater();
      adoptedChangesData = changeDataFactory.getAdoptedData();
    } catch (error) {
      logger.error(`Error initilizing change table factory`);
      console.log(error);
    }
    try {
      if (!contentControl){
      contentControl = { title: contentControlTitle, wordObjects: [] };
      }
      logger.debug(JSON.stringify(contentControlTitle));
      logger.debug(JSON.stringify(this.skins.SKIN_TYPE_TABLE));
      logger.debug(JSON.stringify(styles));
      logger.debug(JSON.stringify(headingLevel));

      for (const artifactChangesData of adoptedChangesData) {
        let paragraphSkin = await this.skins.addNewContentToDocumentSkin(
          contentControlTitle,
          this.skins.SKIN_TYPE_PARAGRAPH,
          artifactChangesData.artifact,
          styles,
          headingLevel
        );

        let tableSkin = await this.skins.addNewContentToDocumentSkin(
          contentControlTitle,
          this.skins.SKIN_TYPE_TABLE,
          artifactChangesData.artifactChanges,
          styles,
          headingLevel
        );
        contentControl.wordObjects.push(paragraphSkin[0]);
        contentControl.wordObjects.push(tableSkin[0]);
        return contentControl;
      }
    } catch (error) {
      logger.error(`Error adding content contorl:`);
      console.log(error.data);
    }
  }
  getDocument() {
    return this.skins.getDocumentSkin();
  }
} //class
