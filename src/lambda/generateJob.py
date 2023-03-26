import os
import boto3
import json
import uuid

tableName = os.environ['JOB_TABLE_NAME']
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(tableName)

envQueueUrl = os.environ['ENV_QUEUE_URL']
client = boto3.client('sqs')

def handler(event, context):
    item = {
            'jobID': str(uuid.uuid1()),
            'max_stats': event["body"]
        }
    
    table.put_item(
        Item=item
    )

    message = client.send_message(
            QueueUrl=envQueueUrl,
            MessageBody=json.dumps(item)
        )
    
    return {
        'statusCode': 200,
        'body': json.dumps(item, indent=2)
    }
