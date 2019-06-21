'use strict';

const { addPermission, removePermission } = require('./lib/permissions');
const { updateConfiguration, removeConfiguration } = require('./lib/bucket');
const { response, getEnvironment, getLambdaArn } = require('../utils');

function handler(event, context) {
  const PhysicalResourceId = 'CustomResouceExistingS3';
  event = Object.assign({}, event, { PhysicalResourceId });

  if (event.RequestType === 'Create') {
    return create(event, context);
  } else if (event.RequestType === 'Update') {
    return update(event, context);
  } else if (event.RequestType === 'Delete') {
    return remove(event, context);
  }
  const error = new Error(`Unhandled RequestType ${event.RequestType}`);
  return response(event, context, 'FAILED', {}, error);
}

function create(event, context) {
  const { Region, AccountId } = getEnvironment(context);
  const { FunctionName, BucketName, BucketConfig } = event.ResourceProperties;

  const lambdaArn = getLambdaArn(Region, AccountId, FunctionName);

  return addPermission({
    functionName: FunctionName,
    bucketName: BucketName,
    region: Region,
  })
    .then(() =>
      updateConfiguration({
        lambdaArn,
        region: Region,
        functionName: FunctionName,
        bucketName: BucketName,
        bucketConfig: BucketConfig,
      })
    )
    .then(() => response(event, context, 'SUCCESS'))
    .catch(error => response(event, context, 'FAILED', {}, error));
}

function update(event, context) {
  const { Region, AccountId } = getEnvironment(context);
  const { FunctionName, BucketName, BucketConfig } = event.ResourceProperties;

  const lambdaArn = getLambdaArn(Region, AccountId, FunctionName);

  return updateConfiguration({
    lambdaArn,
    region: Region,
    functionName: FunctionName,
    bucketName: BucketName,
    bucketConfig: BucketConfig,
  })
    .then(() => response(event, context, 'SUCCESS'))
    .catch(error => response(event, context, 'FAILED', {}, error));
}

function remove(event, context) {
  const { Region } = getEnvironment(context);
  const { FunctionName, BucketName } = event.ResourceProperties;

  return removePermission({
    functionName: FunctionName,
    bucketName: BucketName,
    region: Region,
  })
    .then(() =>
      removeConfiguration({
        region: Region,
        functionName: FunctionName,
        bucketName: BucketName,
      })
    )
    .then(() => response(event, context, 'SUCCESS'))
    .catch(error => response(event, context, 'FAILED', {}, error));
}

module.exports = {
  handler,
};
