import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Duration } from 'aws-cdk-lib';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class DpsSimBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const revisionQueue = new sqs.Queue(this, 'my-test-queue', {
      queueName: 'MyTestQueue',
      receiveMessageWaitTime: Duration.seconds(20)
    });
  }
}
