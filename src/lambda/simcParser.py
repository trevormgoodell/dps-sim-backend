import os
import boto3
import json
import itertools
import numpy as np


envQueueUrl = os.environ['ENV_QUEUE_URL']


client = boto3.client('sqs')

def handler(event, context):
    print('Hello, world!')
    print(event)
    print(context)

    message = generate_message()

    return {
        'statusCode': 200,
        'body': json.dumps(message, indent=2)
    }

def generate_stat_distros(percent=5):       
    if 100 / percent != int(100 / percent):
        print("Percent must equally divide 100")
        return
        
    all_stats = np.array(np.meshgrid(np.arange(10, 70+percent, percent),
                    np.arange(10, 70+percent, percent),
                    np.arange(10, 70+percent, percent),
                    np.arange(10, 70+percent, percent))).T.reshape(-1,4)
    
    stats = all_stats[np.sum(all_stats, axis=1) == 100] / 100

    return stats

def generate_inputs(max_stats=2900):
    stat_distros = generate_stat_distros()
    
    rows, _ = stat_distros.shape
    main_stat = np.ones((rows, 1))

    all_stats = np.concatenate((main_stat, stat_distros), axis=1) * max_stats

    return all_stats
    
def generate_message():
    inputs = generate_inputs()

    message = client.send_message(
            QueueUrl=envQueueUrl,
            MessageBody=(inputs)
        )
    
    return message

if __name__ == "__main__":
    generate_inputs()