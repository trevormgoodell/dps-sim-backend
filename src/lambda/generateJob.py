import os
import boto3
import json
import uuid

envQueueUrl = os.environ['ENV_QUEUE_URL']
client = boto3.client('sqs')


def handler(event, context):

    msg = {
        "job_id": str(uuid.uuid1()),
        "max_stats": event["body"]
    }


    message = client.send_message(
            QueueUrl=envQueueUrl,
            MessageBody=json.dumps(msg)
        )

    return {
        'statusCode': 200,
        'body': json.dumps(message, indent=2)
    }
