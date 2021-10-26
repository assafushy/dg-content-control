import Skins from "@doc-gen/dg-skins";
import DgDataProviderAzureDevOps from "@doc-gen/dg-data-provider-azuredevops";
import TestDataFactory from "./factories/TestDataFactory";
import TraceDataFactory from "./factories/TraceDataFactory";
import RichTextDataFactory from "./factories/RichTextDataFactory";
import ChangeDataFactory from "./factories/ChangeDataFactory";
import logger from "./services/logger";

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
export default class DGContentControls {
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
    this.dgDataProviderAzureDevOps = new DgDataProviderAzureDevOps(this.uri, this.PAT);
    //initilizing skins
    try {
      this.skins = new Skins(this.outputType, this.templatePath);
    } catch (error) {
      logger.error(`Error initlizing Skins:
      ${JSON.stringify(error)} `);
    }
    logger.info(`document initlized succesfully`);
  } //init

  async addQueryBasedContent(
    queryId: string,
    contentControlTitle: string,
    skinType: string,
    headingLevel?: number
  ) {
    logger.debug(`running GetQueryResultById with params:
      queryId:${queryId}
      teamProjectName:${this.teamProjectName}`);
    let res: any;
    try {
      let ticketsDataProvider = await this.dgDataProviderAzureDevOps.getTicketsDataProvider();
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
      logger.debug(JSON.stringify(contentControlTitle));
      logger.debug(JSON.stringify(skinType));
      logger.debug(JSON.stringify(styles));
      logger.debug(JSON.stringify(headingLevel));
      await this.skins.addNewContentToDocumentSkin(
        contentControlTitle,
        skinType,
        res,
        styles,
        headingLevel
      );
      logger.info(
        `content control - ${contentControlTitle} with skin - ${skinType} - created`
      );
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
    includeAttachments: boolean = true
  ) {
    logger.debug(`fetching test data with params:
      testPlanId:${testPlanId}
      testSuiteArray:${testSuiteArray}
      teamProjectName:${this.teamProjectName}`);
    let res: any;
    let testDataFactory: TestDataFactory;
    let testData: any;
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
    } catch (error) {
      logger.error(`Error initilizing test data factory`);
      console.log(error);
    }
    try {
      logger.debug(JSON.stringify(contentControlTitle));
      logger.debug(JSON.stringify(this.skins.SKIN_TYPE_TEST_PLAN));
      logger.debug(JSON.stringify(styles));
      logger.debug(JSON.stringify(headingLevel));
      await this.skins.addNewContentToDocumentSkin(
        contentControlTitle,
        this.skins.SKIN_TYPE_TEST_PLAN,
        testDataFactory.adoptedTestData,
        styles,
        headingLevel,
        includeAttachments
      );
      logger.info(
        `content control - ${contentControlTitle} with skin - ${this.skins.SKIN_TYPE_TEST_PLAN} - created`
      );
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
    headingLevel?: number
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
      logger.debug(JSON.stringify(contentControlTitle));
      logger.debug(JSON.stringify(this.skins.SKIN_TYPE_TEST_PLAN));
      logger.debug(JSON.stringify(styles));
      logger.debug(JSON.stringify(headingLevel));
      await this.skins.addNewContentToDocumentSkin(
        contentControlTitle,
        this.skins.SKIN_TYPE_TABLE,
        traceFactory.adoptedData,
        styles,
        headingLevel
      );
      logger.info(
        `content control - ${contentControlTitle} with skin - ${this.skins.SKIN_TYPE_TABLE} - created`
      );
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
    includeAttachments: boolean = true
  ) {
    let testDataFactory: TestDataFactory;
    let testData: any;
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
      logger.debug(JSON.stringify(contentControlTitle));
      logger.debug(JSON.stringify(this.skins.SKIN_TYPE_TABLE));
      logger.debug(JSON.stringify(styles));
      logger.debug(JSON.stringify(headingLevel));
      let adoptedData = await testDataFactory.getAdoptedTestData();
      await this.skins.addNewContentToDocumentSkin(
        contentControlTitle,
        this.skins.SKIN_TYPE_TABLE,
        adoptedData,
        styles,
        headingLevel
      );
      logger.info(
        `content control - ${contentControlTitle} with skin - ${this.skins.SKIN_TYPE_TABLE} - created`
      );
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
    headingLevel?: number
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
      logger.debug(JSON.stringify(contentControlTitle));
      logger.debug(JSON.stringify(this.skins.SKIN_TYPE_TABLE));
      logger.debug(JSON.stringify(styles));
      logger.debug(JSON.stringify(headingLevel));

      for (let i = 0; i < adoptedChangesData.length; i++) {
        let artifactChangesData = adoptedChangesData[i];
        await this.skins.addNewContentToDocumentSkin(
          contentControlTitle,
          this.skins.SKIN_TYPE_PARAGRAPH,
          artifactChangesData.artifact,
          styles,
          headingLevel
        );

        await this.skins.addNewContentToDocumentSkin(
          contentControlTitle,
          this.skins.SKIN_TYPE_TABLE,
          artifactChangesData.artifactChanges,
          styles,
          headingLevel
        );
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
