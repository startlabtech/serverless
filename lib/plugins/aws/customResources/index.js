'use strict';

const path = require('path');
const createZipFile = require('../../../utils/fs/createZipFile');

function addCustomResourceToService(resourceName) {
  let FunctionName;
  let Handler;

  let customResourceFunctionLogicalId;
  const srcDirPath = path.join(__dirname, 'resources');
  const destDirPath = path.join(
    this.serverless.config.servicePath,
    '.serverless',
    this.provider.naming.getCustomResourcesArtifactDirectoryName()
  );
  const zipFilePath = `${destDirPath}.zip`;
  this.serverless.utils.writeFileDir(zipFilePath);

  if (resourceName === 's3') {
    FunctionName = `${this.serverless.service.service}-${
      this.options.stage
    }-${this.provider.naming.getCustomResourceS3HandlerFunctionName()}`;
    Handler = 's3/handler.handler';
    customResourceFunctionLogicalId = this.provider.naming.getCustomResourceS3HandlerFunctionLogicalId();
  }

  return createZipFile(srcDirPath, zipFilePath).then(outputFilePath => {
    let S3Bucket = {
      Ref: this.provider.naming.getDeploymentBucketLogicalId(),
    };
    if (this.serverless.service.package.deploymentBucket) {
      S3Bucket = this.serverless.service.package.deploymentBucket;
    }
    const s3Folder = this.serverless.service.package.artifactDirectoryName;
    const s3FileName = outputFilePath.split(path.sep).pop();
    const S3Key = `${s3Folder}/${s3FileName}`;

    const customResourceFunction = {
      [customResourceFunctionLogicalId]: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          Code: {
            S3Bucket,
            S3Key,
          },
          FunctionName,
          Handler,
          MemorySize: 1024,
          Role: {
            'Fn::GetAtt': [this.provider.naming.getRoleLogicalId(), 'Arn'],
          },
          Runtime: 'nodejs10.x',
          Timeout: 6,
        },
        DependsOn: [this.provider.naming.getRoleLogicalId()],
      },
    };

    Object.assign(
      this.serverless.service.provider.compiledCloudFormationTemplate.Resources,
      customResourceFunction
    );
  });
}

module.exports = {
  addCustomResourceToService,
};
