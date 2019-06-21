'use strict';

function minimal(event, context, callback) {
  const response = { message: 'Hello from S3! - (minimal)', event };
  process.stdout.write(event.Records[0].eventSource);
  process.stdout.write(event.Records[0].eventName);
  process.stdout.write(' ');
  process.stdout.write(response.message);
  return callback(null, response);
}

function extended(event, context, callback) {
  const response = { message: 'Hello from S3! - (extended)', event };
  process.stdout.write(event.Records[0].eventSource);
  process.stdout.write(event.Records[0].eventName);
  process.stdout.write(' ');
  process.stdout.write(response.message);
  return callback(null, response);
}

function existing(event, context, callback) {
  const response = { message: 'Hello from S3! - (existing)', event };
  process.stdout.write(event.Records[0].eventSource);
  process.stdout.write(event.Records[0].eventName);
  process.stdout.write(' ');
  process.stdout.write(response.message);
  return callback(null, response);
}

module.exports = { minimal, extended, existing };
