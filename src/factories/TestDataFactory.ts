import DgDataProviderAzureDevOps from '@doc-gen/dg-data-provider-azuredevops'
import RichTextDataFactory from "./RichTextDataFactory";
import AttachmentsDataFactory from "./AttachmentsDataFactory";
import TestResultGroupSummaryDataSkinAdapter from "../adapters/TestResultGroupSummaryDataSkinAdapter";
import logger from "../services/logger";

const styles = {
  isBold: false,
  IsItalic: false,
  IsUnderline: false,
  Size: 10,
  Uri: null,
  Font: "New Times Roman",
  InsertLineBreak: false,
  InsertSpace: false
};

export default class TestDataFactory {
  isSuiteSpecific = false;
  dgDataProvider: DgDataProviderAzureDevOps;
  teamProject: string;
  testPlanId: number;
  testSuiteArray: number[];
  testDataRaw: any;
  adoptedTestData: any;
  templatePath: string;
  includeAttachments: boolean;
  includeTestResults: boolean;
  constructor(
    teamProject: string = "",
    testPlanId: number = null,
    testSuiteArray: number[] = null,
    includeAttachments: boolean = true,
    includeTestResults: boolean = false,
    dgDataProvider: any,
    templatePath = ""
  ) {
    this.teamProject = teamProject;
    this.testPlanId = testPlanId;
    this.testSuiteArray = testSuiteArray;
    this.includeAttachments = includeAttachments;
    this.dgDataProvider = dgDataProvider;
    this.templatePath = templatePath;
    this.includeTestResults = includeTestResults;
    if (testSuiteArray !== null) {
      this.isSuiteSpecific = true;
    }
  }
  async fetchTestData() {
    let filteredPlan;
    let projectTestPlans: any = await this.dgDataProvider.getTestDataProvider().GetTestPlans(
      this.teamProject
    );
    filteredPlan = projectTestPlans.value.filter(testPlan => {
      return testPlan.id === this.testPlanId;
    });
    let testSuites: any[] = await this.dgDataProvider.getTestDataProvider().GetTestSuitesByPlan(
      this.teamProject,
      `${this.testPlanId}`,
      true
    );
    logger.debug(
      `fetched ${testSuites.length} testSuites for test plan ${this.testPlanId}`
    );
    // check if reccurse fetching by plan or per suite
    if (this.isSuiteSpecific == true && testSuites.length != 0) {
      await Promise.all(
        (testSuites = testSuites.filter(suite => {
          return this.testSuiteArray.indexOf(suite.id) !== -1;
        }))
      );
    } //end of if
    try {
      let allTestCases: any[] = await this.dgDataProvider.getTestDataProvider().GetTestCasesBySuites(
        this.teamProject,
        `${this.testPlanId}`,
        `${this.testPlanId + 1}`,
        true
      );

      logger.debug(
        `fetched ${allTestCases.length} test cases for test suite ${
          this.testPlanId
        }`
      );

      if (testSuites.length != 0) {
        let SuitesAndTestCases: any = [];
        for (let j = 0; j < testSuites.length; j++) {
          let testCases = await this.generateSuiteObject(
            testSuites[j],
            allTestCases
          );
          let temp = testSuites[j];
          if (testCases) {
            SuitesAndTestCases.push({ temp, testCases });
          } else {
            let testCases: any[] = [];
            SuitesAndTestCases.push({ temp, testCases });
          }
        }

        this.testDataRaw = {
          plan: filteredPlan,
          suites: SuitesAndTestCases
        };
        this.adoptedTestData = await this.jsonSkinDataAdpater(null);
      }
    } catch (err) {
      console.log(err);
    }
    return [];
  }

