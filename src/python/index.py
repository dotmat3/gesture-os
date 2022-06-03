import eventlet
import socketio
import gesture
from threading import Thread

eventlet.monkey_patch()

sio = socketio.Server()
app = socketio.WSGIApp(sio)


def on_gesture_prediction(label, confidence):
    sio.emit("gesture-prediction", {"label": label, "confidence": confidence})


def on_gesture_exception(exception):
    sio.emit("python-exception", exception)


@sio.event
def connect(sid, environ):
    print("Connect")

    window_size = 20
    stride = 5

    gesture_thread = Thread(
        target=gesture.start_gesture_recognition,
        args=[window_size, stride, on_gesture_prediction, on_gesture_exception],
    )
    gesture_thread.start()


@sio.on("get-data-python")
def msg(sid, data):
    print("message ", data)
    return "OK", "Test data from python"


@sio.event
def disconnect(sid):
    pass


if __name__ == "__main__":
    eventlet.wsgi.server(eventlet.listen(("", 5000)), app)
