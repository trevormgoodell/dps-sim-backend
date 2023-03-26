import os
import boto3
import json

sfn_arn = os.environ['STATE_MACHINE_ARN']
client = boto3.client('stepfunctions')

def handler(event, context):
    
    print("Event:", event)
    print("Context:", context)

    jobID = json.loads(event['Records'][0]['body'])['jobID']

    response = client.start_execution(
        stateMachineArn=sfn_arn,
        name=jobID,
        input='{}'
    )

    print("Response:", response)

    return json.loads(json.dumps(response, default=str))

