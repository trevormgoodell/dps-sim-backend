import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
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

    // ************** Lambda Layers **************

    const pythonLayer = new lambda.LayerVersion(this, 'python-layer', {
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_8],
      code: lambda.Code.fromAsset('src/layers/aws-layer/'),
      description: 'Necessary Python modules'
    })

    // ************** Lambda Functions **************

    const simcParserLambda = new PythonFunction(this, 'simcParser', {
      entry: path.join(__dirname, '../src/lambda/'),
      runtime: Runtime.PYTHON_3_8,
      handler: 'handler',
      index: 'simcParser.py',
      environment: {
        ENV_QUEUE_URL: envQueue.queueUrl
      },
      layers: [pythonLayer]

    });

    // ************** API Gateway **************

    const httpAPI = new HttpApi(this, 'DPSSimAPI', {
      apiName: 'DPSSimAPI'
    });

    httpAPI.addRoutes({
      path: '/report',
      methods: [ HttpMethod.POST ],
      integration: new HttpLambdaIntegration('helloWorld', simcParserLambda)
    });

    // ************** Permissions **************
    simcParserLambda.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSQSFullAccess'))

  }
}
