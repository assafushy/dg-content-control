import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import logger from "../services/logger";
import DgContentControls from "../controllers";

export class Routes {
  public routes(app: any): void {
    app
      .route("/generate-doc-template")
      .post(async ({ body }: Request, res: Response) => {
        try {
          const dgContentControls = new DgContentControls(
            body.orgUrl,
            body.token,
            body.projectName,
            body.outputType,
            body.templateUrl
          );
          await dgContentControls.init();
          let resJson: any = await dgContentControls.generateDocTemplate(
            body.outputType,
            body.templateUrl
          );
          res.status(StatusCodes.OK).json(resJson);
        } catch (error) {}
      });

    app
      .route("/generate-content-control")
      .post(async ({ body }: Request, res: Response) => {
        try {
          const dgContentControls = new DgContentControls(
            body.orgUrl,
            body.token,
            body.projectName,
            body.outputType,
            body.templateUrl
          );
          logger.info(`request recieved with body :
          ${JSON.stringify(body)}`);
          await dgContentControls.init();
          let resJson: any = await dgContentControls.generateContentControl(
            body.contentControlOptions
          );
          res.status(StatusCodes.OK).json(resJson);
        } catch (error) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
          logger.error(`server error : ${JSON.stringify(error)}`);
        }
      });
  }
}
