import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export class DpsSimBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ************** SQS **************

    // ************** Lambda Layers **************

    // ************** Lambda Functions **************

    const entry = path.join(__dirname, '../src/lambda/helloWorld.py')

    const helloWorldLambda = new PythonFunction(this, 'helloWorld', {
      entry,
      runtime: Runtime.PYTHON_3_9
    })

    // ************** API Gateway **************

    const httpAPI = new HttpApi(this, 'DPSSimAPI', {
      apiName: 'DPSSimAPI'
    })

    httpAPI.addRoutes({
      path: '/report',
      methods: [ HttpMethod.POST ],
      integration: new HttpLambdaIntegration('helloWorld', helloWorldLambda)
    })

  }
}
