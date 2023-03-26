import os
import boto3
import json
import numpy as np

def handler(event, context):
    print("Event:", event)
    print("Context:", context)

    best_event = max(event, key=lambda report: report["Payload"]["body"]["Total Damage"])

    return {
        "status": 200,
        "body": {"Stats": best_event["Payload"]["body"]["Stats"], "Damage": best_event["Payload"]["body"]["Total Damage"]}
    }