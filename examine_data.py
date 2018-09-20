from datetime import datetime as dt
import colorlover as cl
import json
from collections import defaultdict
import csv

meal_dict = defaultdict(int)
days_dict = {}

meal_index = []
result_dict = {
    "nodes" : [],
    "links" : []
}


def extract_glucose_range(value):
    if value < 54: return 'very_low'
    elif value < 70: return 'low'
    elif value < 180: return 'normal'
    elif value < 250: return 'high'
    else: return 'very_high'


def get_color(value):
    if value < 54: return cl.scales['10']['div']['RdYlBu'][8]
    elif value < 70: return cl.scales['10']['div']['RdYlBu'][6]
    elif value < 180: return cl.scales['10']['div']['RdYlBu'][4]
    elif value < 250: return cl.scales['10']['div']['RdYlBu'][3]
    else: return cl.scales['10']['div']['RdYlBu'][2]



def is_same_day(date1, date2):
    if date1.day == date2.day and date1.month == date2.month and date1.year == date2.year: return True
    else: return False


def examine_day(day):

    breakfast_eaten = False
    lunch_eaten = False
    dinner_eaten = False

    for i in range(len(day)-1):
        meal = day[i]
        next_meal = day[i+1]

        meal['Glucose'] = float(meal['Glucose'])
        next_meal['Glucose'] = float(next_meal['Glucose'])

        if meal['Meal'] == 'Breakfast': breakfast_eaten = True
        if meal['Meal'] == 'Lunch': lunch_eaten = True
        if meal['Meal'] == 'Dinner': dinner_eaten = True

        if meal['Meal'] == 'Afternoon Snack' or meal['Meal'] == 'Bedtime Snack' or meal['Meal'] == 'Exercise Snack' or meal['Meal'] == 'Sugar to treat':
            meal['Meal'] = 'Snack'

        if meal['Meal'] == 'Snack':
            if not breakfast_eaten: meal['Meal'] = 'Early_Snack'
            elif not lunch_eaten: meal['Meal'] = 'AM_Snack'
            elif not dinner_eaten: meal['Meal'] = 'PM_Snack'
            else: meal['Meal'] = 'Bedtime_Snack'

        if next_meal['Meal'] == 'Afternoon Snack' or next_meal['Meal'] == 'Bedtime Snack' or next_meal['Meal'] == 'Exercise snack' or next_meal['Meal'] == 'Sugar to treat':
            next_meal['Meal'] = 'Snack'

        if next_meal['Meal'] == 'Snack':
            if not breakfast_eaten: next_meal['Meal'] = 'Early_Snack'
            elif not lunch_eaten: next_meal['Meal'] = 'AM_Snack'
            elif not dinner_eaten: next_meal['Meal'] = 'PM_Snack'
            else: next_meal['Meal'] = 'Bedtime_Snack'

        meal_full_name = meal['Meal'] + "_" + extract_glucose_range(meal['Glucose'])
        next_meal_full_name = next_meal['Meal'] + "_" + extract_glucose_range(next_meal['Glucose'])

        if meal_full_name not in meal_index:
            meal_index.append(meal_full_name)
            result_dict['nodes'].append({
                "name": meal_full_name,
                "color": get_color(meal['Glucose']),
                "level" : extract_glucose_range(meal['Glucose']),
                "type" : meal['Meal']
            })

        if next_meal_full_name not in meal_index:
            meal_index.append(next_meal_full_name)
            result_dict['nodes'].append({
                "name":next_meal_full_name,
                "color": get_color(next_meal['Glucose']),
                "level" : extract_glucose_range(next_meal['Glucose']),
                "type" : next_meal['Meal']
            })


        if meal['Meal'] != 'Sugar to treat' and meal['Meal'] == next_meal['Meal']: continue

        for link in result_dict["links"]:
            if link["source"] == meal_index.index(meal_full_name):
                if link["target"] == meal_index.index(next_meal_full_name):
                    link["value"] += 1
                    return
        result_dict["links"].append({
            "source" : meal_index.index(meal_full_name),
            "target" : meal_index.index(next_meal_full_name),
            "value" : 1
        })


def export_to_json():
    result_file = open('result.json', 'w+')
    json.dump(result_dict, result_file, indent=4)


def read_events():
    date = None
    useful_rows_count = 0

    for row in csv.DictReader(open('data/event.csv', 'r'), delimiter = ','):
        if len(row['Meal']) < 1: continue # pay attention to this! what are the missing rows, are they just logs?
        if 'Other' in row['Meal'] or 'Nothing' in row['Meal'] : continue
        if len(row['Glucose']) < 1: continue # this too!! what is this?

        if row['Meal'] == 'Lunch' and dt.strptime(row['time'], '%Y-%m-%d %H:%M:%S').hour == 23: continue

        # if row['Meal'] == 'Afternoon snack' or row['Meal'] == 'Bedtime snack' or row['Meal'] == 'Exercise snack' or row['Meal'] == 'Snack' or 'Sugar to treat' in row['Meal']:
            # continue
            # if dt.strptime(row['time'], '%Y-%m-%d %H:%M:%S').hour < 12:
                # row['Meal'] = 'AM_Snack'
            # else: row['Meal'] = 'PM_Snack'

            # row['Meal'] = row['Meal'] + '_' + str(dt.strptime(row['time'], '%Y-%m-%d %H:%M:%S').hour)

        if date == None or not is_same_day(dt.strptime(row['time'], '%Y-%m-%d %H:%M:%S'), date):
            date = dt.strptime(row['time'], '%Y-%m-%d %H:%M:%S')
            days_dict[date] = []
            days_dict[date].append(row)
        else:
            days_dict[date].append(row)

        useful_rows_count += 1
        if useful_rows_count % 1000 == 0: break


    for day in days_dict:
        examine_day(days_dict[day])

    print('found ' + str(useful_rows_count) + ' rows with useful data')


read_events()
export_to_json()
