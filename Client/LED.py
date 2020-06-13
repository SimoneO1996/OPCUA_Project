import RPi.GPIO as GPIO
import time
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
out_pin = 21
while True:
    GPIO.setup(out_pin, GPIO.OUT)
    print('LED on')
    GPIO.output(out_pin, GPIO.HIGH)
    time.sleep(2)
    print("LED off")
    GPIO.output(out_pin, GPIO.LOW)
    time.sleep(2)
