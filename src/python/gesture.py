import json
import time
import os
import traceback
from matplotlib import pyplot as plt
import tensorflow as tf
import cv2
import numpy as np
import mediapipe as mp

mpHands = mp.solutions.hands
mpDraw = mp.solutions.drawing_utils


def move_to_origin_landmarks(dataset_landmarks, frame_shape):
    """
    Shift each keypoint coordinates by the coordinates of the palm keypoint of the first frame
    """
    n, frames = dataset_landmarks.shape[:2]
    dataset_landmarks = dataset_landmarks.reshape(n, frames, -1, 2)
    height, width = frame_shape[:2]

    shift_to_origin = dataset_landmarks[:, 0, 0, :].reshape(n, 1, 1, 2)
    shifted_to_origin = dataset_landmarks - shift_to_origin

    return shifted_to_origin.reshape(n, frames, -1)


def normalize_size_landmarks(dataset_landmarks):
    n, frames = dataset_landmarks.shape[:2]
    dataset_landmarks = dataset_landmarks.reshape(n, frames, -1, 2)

    min_vec = np.min(dataset_landmarks[:, :, :, :], axis=(1, 2))
    max_vec = np.max(dataset_landmarks[:, :, :, :], axis=(1, 2))

    min_vec = min_vec.reshape(n, 1, 1, 2)
    max_vec = max_vec.reshape(n, 1, 1, 2)

    normalized_landmarks = dataset_landmarks.copy()
    normalized_landmarks = (dataset_landmarks - min_vec) / \
        (max_vec - min_vec + 1e-10)

    return normalized_landmarks.reshape(n, frames, -1)


def normalize_dataset(dataset_landmarks, frame_shape):
    dataset_landmarks = move_to_origin_landmarks(
        dataset_landmarks, frame_shape)
    normalized_dataset = normalize_size_landmarks(dataset_landmarks)
    return normalized_dataset


def process_landmarks(frame, model):
    return model.process(frame)


def extract_keypoints(landmarks):
    if not landmarks:
        return np.zeros(21 * 2)

    return np.array([[res.x, res.y] for res in landmarks.landmark]).flatten()


def draw_landmarks(frame, result):
    x, y, c = frame.shape
    frame_copy = frame.copy()

    if result.multi_hand_landmarks:
        for handslms in result.multi_hand_landmarks:
            mpDraw.draw_landmarks(frame_copy, handslms,
                                  mpHands.HAND_CONNECTIONS)

    return frame_copy


def draw_video_landmarks(frames, landmarks_result=None, hands=None):
    video_frames = []

    if landmarks_result is not None:
        for frame, result in zip(frames, landmarks_result):
            video_frame = draw_landmarks(frame, result)
            video_frames.append(video_frame)
    else:
        if hands is None:
            raise Exception(
                "The attribute hands must be defined when landmarks_result is None"
            )

        for frame in frames:
            result = process_landmarks(frame, hands)

            video_frame = draw_landmarks(frame, result)
            video_frames.append(video_frame)

    return video_frames


def draw_video_landmarks_normalized(landmarks):
    landmarks = landmarks.reshape(-1, 21, 2)

    width, height = 300, 300
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    results = []

    for frame_landmarks in landmarks:
        new_frame = frame.copy()

        for landmark in frame_landmarks:
            center_x, center_y = width / 2, height / 2
            scale_x, scale_y = width, height
            x = int(center_x + landmark[0] * scale_x - (scale_x / 2))
            y = int(center_y + landmark[1] * scale_y - (scale_y / 2))

            cv2.circle(new_frame, [x, y], 3, (0, 0, 220), -1)

        results.append(new_frame)

    return results


def decode_label(one_hot_vector):
    decoding = {0: "down", 1: "none", 2: "palm"}
    index = np.argmax(one_hot_vector)
    return decoding[index]


def putRotatedText(frame, text, coord, color):
    add_frame = np.zeros_like(frame)
    add_frame = cv2.putText(
        add_frame, text, coord, cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2, cv2.LINE_AA
    )

    M = cv2.getRotationMatrix2D(coord, -90, 1.0)
    add_frame = cv2.warpAffine(add_frame, M, add_frame.shape[:2][::-1])
    return add_frame + frame


