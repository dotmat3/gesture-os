import speech_recognition as sr
from threading import Thread
import io


class SpeechToText:
    def __init__(self, preview_update=2, on_preview_text=None):

        self.preview_update = preview_update
        self.on_preview_text = on_preview_text

        self.stop = False
        self.recording_thread = None
        self.recognized_text = None

        self.recognizer = sr.Recognizer()

    def _process_audio(self, audio):
        try:
            recognized_text = self.recognizer.recognize_google(audio)
            if self.on_preview_text:
                self.on_preview_text(recognized_text)
            return recognized_text
        except sr.UnknownValueError:
            print("Google could not understand audio")
            return ""
        except sr.RequestError as e:
            raise Exception(
                "Could not request results from Google service; {0}".format(e)
            )

    def _record(self):
        with sr.Microphone() as source:
            frames = io.BytesIO()
            preview_elapsed_time = 0
            seconds_per_buffer = float(source.CHUNK) / source.SAMPLE_RATE

            while not self.stop:
                buffer = source.stream.read(source.CHUNK)
                if len(buffer) == 0:
                    raise Exception("Everything broke!")

                frames.write(buffer)

                preview_elapsed_time += seconds_per_buffer
                if self.on_preview_text and preview_elapsed_time > self.preview_update:
                    preview_audio_data = sr.AudioData(
                        frames.getvalue(), source.SAMPLE_RATE, source.SAMPLE_WIDTH
                    )

                    preview_thread = Thread(
                        target=self._process_audio, args=[preview_audio_data]
                    )
                    preview_thread.start()

                    preview_elapsed_time = 0

            buffer = source.stream.read(source.CHUNK)
            frames.write(buffer)

            frame_data = frames.getvalue()
            frames.close()

            audio_data = sr.AudioData(
                frame_data, source.SAMPLE_RATE, source.SAMPLE_WIDTH
            )

            self.recognized_text = self._process_audio(audio_data)

    def start_recording(self):
        self.recording_thread = Thread(target=self._record)
        self.recording_thread.start()

    def stop_recording(self):
        assert (
            self.recording_thread is not None
        ), "You first need to start the recording"

        self.stop = True
        self.recording_thread.join()
        self.stop = False

        return self.recognized_text


if __name__ == "__main__":
    import speech
    speech_to_text = speech.SpeechToText(on_preview_text=print)

    while True:
        input("Press any key to start recording...")
        speech_to_text.start_recording()

        input("Press any key to stop recording...")
        text = speech_to_text.stop_recording()

        print("Recognized text:", text)
