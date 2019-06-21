'use strict';

const path = require('path');
const { expect } = require('chai');

const { getTmpDirPath } = require('../../utils/fs');
const { createBucket, createAndRemoveInBucket, deleteBucket } = require('../../utils/s3');
const {
  createTestService,
  deployService,
  removeService,
  getFunctionLogs,
  delayPromise,
} = require('../../utils/misc');

describe('AWS - S3 Integration Test', () => {
  let serviceName;
  let stackName;
  let tmpDirPath;
  let bucketMinimalSetup;
  let bucketExtendedSetup;
  let bucketExistingSetup;
  const stage = 'dev';
  const delay = 15000;

  beforeAll(() => {
    tmpDirPath = getTmpDirPath();
    console.info(`Temporary path: ${tmpDirPath}`);
    const serverlessConfig = createTestService(tmpDirPath, {
      templateDir: path.join(__dirname, 'service'),
      serverlessConfigHook:
        // Ensure unique S3 bucket names for each test (to avoid collision among concurrent CI runs)
        config => {
          bucketMinimalSetup = `${config.service}-s3-minimal`;
          bucketExtendedSetup = `${config.service}-s3-extended`;
          bucketExistingSetup = `${config.service}-s3-existing`;
          config.functions.minimal.events[0].s3 = bucketMinimalSetup;
          config.functions.extended.events[0].s3.bucket = bucketExtendedSetup;
          config.functions.existing.events[0].s3.bucket = bucketExistingSetup;
        },
    });
    serviceName = serverlessConfig.service;
    stackName = `${serviceName}-${stage}`;
    // create an external S3 bucket
    // NOTE: deployment can only be done once the S3 bucket is created
    console.info(`Creating S3 bucket "${bucketExistingSetup}"...`);
    return createBucket(bucketExistingSetup).then(() => {
      console.info(`Deploying "${stackName}" service...`);
      deployService();
    });
  });

  afterAll(() => {
    console.info('Removing service...');
    removeService();
    console.info(`Deleting S3 bucket "${bucketExistingSetup}"...`);
    return deleteBucket(bucketExistingSetup);
  });

  describe('Minimal Setup', () => {
    const expectedMessage = 'Hello from S3! - (minimal)';

    it('should invoke function when an object is created', () => {
      return createAndRemoveInBucket(bucketMinimalSetup)
        .then(() => delayPromise(delay))
        .then(() => {
          const logs = getFunctionLogs('minimal');
          expect(/aws:s3/g.test(logs)).to.equal(true);
          expect(/ObjectCreated:Put/g.test(logs)).to.equal(true);
          expect(logs.includes(expectedMessage)).to.equal(true);
        });
    });
  });

  describe('Extended Setup', () => {
    const expectedMessage = 'Hello from S3! - (extended)';

    it('should invoke function when an object is removed', () => {
      return createAndRemoveInBucket(bucketExtendedSetup, { prefix: 'photos/', suffix: '.jpg' })
        .then(() => delayPromise(delay))
        .then(() => {
          const logs = getFunctionLogs('extended');
          expect(/aws:s3/g.test(logs)).to.equal(true);
          expect(/ObjectRemoved:Delete/g.test(logs)).to.equal(true);
          expect(logs.includes(expectedMessage)).to.equal(true);
        });
    });
  });

  describe('Existing Setup', () => {
    const expectedMessage = 'Hello from S3! - (existing)';

    it('should invoke function when an object is created', () => {
      return createAndRemoveInBucket(bucketExistingSetup, { prefix: 'files/', suffix: '.txt' })
        .then(() => delayPromise(delay))
        .then(() => {
          const logs = getFunctionLogs('existing');
          expect(/aws:s3/g.test(logs)).to.equal(true);
          expect(/ObjectCreated:Put/g.test(logs)).to.equal(true);
          expect(logs.includes(expectedMessage)).to.equal(true);
        });
    });
  });
});