  async generateSuiteObject(suite, allTestCases) {
    let testCases: any = allTestCases.filter(
      testCase => testCase.suit === suite.id
    );

    logger.debug(
      `filtered ${testCases.length} test cases for test suite ${suite.id}`
    );

    if (testCases.length != 0) {
      let testCasesWithAttachments: any = [];
      for (let i = 0; i < testCases.length; i++) {
        let attachmentsData = await this.generateAttachmentData(
          testCases[i].id
        );
        let testCaseWithAttachments: any = JSON.parse(
          JSON.stringify(testCases[i])
        );
        testCaseWithAttachments.attachmentsData = attachmentsData;
        testCasesWithAttachments.push(testCaseWithAttachments);
      }

      //populate test object with results
      if (this.includeTestResults) {
        let testCasesWithAttachmentsAndResults = await this.populateTestRunData(
          testCasesWithAttachments
        );
        return testCasesWithAttachmentsAndResults;
      }
      return testCasesWithAttachments;
    }
  }
  async populateTestRunData(testCasesWithAttachments: any) {
    await Promise.all(
      testCasesWithAttachments.map(async (testcase, i) => {
        let testPoints = await this.dgDataProvider.getTestDataProvider().GetTestPoint(
          this.teamProject,
          String(this.testPlanId),
          testcase.suit,
          testcase.id
        );
        logger.debug(
          `fetched ${testPoints.count} points for tescase ${testcase.id} `
        );
        if (testPoints.count > 0) {
          testPoints.value.forEach(async testPoint => {
            if (testPoint.lastTestRun) {
              if (testPoint.lastTestRun.id > 0) {
                try {
                  testCasesWithAttachments[
                    i
                  ].lastTestRun = await this.dgDataProvider.getTestDataProvider().GetTestRunById(
                    this.teamProject,
                    testPoint.lastTestRun.id
                  );
                } catch (e) {
                  logger.error(
                    `error fetching last run for test point ${testPoint.id} `
                  );
                }
              } else {
                testCasesWithAttachments[i].lastTestRun = null;
              }
            } else {
              testCasesWithAttachments[i].lastTestRun = null;
            }
          });
        }
      })
    );
    return testCasesWithAttachments;
  }
  async generateAttachmentData(testCaseId) {
    try {
      let attachmentsfactory = new AttachmentsDataFactory(
        this.teamProject,
        testCaseId,
        this.templatePath,
        this.dgDataProvider
      );
      if (testCaseId == 1839) {
        logger.debug("Stop!!!!");
      }
      let attachmentsData = await attachmentsfactory.fetchWiAttachments();
      return attachmentsData;
    } catch (e) {
      logger.error(
        `error fetching attachments data for test case ${testCaseId}`
      );
    }
  }
  //arranging the test data for json skins package
  async jsonSkinDataAdpater(adapterType: string = null) {
    let adoptedTestData;
    switch (adapterType) {
      case "test-result-group-summary":
        let testResultGroupSummaryDataSkinAdapter = new TestResultGroupSummaryDataSkinAdapter();
        adoptedTestData = await testResultGroupSummaryDataSkinAdapter.jsonSkinDataAdpater(
          this.testDataRaw
        );
        break;
      default:
        //!TODO - str data -- currently only std data supported
        adoptedTestData = await Promise.all(
          this.testDataRaw.suites.map(async (suite: any) => {
            let suiteSkinData = {
              fields: [
                { name: "ID", value: suite.temp.id, url: suite.temp.url },
                { name: "Title", value: suite.temp.name }
              ],
              level: suite.temp.level
            };
            let testCases = await Promise.all(
              suite.testCases.map(async testCase => {
                let richTextFactory = new RichTextDataFactory(
                  testCase.description || "No description",
                  this.templatePath
                );
                await richTextFactory.createRichTextContent();
                let richText = richTextFactory.skinDataContentControls;
                let testCaseHeaderSkinData = {
                  fields: [
                    { name: "ID", value: testCase.id, url: testCase.url },
                    { name: "Title", value: testCase.title },
                    {
                      name: "Test Description",
                      value: testCase.description || "No description",
                      richText: richText
                    }
                  ],
                  level: suite.temp.level + 1
                };
                let testCaseStepsSkinData;
                try {
                  if (testCase.steps) {
                    testCaseStepsSkinData = await Promise.all(
                      testCase.steps.map(async (testStep: any, i: number) => {
                        //filltering step attachments to array for the table column
                        let testStepAttachments = testCase.attachmentsData.filter(
                          attachment => {
                            return attachment.attachmentComment.includes(
                              `TestStep=${i + 2}`
                            );
                          }
                        );
                        return this.includeAttachments
                          ? {
                              fields: [
                                { name: "#", value: i + 1 },
                                { name: "Description", value: testStep.action },
                                {
                                  name: "Expected Results",
                                  value: testStep.expected
                                },
                                {
                                  name: "attachments",
                                  value: testStepAttachments
                                }
                              ]
                            }
                          : {
                              fields: [
                                { name: "#", value: i + 1 },
                                { name: "Description", value: testStep.action },
                                {
                                  name: "Expected Results",
                                  value: testStep.expected
                                }
                              ]
                            };
                      })
                    );
                  }
                } catch (err) {
                  logger.warn(
                    `potential error - this could also mean no teststeps property found for testcase - ${
                      testCase.id
                    }`
                  );
                  //return empty array of teststeps
                  testCaseStepsSkinData = [
                    {
                      fields: [
                        { name: "#" },
                        { name: "description" },
                        { name: "accepected results" },
                        { name: "attachments" }
                      ]
                    }
                  ];
                }

                let testCaseAttachments = await Promise.all(
                  testCase.attachmentsData
                    .filter(
                      attachment =>
                        !attachment.attachmentComment.includes(`TestStep=`)
                    )
                    .map(async (attachment, i) => {
                      return {
                        fields: [
                          { name: "#", value: i + 1 },
                          {
                            name: "attachment name",
                            value: attachment.attachmentFileName,
                            url: attachment.attachmentLink,
                            relativeUrl: attachment.relativeAttachmentLink
                          }
                        ]
                      };
                    })
                );

                let adoptedTestCaseData = {
                  testCaseHeaderSkinData,
                  testCaseStepsSkinData,
                  testCaseAttachments
                };
                return adoptedTestCaseData;
              })
            );
            return {
              suiteSkinData,
              testCases
            };
          })
        );
        return adoptedTestData;
        break;
    }
    return adoptedTestData;
  }

  async getAdoptedTestData() {
    return this.adoptedTestData;
  }
}
