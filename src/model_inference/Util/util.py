from doctest import master
import numpy as np

def DiminishSecondaryStat(stat, stat_value, point_conversion = 1, base_val = 0):
    _thresholds = {
        "Critical Strike": [0, 1050, 1400, 1750, 2100, 2800, 7000],
        "Haste": [0, 990, 1320, 1650, 1980, 2640, 6600],
        "Mastery": [0, 1050, 1400, 1750, 2100, 2800, 7000],
        "Versatility": [0, 1200, 1600, 2000, 2400, 3200, 8000],
    }
    total_points = 0
    
    thresholds = _thresholds[stat]
    points = [0, 30, 39, 47, 54, 66, 126]

    for i in range(1, len(thresholds)):
        curr_points = points[i] - points[i-1]
        if stat_value > thresholds[i]:
            total_points += curr_points

        else:
            rem_stat = stat_value - thresholds[i-1]
            rem_score = rem_stat / (thresholds[i] - thresholds[i-1])
            total_points += curr_points * rem_score
            break
        
    total_points += base_val

    percent = total_points * point_conversion

    return percent

if __name__ == "__main__":
    print(DiminishSecondaryStat("Critical Strike", 262, point_conversion = 1, base_val = 8))
    print(DiminishSecondaryStat("Haste", 954, point_conversion = 1, base_val = 0))
    print(DiminishSecondaryStat("Mastery", 1318, point_conversion = 1.1, base_val = 8))
    print(DiminishSecondaryStat("Versatility", 311, point_conversion = 1, base_val = 0))

    print(DiminishSecondaryStat("Mastery", 1993, point_conversion = 1.1, base_val = 8))