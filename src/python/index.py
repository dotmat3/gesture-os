import socketio
from threading import Thread
from gesture import start_gesture_recognition

sio = socketio.Client()


def on_gesture_prediction(data):
    sio.emit("gesture-prediction", data)


def on_gesture_exception(exception):
    sio.emit("python-exception", exception)


# Server message
# @sio.on("event-name")
# def on_message(data):
#     print("I received a message!")


@sio.event
def connect():
    print("I'm connected to the backend")

    window_size = 20
    stride = 5
    gesture_thread = Thread(
        target=start_gesture_recognition,
        args=[window_size, stride, on_gesture_prediction, on_gesture_exception],
    )
    gesture_thread.start()


@sio.event
def connect_error(data):
    print("The connection failed!", data)


@sio.event
def disconnect():
    print("I'm disconnected!")


if __name__ == "__main__":
    sio.connect("http://localhost:5000")
