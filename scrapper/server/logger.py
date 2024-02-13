from datetime import datetime
import os

# Obtener el valor de la variable de entorno DEBUG (si está definida)
debug_mode = os.getenv("DEBUG", default="false").lower() == "true"


def print_log(message: str, level: str = "info", requestID: str = None, productID: str = None, data: str = None, origin: str = "scrapper") -> None:
    '''
    Log structure
    timestamp - level - message - requestID - productID
    '''
    log = f"{datetime.now()};{level.upper()};{message};{requestID};{productID};{data};{origin}\n"
    date = datetime.now().strftime("%Y-%m-%d")
    if not os.path.exists("logs"):
        os.makedirs("logs")
    with open(f"logs/{date}.txt", "a") as f:
        f.write(log)

    if debug_mode:
        print(log)
