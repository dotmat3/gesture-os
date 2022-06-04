import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
import traceback
import os


def process_landmarks(frame, model):
    return model.process(frame)


def extract_keypoints(result):
    if not result.multi_hand_landmarks:
        return np.zeros(21 * 3)

    return np.array(
        [
            [res.x, res.y, res.z]
            for landmarks in result.multi_hand_landmarks
            for res in landmarks.landmark
        ]
    ).flatten()


def preprocess_landmark_results(landmark_results):
    return np.array([extract_keypoints(res) for res in landmark_results])


def draw_landmarks(frame, result):
    x, y, c = frame.shape
    frame_copy = frame.copy()

    mpDraw = mp.solutions.drawing_utils
    mpHands = mp.solutions.hands

    if result.multi_hand_landmarks:
        for handslms in result.multi_hand_landmarks:
            mpDraw.draw_landmarks(frame_copy, handslms, mpHands.HAND_CONNECTIONS)

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


def decode_label(one_hot_vector):
    decoding = {0: "swipe down", 1: "left palm", 2: "none", 3: "right palm"}
    index = np.argmax(one_hot_vector)
    return decoding[index]


def start_gesture_recognition(window_size, stride, detected_gesture_fn, exception_fn):

    model_path = "model.h5"

    # Support direct running this python file and also spawning from another process
    if os.path.dirname(__file__).lower() != os.getcwd().lower():
        model_path = os.path.join("src", "python", model_path)

    try:
        cap = cv2.VideoCapture(0)

        lstm = tf.keras.models.load_model(model_path)

        # Initialize the webcam for Hand Gesture Recognition Python project
        mpHands = mp.solutions.hands
        hands = mpHands.Hands(
            static_image_mode=True, max_num_hands=1, min_detection_confidence=0.5
        )
        mpDraw = mp.solutions.drawing_utils

        keypoints_accumulator = []

        pred_label = "/"

        while True:
            # Read each frame from the webcam
            ret, frame = cap.read()

            if not ret:
                break

            x, y, c = frame.shape

            # Flip the frame vertically
            # frame = cv2.flip(frame, 1)

            framergb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            # Get hand landmark prediction
            result = hands.process(framergb)

            # Post process the result
            if result.multi_hand_landmarks:
                for handslms in result.multi_hand_landmarks:
                    mpDraw.draw_landmarks(frame, handslms, mpHands.HAND_CONNECTIONS)

            keypoints_accumulator.append(extract_keypoints(result))

            if len(keypoints_accumulator) == (window_size + stride):
                keypoints_accumulator = keypoints_accumulator[stride:]
                cv2.putText(
                    frame,
                    "Moving window",
                    (10, 150),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 0, 255),
                    2,
                    cv2.LINE_AA,
                )

            if len(keypoints_accumulator) == window_size:
                pred = lstm(tf.expand_dims(keypoints_accumulator, axis=0))
                pred_data = pred.numpy()[0]
                pred_label = decode_label(pred_data)
                confidence = int(max(pred_data) * 100)

                # print(pred_label, confidence)
                detected_gesture_fn(pred_label, confidence)

                if max(pred_data) < 0.5:
                    pred_label = "Not confident"

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

            # Show the final output
            cv2.imshow("Output", frame)

            if cv2.waitKey(1) == ord("q"):
                break

    except Exception as e:
        print(traceback.format_exc())
        exception_fn(traceback.format_exc())
    finally:
        # Release the webcam and destroy all active windows
        cap.release()
        cv2.destroyAllWindows()
