import os
import boto3
import json
import numpy as np

client = boto3.client('stepfunctions')

def handler(event, context):
    inputs = generate_inputs()
    print("Event:", event)
    print("Context:", context)

    outputs = []

    for stat_distro in inputs:
        json_input = {  
            "main_stat": int(stat_distro[0]),
            "haste": int(stat_distro[1]),
            "critical_strike": int(stat_distro[2]), 
            "versatility": int(stat_distro[3]),
            "mastery": int(stat_distro[4]),
            }
        outputs.append(json_input)

    response = {"Stats": outputs}
    print("Response:", response)

    return response

def generate_stat_distros(percent=10):       
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