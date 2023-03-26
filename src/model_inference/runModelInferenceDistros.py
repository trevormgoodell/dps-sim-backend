import os
import boto3
import json
import numpy as np

from agent import DQNAgent
from Druid.Balance.BalanceEnv import BalanceDruidEnvironment

try:
    bucketName = os.environ['BUCKET_NAME']
except:
    bucketName = 'dps-sim-models'

s3 = boto3.client('s3')

def handler(event, context):
    print("Event:", event)
    print("Context:", context)

    response = s3.get_object(Bucket=bucketName, Key='model.json')
    content = response['Body']

    model = json.loads(content.read())

    env = BalanceDruidEnvironment(haste=event["haste"],
                                  critical_strike=event["critical_strike"], 
                                  versatility=event["versatility"],
                                  mastery=event["mastery"],
                                  main_stat=event["main_stat"]) 
    

    
    state_size = len(env.get_state())
    action_size = len(env.get_actions())

    agent = DQNAgent(state_size, action_size, model)

    results, total_damage = agent.inference(env)

    return {
        "status": 200,
        "body": {
                 "Results": results,
                 "Total Damage": total_damage,
                 "Stats": event
                }
    }