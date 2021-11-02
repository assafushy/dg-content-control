import DGContentControls from "../index";
import RichTextDataFactory from "../factories/RichTextDataFactory";
import TestResultGroupSummaryDataSkinAdapter from "../adapters/TestResultGroupSummaryDataSkinAdapter";
import DownloadManager from "../services/DownloadManager";
jest.setTimeout(30000000);
require("dotenv").config();

const orgUrl = process.env.ORG_URL;
const token = process.env.PAT;

describe.skip("Generate json document from queries - tests", () => {
  test("generate table content control - flat query", async () => {
    let dgContent = new DGContentControls(
      "http://org-azdo/tfs/TestCollection/",
      "m5ootoppncbhyfps5qgi5kn7wvtssjprwzc7onk5hsyrohz2lh4q",
      "doc-gen-test",
      "json",
      "c:\\assaf\\SRS.dotx"
    );
    await dgContent.init();
    await dgContent.addQueryBasedContent(
      "88402386-34fb-4074-bb9f-a75a0ac24c6f",
      "system-capabilities",
      "table",
      3
    );

    let jsonDoc = dgContent.getDocument();
    const SnapShot = require("../../samples/snapshots/queries/flat-query-table-snapshot.json");
    expect(jsonDoc).toMatchObject(SnapShot);
  });
  test("generate paragraph content control - flat query", async () => {
    let dgContent = new DGContentControls(
      "http://org-azdo/tfs/TestCollection/",
      "m5ootoppncbhyfps5qgi5kn7wvtssjprwzc7onk5hsyrohz2lh4q",
      "doc-gen-test",
      "json",
      "c:\\assaf\\SRS.dotx"
    );
    await dgContent.init();
    await dgContent.addQueryBasedContent(
      "88402386-34fb-4074-bb9f-a75a0ac24c6f",
      "system-capabilities",
      "paragraph",
      3
    );

    let jsonDoc = dgContent.getDocument();
    const SnapShot = require("../../samples/snapshots/queries/flat-query-paragraph-snapshot.json");
    expect(jsonDoc).toMatchObject(SnapShot);
  });
  test("generate table content control - tree query", async () => {
    let dgContent = new DGContentControls(
      "http://org-azdo/tfs/TestCollection/",
      "m5ootoppncbhyfps5qgi5kn7wvtssjprwzc7onk5hsyrohz2lh4q",
      "doc-gen-test",
      "json",
      "c:\\assaf\\SRS.dotx"
    );
    await dgContent.init();
    await dgContent.addQueryBasedContent(
      "46a16d2a-1a2f-4fe3-8c9d-d600ffa9c68b",
      "system-capabilities",
      "table",
      3
    );

    let jsonDoc = dgContent.getDocument();
    const SnapShot = require("../../samples/snapshots/queries/tree-query-table-snapshot.json");
    expect(jsonDoc).toMatchObject(SnapShot);
  });

  //TO Check!!!
  test("generate paragraph content control - tree query", async () => {
    let dgContent = new DGContentControls(
      "http://org-azdo/tfs/TestCollection/",
      "m5ootoppncbhyfps5qgi5kn7wvtssjprwzc7onk5hsyrohz2lh4q",
      "doc-gen-test",
      "json",
      "c:\\assaf\\SRS.dotx"
    );
    await dgContent.init();
    await dgContent.addQueryBasedContent(
      "46a16d2a-1a2f-4fe3-8c9d-d600ffa9c68b",
      "system-capabilities",
      "paragraph",
      3
    );

    let jsonDoc = dgContent.getDocument();
    const SnapShot = require("../../samples/snapshots/queries/tree-query-paragraph-snapshot.json");
    expect(jsonDoc).toMatchObject(SnapShot);
  });

  test("generate paragraph & table content control - tree query", async () => {
    let dgContent = new DGContentControls(
      "http://org-azdo/tfs/TestCollection/",
      "m5ootoppncbhyfps5qgi5kn7wvtssjprwzc7onk5hsyrohz2lh4q",
      "doc-gen-test",
      "json",
      "c:\\assaf\\SRS.dotx"
    );
    await dgContent.init();
    await dgContent.addQueryBasedContent(
      "46a16d2a-1a2f-4fe3-8c9d-d600ffa9c68b",
      "system-capabilities",
      "paragraph",
      3
    );

    await dgContent.addQueryBasedContent(
      "46a16d2a-1a2f-4fe3-8c9d-d600ffa9c68b",
      "system-capabilities",
      "table",
      3
    );
    let jsonDoc = dgContent.getDocument();
    const SnapShot = require("../../samples/snapshots/queries/tree-query-paragraph-and-table-snapshot.json");
    expect(jsonDoc).toMatchObject(SnapShot);
  });
  test("generate 2 content controls - tree query", async () => {
    let dgContent = new DGContentControls(
      "http://org-azdo/tfs/TestCollection/",
      "m5ootoppncbhyfps5qgi5kn7wvtssjprwzc7onk5hsyrohz2lh4q",
      "doc-gen-test",
      "json",
      "c:\\assaf\\SRS.dotx"
    );
    await dgContent.init();
    await dgContent.addQueryBasedContent(
      "46a16d2a-1a2f-4fe3-8c9d-d600ffa9c68b",
      "system-capabilities",
      "paragraph",
      3
    );

    await dgContent.addQueryBasedContent(
      "46a16d2a-1a2f-4fe3-8c9d-d600ffa9c68b",
      "system-capabilities",
      "table",
      3
    );
    let jsonDoc = dgContent.getDocument();
    const SnapShot = require("../../samples/snapshots/queries/tree-query-two-content-snapshot.json");
    expect(jsonDoc).toMatchObject(SnapShot);
  });
  test.skip("Generate trace-table content control - query", async () => {
    let dgContent = new DGContentControls(
      "http://org-azdo/tfs/TestCollection/",
      "m5ootoppncbhyfps5qgi5kn7wvtssjprwzc7onk5hsyrohz2lh4q",
      "DevOps",
      "json",
      "C:\\docgen\\documents\\181020205911\\SRS-18-10-2020-03-59.dotx"
    );
    await dgContent.init();
    await dgContent.addTraceTableContent(
      null,
      null,
      "46a16d2a-1a2f-4fe3-8c9d-d600ffa9c68b",
      ["System.LinkTypes.Hierarchy-Forward"],
      "system-capabilities",
      0
    );
    let jsonDoc = dgContent.getDocument();
    const SnapShot = require("../../samples/snapshots/queries/query-based-trace-table-snapshot.json");
    expect(jsonDoc).toMatchObject(SnapShot);
  });
});
describe.skip("Generate json document from test plans - tests", () => {
  test("Generate std content control - complex test plan with attachments", async () => {
    let dgContent = new DGContentControls(
      "http://org-azdo/tfs/TestCollection/",
      "m5ootoppncbhyfps5qgi5kn7wvtssjprwzc7onk5hsyrohz2lh4q",
      "DevOps",
      "json",
      "C:\\docgen\\documents\\99999999\\STD-13-12-2020-03-40.dotx" //131220204041
    );
    await dgContent.init();
    await dgContent.addTestDescriptionContent(
      1828,
      undefined,
      "tests-description-content-control",
      4,
      true
    );
    let jsonDoc = dgContent.getDocument();
    expect(jsonDoc.contentControls[0].wordObjects.length).toBeGreaterThan(10);
  });
  test("Generate std content control - complex test plan no attachments", async () => {
    let dgContent = new DGContentControls(
      "http://org-azdo/tfs/TestCollection/",
      "m5ootoppncbhyfps5qgi5kn7wvtssjprwzc7onk5hsyrohz2lh4q",
      "DevOps",
      "json",
      "C:\\docgen\\documents\\99999999\\STD-13-12-2020-03-40.dotx" //
    );
    await dgContent.init();
    await dgContent.addTestDescriptionContent(
      1828,
      undefined,
      "tests-description-content-control",
      4,
      false
    );
    let jsonDoc = dgContent.getDocument();
    expect(jsonDoc.contentControls[0].wordObjects.length).toBeGreaterThan(10);
  });
  test.skip("Generate std content control - 1400 testcases complex test plan", async () => {
    let dgContent = new DGContentControls(
      "http://org-azdo/tfs/org/",
      "6pxdmymhuk4a67cbp6phuhwh6kczps5rhmacb23i33sib333ln2a",
      "Tactical-C4I",
      "json",
      "C:\\docgen\\documents\\181020205911\\SRS-18-10-2020-03-59.dotx"
    );
    await dgContent.init();
    await dgContent.addTestDescriptionContent(
      52909,
      null,
      "system-capabilities",
      0,
      true
    );
    let jsonDoc = dgContent.getDocument();

    expect(jsonDoc.contentControls.length).toBeGreaterThan(0);
  });
  test("Generate trace-table content control - complex test plan", async () => {
    let dgContent = new DGContentControls(
      "http://org-azdo/tfs/TestCollection/",
      "m5ootoppncbhyfps5qgi5kn7wvtssjprwzc7onk5hsyrohz2lh4q",
      "DevOps",
      "json",
      "C:\\docgen\\documents\\181020205911\\SRS-18-10-2020-03-59.dotx"
    );
    await dgContent.init();
    await dgContent.addTraceTableContent(
      1828,
      null,
      null,
      ["Microsoft.VSTS.Common.TestedBy-Reverse"],
      "system-capabilities",
      0
    );
    let jsonDoc = dgContent.getDocument();
    const SnapShot = require("../../samples/snapshots/tests/test-plan-trace-table-snapshot.json");
    expect(jsonDoc).toMatchObject(SnapShot);
  });
  test.skip("Generate str content control - test-group-summary", async () => {
    let dgContent = new DGContentControls(
      "http://org-azdo/tfs/TestCollection/",
      "m5ootoppncbhyfps5qgi5kn7wvtssjprwzc7onk5hsyrohz2lh4q",
      "DevOps",
      "json",
      "C:\\test\\test.dotx"
    );
    await dgContent.init();
    await dgContent.addTestResultTestGroupSummaryTable(
      1828,
      undefined,
      "system-capabilities",
      4,
      false
    );
    let jsonDoc = dgContent.getDocument();
    expect(jsonDoc.contentControls[0].wordObjects[0].type).toBe("table");
  });
});
describe("Generate json document from git Changeset", () => {
  test("Generate changeset table from commit sha ranges", async () => {
    let dgContent = new DGContentControls(
      orgUrl,
      token,
      "tests",
      "json",
      "path:\\assaf"
    );

    await dgContent.init();
    await dgContent.addChangeDescriptionTable(
      "68f2aee7-0864-458e-93ce-320303a080ed",
      "e46f8023be49db94b5cf188b41f7ba9db6fd8274",
      "4ce7f96f74f10bb60d27d7180a8d1bd44da1ffac",
      "commitSha",
      null,
      "change-description-content-control",
      4
    );
    let jsonDoc = dgContent.getDocument();
    expect(jsonDoc.contentControls.length).toBeGreaterThan(0);
  });
  test.skip("Generate changeset table from date range", async () => {
    let dgContent = new DGContentControls(
      orgUrl,
      token,
      "tests",
      "json",
      "path:\\assaf"
    );

    await dgContent.init();
    await dgContent.addChangeDescriptionTable(
      "95c0c5dd-fefd-411e-bb6b-850e7ce7732a",
      "2020-01-30T12:51:51Z",
      "2021-07-22T12:51:51Z",
      "date",
      null,
      "change-description-content-control",
      4
    );
    let jsonDoc = dgContent.getDocument();
    expect(jsonDoc.contentControls.length).toBeGreaterThan(0);
  });
  test.skip("Generate changeset table from pipeline range", async () => {
    let dgContent = new DGContentControls(
      "http://org-azdo/tfs/org/",
      "6pxdmymhuk4a67cbp6phuhwh6kczps5rhmacb23i33sib333ln2a",
      "DevOps",
      "json",
      "C:\\docgen\\documents\\svd-test\\SVD.dotx"
    );

    await dgContent.init();
    await dgContent.addChangeDescriptionTable(
      "95c0c5dd-fefd-411e-bb6b-850e7ce7732a",
      18501,
      19752,
      "pipeline",
      null,
      "change-description-content-control",
      4
    );
    let jsonDoc = dgContent.getDocument();
    expect(jsonDoc.contentControls.length).toBeGreaterThan(0);
  });
  test.skip("Generate changeset table from release range", async () => {
    let dgContent = new DGContentControls(
      "http://org-azdo/tfs/org/",
      "6pxdmymhuk4a67cbp6phuhwh6kczps5rhmacb23i33sib333ln2a",
      "DevOps",
      "json",
      "C:\\docgen\\documents\\svd-test\\SVD.dotx"
    );

    await dgContent.init();
    await dgContent.addChangeDescriptionTable(
      "95c0c5dd-fefd-411e-bb6b-850e7ce7732a",
      163,
      223,
      "release",
      null,
      "change-description-content-control",
      4
    );
    let jsonDoc = dgContent.getDocument();
    expect(jsonDoc.contentControls.length).toBeGreaterThan(0);
  });
});
describe.skip("Rich Text Data factory Tests", () => {
  test("testing rich text factory with image table and paragraph", () => {
    let RichTextData = require("../../samples/data/richTextData.json");
    let richTextFactory = new RichTextDataFactory(
      RichTextData.description,
      "test=path"
    );
    richTextFactory.createRichTextContent();
    let richText = richTextFactory.skinDataContentControls;
    const SnapShot = require("../../samples/snapshots/common/richTextWithimageTableAndParagraph.json");
    expect(richText).toMatchObject(SnapShot);
  });

  test("testing rich text factory with only text", () => {
    let RichTextData = require("../../samples/data/richTextParagraph.json");
    let richTextFactory = new RichTextDataFactory(
      RichTextData.description,
      "test=path"
    );
    richTextFactory.createRichTextContent();
    let richText = richTextFactory.skinDataContentControls;
    const SnapShot = require("../../samples/snapshots/common/richTextParagraphOnly-contentControl.json");
    expect(richText).toMatchObject(SnapShot);
  });
});
describe.skip("DownloadManger Tests", () => {
  test("should handle linux path", () => {
    let downloadManager = new DownloadManager(
      "/docgen/documents/291020205230/SRS-29-10-2020-11-52.dotx",
      "http://10.180.0.121:8080/tfs/TestCollection/b5d2079a-c6f0-4f25-8a7a-c95ed5e50c50/_apis/wit/attachments/e29ce61e-ee79-40e4-92f6-ec7ece754859",
      "image.png",
      process.env.DOWNLOAD_MANAGER_URL
    );
    expect(downloadManager.destPath).toBe("291020205230");
  });
});
describe.skip("Json data adapters Tests", () => {
  test.skip("Generate str content control - test-group-summary", async () => {
    let rawData = require("../../samples/data/testDataRawWithOutcome.json");
    let testResultGroupSummaryDataSkinAdapter =
      new TestResultGroupSummaryDataSkinAdapter();
    let result =
      await testResultGroupSummaryDataSkinAdapter.jsonSkinDataAdpater(rawData);
    expect(result[0]).toBeDefined();
  });
});
