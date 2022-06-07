import socketio
from threading import Thread
from gesture import start_gesture_recognition
import speech
import speech_recognition as sr

sio = socketio.Client()


def on_speech_preview(text):
    sio.emit("speech-preview", text)


speech_to_text = speech.SpeechToText(on_preview_text=on_speech_preview)


def on_gesture_prediction(data):
    sio.emit("gesture-prediction", data)


def on_gesture_exception(exception):
    sio.emit("python-exception", exception)


@sio.on("start-speech-recognition")
def on_start_speech_recognition():
    print("Received start speech recognition")
    speech_to_text.start_recording()


@sio.on("cancel-speech-recognition")
def on_cancel_speech_recognition():
    print("Received cancel speech recognition")
    speech_to_text.stop_recording()


@sio.on("stop-speech-recognition")
def on_stop_speech_recognition():
    text = speech_to_text.stop_recording()
    print("Received stop speech recognition")
    print("Sending speech recognized", text)
    sio.emit("speech-recognized", text)


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
