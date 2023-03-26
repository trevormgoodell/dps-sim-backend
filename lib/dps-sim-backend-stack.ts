import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { PythonFunction, PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Lambda } from 'aws-cdk-lib/aws-ses-actions';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export class DpsSimBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ************** SQS **************

    const deadLetterQueue = new sqs.Queue(this, "envDLQueue", {
      queueName: "evnDLQ"
    });

    const envQueue = new sqs.Queue(this, 'Env-Queue', {
      queueName: 'EnvQueue',
      receiveMessageWaitTime: cdk.Duration.seconds(20),
      deadLetterQueue: {
        maxReceiveCount: 1,
        queue: deadLetterQueue
      }
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

    // ************** S3 **************

    const modelBucket = new s3.Bucket(this, 'Model-Bucket', {
      bucketName: "dps-sim-models",
      removalPolicy: RemovalPolicy.DESTROY
    });

    // ************** Lambda Layers **************
    //const sdkLayer = new PythonLayerVersion(this, 'sdk-layer', {
    //  entry: "src/layer/sdk-layer"
    //})

    // ************** Lambda Functions **************

    const generateJobLambda = new PythonFunction(this, 'generateJob', {
      entry: path.join(__dirname, '../src/lambda/'),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'handler',
      index: 'generateJob.py',
      environment: {
        JOB_TABLE_NAME: jobTable.tableName,
        ENV_QUEUE_URL: envQueue.queueUrl
      },
      functionName: "generateJob"
    });

    const generateStatDistrosLambda = new PythonFunction(this, 'generateStatDistros', {
      entry: path.join(__dirname, '../src/lambda/'),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'handler',
      index: 'generateStatDistros.py',
      environment: {
        ENV_QUEUE_URL: envQueue.queueUrl,
      },
      functionName: "generateStatDistros"
    });

    const repo = ecr.Repository.fromRepositoryArn(this, "tf_repo", "arn:aws:ecr:us-east-1:573057818125:repository/model_inference")

    const runModelInferenceLambda = new lambda.Function(this, "runModelInferenceLambda", {
      code: lambda.Code.fromEcrImage(repo),
      handler: lambda.Handler.FROM_IMAGE,
      runtime: Runtime.FROM_IMAGE,
      functionName: "runModelInferenceLambda",
      timeout: Duration.seconds(900),
      memorySize: 1024,
      environment: {
        BUCKET_NAME: modelBucket.bucketName
      }
    });

    const organizeResults = new PythonFunction(this, 'organizeResults', {
      entry: path.join(__dirname, '../src/lambda/'),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'handler',
      index: 'organizeResults.py',
      environment: {
        JOB_TABLE_NAME: jobTable.tableName,
        ENV_QUEUE_URL: envQueue.queueUrl
      },
      functionName: "organizeResults"
    });

    // ************** Step Function **************
    
    const genStatsJob = new tasks.LambdaInvoke(this, 'Generate Stats', {
      lambdaFunction: generateStatDistrosLambda,
    });

    const runInfJob = new tasks.LambdaInvoke(this, 'Run Inference', {
      lambdaFunction: runModelInferenceLambda,
    });

    const orgResJob = new tasks.LambdaInvoke(this, 'Organize Results', {
      lambdaFunction: organizeResults,
    });

    const definition = genStatsJob
      .next(new sfn.Map(this, 'Run all inferences', {
        maxConcurrency: 100,
        inputPath: "$.Payload.Stats"
      }).iterator(runInfJob))
      .next(orgResJob)

    const modelSfn = new sfn.StateMachine(this, 'StateMachine', {
      definition,
      stateMachineName: "modelSFN"
    });

    const startSFNLambda = new PythonFunction(this, 'startSFN', {
      entry: path.join(__dirname, '../src/lambda/'),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'handler',
      index: 'startSFN.py',
      environment: {
        STATE_MACHINE_ARN: modelSfn.stateMachineArn
      },
      functionName: "startSFN"
    });

    const eventSource = new SqsEventSource(envQueue);
    startSFNLambda.addEventSource(eventSource);

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
    startSFNLambda.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSQSFullAccess'))
    startSFNLambda.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSStepFunctionsFullAccess'))

    generateJobLambda.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSQSFullAccess'))
    generateJobLambda.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'))

    runModelInferenceLambda.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'))
  }
}
