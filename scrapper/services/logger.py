import os
from datetime import datetime, timedelta
from glob import glob


async def getLogFileByDate(fromDate: str, toDate: str):
    init_date = datetime.strptime(fromDate, '%Y-%m-%d')
    end_date = datetime.strptime(toDate, '%Y-%m-%d')

    files = []

    # Iterar sobre todas las fechas en el rango
    current_date = init_date
    while current_date <= end_date:
        date = current_date.strftime('%Y-%m-%d')
        pattern = os.path.join('logs/', f'{date}.txt')
        founded = glob(pattern)
        files.extend(founded)
        current_date += timedelta(days=1)

    complete_log = ''
    # Get files content in a string
    for file in files:
        with open(file, 'r') as f:
            content = f.read()
            complete_log += content
    return complete_log
