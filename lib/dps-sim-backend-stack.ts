import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { PythonFunction, PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';
import { LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class DpsSimBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ************** SQS **************

    const envQueue = new sqs.Queue(this, 'Env-Queue', {
      queueName: 'EnvQueue'
    })

    // ************** DynamoDB **************

    const jobTable = new dynamodb.Table(this, 'Job-Table', {
      tableName: 'Jobs',
      partitionKey: { name: 'jobID', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1, 
      writeCapacity: 1, 
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'expire'
    });
    
    // ************** Lambda Functions **************

    const simcParserLambda = new PythonFunction(this, 'simcParser', {
      entry: path.join(__dirname, '../src/lambda/'),
      runtime: Runtime.PYTHON_3_7,
      handler: 'handler',
      index: 'simcParser.py',
      environment: {
        ENV_QUEUE_URL: envQueue.queueUrl
      },
      functionName: "simcParser"

    });

    const generateJobLambda = new PythonFunction(this, 'generateJob', {
      entry: path.join(__dirname, '../src/lambda/'),
      runtime: Runtime.PYTHON_3_7,
      handler: 'handler',
      index: 'generateJob.py',
      environment: {
        JOB_TABLE_NAME: jobTable.tableName
      },
      functionName: "generateJob"

    });

    simcParserLambda.addLayers(
      lambda.LayerVersion.fromLayerVersionArn(this, 'numpy-layer', 'arn:aws:lambda:us-east-1:668099181075:layer:AWSLambda-Python37-SciPy1x:115')
    )

    // ************** API Gateway **************

    const httpAPI = new HttpApi(this, 'DPSSimAPI', {
      apiName: 'DPSSimAPI'
    });

    httpAPI.addRoutes({
      path: '/report',
      methods: [ HttpMethod.POST ],
      integration: new HttpLambdaIntegration('generateJob', generateJobLambda)
    });

    // ************** Permissions **************
    generateJobLambda.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSQSFullAccess'))
    generateJobLambda.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'))

  }
}