def draw_prediction_bar(
    frame, predictions, labels, starting_x, starting_y, max_height=200, bar_width=50
):
    x = starting_x
    for pred, label in zip(predictions, labels):
        frame = cv2.rectangle(
            frame,
            (x, starting_y),
            (x + bar_width, int(starting_y - max_height * pred)),
            (0, 255, 0),
            -1,
        )
        frame = putRotatedText(
            frame, label, (int(x + bar_width / 2), starting_y + 5), (0, 0, 255)
        )
        x += bar_width + 2
    return frame


def write_video(frames, path):
    height, width = frames[0].shape[:2]
    out = cv2.VideoWriter(
        path, cv2.VideoWriter_fourcc("a", "v", "c", "1"), 30, (width, height)
    )
    for frame in frames:
        out.write(frame)
    out.release()


class HandGestureModel:
    def __init__(self, hands, detected_gesture_fn):
        self.hands = hands

        self.cap = cv2.VideoCapture(0)
        self.frame = None

        self.detected_gesture_fn = detected_gesture_fn

        self.left_keypoints_accumulator = []
        self.right_keypoints_accumulator = []
        self.landmarks_frames_accumulator = []

        self.window_size = 40
        self.stride = 5
        self.samples = 20

        self.last_prediction_time = 0
        self.cooldown = 1  # seconds

        self.live_mode = True
        self.status = "Live"

        self.lstm = self.load_model()
        self.label_mapping = self.load_labels()

        plt.ion()
        plt.show()

    def release(self):
        self.cap.release()
        cv2.destroyAllWindows()

    def load_model(self):
        MODEL_PATH = "model.h5"
        # Support direct running this python file and also spawning from another process
        if os.path.dirname(__file__).lower() != os.getcwd().lower():
            MODEL_PATH = os.path.join("src", "python", MODEL_PATH)

        lstm = tf.keras.models.load_model(MODEL_PATH)
        return lstm

    def load_labels(self):
        LABELS_PATH = "labels.json"
        if os.path.dirname(__file__).lower() != os.getcwd().lower():
            LABELS_PATH = os.path.join("src", "python", LABELS_PATH)
        with open(LABELS_PATH, encoding="utf8") as f:
            return json.load(f)

    def decode_label(self, one_hot_vector):
        index = np.argmax(one_hot_vector)
        return self.label_mapping[str(index)]

    def output_prediction(self, keypoint_frames, th=50):
        indexes = np.linspace(0, len(keypoint_frames) - 1,
                              self.samples, dtype=np.int32)

        keypoints = np.array(keypoint_frames)[indexes]
        keypoints = np.expand_dims(keypoints, axis=0)

        pred = self.lstm(normalize_dataset(keypoints, self.frame.shape))

        pred_data = pred.numpy()[0]
        pred_label = self.decode_label(pred_data)
        confidence = int(max(pred_data) * 100)

        # If the confidence is below the threshold set the prediction to none
        if confidence < th:
            pred_label = "none"

        return pred_label, confidence, keypoints

    def show_predictions(self, frame, left_pred_label, right_pred_label):
        pred_label = left_pred_label + " - " + right_pred_label

        # Show the prediction on the frame
        cv2.putText(
            frame,
            pred_label,
            (10, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),
            2,
            cv2.LINE_AA,
        )

    def start(self):

        left_pred_label = right_pred_label = "none"

        while True:
            # Read each frame from the webcam
            ret, frame = self.cap.read()
            self.frame = frame

            if not ret:
                break

            y, x, c = frame.shape

            # Flip the frame vertically
            frame = cv2.flip(frame, 1)

            # Get hand landmark prediction
            framergb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = self.hands.process(framergb)

            # Draw landmarks
            frame = draw_landmarks(frame, result)

            start = time.time()

            if self.status == "Recording":
                self.landmarks_frames_accumulator.append(frame.copy())

            if self.status == "Live":

                left_keypoints = np.zeros(21 * 2)
                right_keypoints = np.zeros(21 * 2)

                if result.multi_hand_landmarks:
                    zipped = zip(result.multi_handedness,
                                 result.multi_hand_landmarks)
                    for handedness, handslms in zipped:
                        hand_label = handedness.classification[0].label

                        keypoints = extract_keypoints(handslms)

                        if hand_label == "Left":
                            left_keypoints = keypoints
                        else:
                            right_keypoints = keypoints

                self.left_keypoints_accumulator.append(left_keypoints)
                self.right_keypoints_accumulator.append(right_keypoints)

                if len(self.left_keypoints_accumulator) == (
                    self.window_size + self.stride
                ):
                    new_left_window = self.left_keypoints_accumulator[self.stride:]
                    self.left_keypoints_accumulator = new_left_window
                    new_right_window = self.right_keypoints_accumulator[self.stride:]
                    self.right_keypoints_accumulator = new_right_window

                if (
                    len(self.left_keypoints_accumulator) == self.window_size
                    and time.time() - self.last_prediction_time > self.cooldown
                ):
                    left_pred_label, left_confidence, _ = self.output_prediction(
                        self.left_keypoints_accumulator)
                    right_pred_label, right_confidence, _ = self.output_prediction(
                        self.right_keypoints_accumulator)

                    if left_pred_label != "none" or right_pred_label != "none":
                        self.last_prediction_time = time.time()

                    self.detected_gesture_fn(
                        {
                            "left": {
                                "label": left_pred_label,
                                "confidence": left_confidence,
                            },
                            "right": {
                                "label": right_pred_label,
                                "confidence": right_confidence,
                            },
                        }
                    )

            elif self.status == "Recording":
                left_keypoints = np.zeros(21 * 2)
                right_keypoints = np.zeros(21 * 2)

                if result.multi_hand_landmarks:
                    zipped = zip(result.multi_handedness,
                                 result.multi_hand_landmarks)
                    for handedness, handslms in zipped:
                        hand_label = handedness.classification[0].label

                        keypoints = extract_keypoints(handslms)

                        if hand_label == "Left":
                            left_keypoints = keypoints
                        else:
                            right_keypoints = keypoints

                self.left_keypoints_accumulator.append(left_keypoints)
                self.right_keypoints_accumulator.append(right_keypoints)

            key = cv2.waitKey(1)
            if key == ord("q"):
                break
            elif key == ord("m"):
                if self.status == "Live":
                    self.status = "Waiting for input"
                else:
                    self.status = "Live"
                    self.left_keypoints_accumulator = []
                    self.right_keypoints_accumulator = []
            elif key == ord(" ") and self.status != "Live":
                if self.status == "Recording":
                    print("Recorded", len(
                        self.landmarks_frames_accumulator), "frames")

                    left_pred_label, left_confidence, _ = self.output_prediction(
                        self.left_keypoints_accumulator)
                    right_pred_label, right_confidence, _ = self.output_prediction(
                        self.right_keypoints_accumulator)

                    self.detected_gesture_fn(
                        {
                            "left": {
                                "label": left_pred_label,
                                "confidence": left_confidence,
                            },
                            "right": {
                                "label": right_pred_label,
                                "confidence": right_confidence,
                            },
                        }
                    )

                    # write_video(self.landmarks_frames_accumulator, "debug_video.mp4")

                    self.status = "Waiting for input"
                else:
                    self.status = "Recording"
                    self.left_keypoints_accumulator = []
                    self.right_keypoints_accumulator = []
                    self.frames_accumulator = []
                    self.landmarks_frames_accumulator = []

            cv2.putText(
                frame,
                self.status,
                (10, y - 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255),
                2,
                cv2.LINE_AA,
            )

            self.show_predictions(frame, left_pred_label, right_pred_label)

            # Show the final output
            cv2.imshow("Output", frame)


def start_gesture_recognition(window_size, stride, detected_gesture_fn, exception_fn):
    try:
        hands = mpHands.Hands(
            static_image_mode=True, max_num_hands=2, min_detection_confidence=0.5
        )

        model = HandGestureModel(hands, detected_gesture_fn)
        model.start()
    except Exception as e:
        print(traceback.format_exc())
        exception_fn(traceback.format_exc())
    finally:
        model.release()


if __name__ == "__main__":
    window_size = 20
    stride = 5

    def __detected_gesture_fn(data):
        print(data)

    start_gesture_recognition(
        window_size, stride, __detected_gesture_fn, print)
