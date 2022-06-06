import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
import traceback
import os


def process_landmarks(frame, model):
    return model.process(frame)


def extract_keypoints(landmarks):
    return np.array([[res.x, res.y, res.z] for res in landmarks.landmark]).flatten()


def decode_label(one_hot_vector):
    decoding = {0: "down", 1: "none", 2: "palm"}
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
            static_image_mode=True, max_num_hands=2, min_detection_confidence=0.5
        )
        mpDraw = mp.solutions.drawing_utils

        left_keypoints_accumulator = []
        right_keypoints_accumulator = []

        pred_label = "/"

        while True:
            # Read each frame from the webcam
            ret, frame = cap.read()

            if not ret:
                break

            x, y, c = frame.shape

            # Flip the frame vertically
            frame = cv2.flip(frame, 1)

            framergb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            # Get hand landmark prediction
            result = hands.process(framergb)

            # Post process the result
            if result.multi_hand_landmarks:
                # Draw landmarks
                for handslms in result.multi_hand_landmarks:
                    mpDraw.draw_landmarks(frame, handslms, mpHands.HAND_CONNECTIONS)

            left_keypoints = np.zeros(21 * 3)
            right_keypoints = np.zeros(21 * 3)

            if result.multi_hand_landmarks:
                for handedness, handslms in zip(
                    result.multi_handedness, result.multi_hand_landmarks
                ):
                    hand_label = handedness.classification[0].label

                    keypoints = extract_keypoints(handslms)

                    if hand_label == "Left":
                        left_keypoints = keypoints
                    else:
                        right_keypoints = keypoints

            left_keypoints_accumulator.append(left_keypoints)
            right_keypoints_accumulator.append(right_keypoints)

            if len(left_keypoints_accumulator) == (window_size + stride):
                left_keypoints_accumulator = left_keypoints_accumulator[stride:]
                right_keypoints_accumulator = right_keypoints_accumulator[stride:]

            if len(left_keypoints_accumulator) == window_size:
                left_pred = lstm(tf.expand_dims(left_keypoints_accumulator, axis=0))
                right_pred = lstm(tf.expand_dims(right_keypoints_accumulator, axis=0))

                left_pred_data = left_pred.numpy()[0]
                left_pred_label = decode_label(left_pred_data)
                left_confidence = int(max(left_pred_data) * 100)
                if left_confidence < 80:
                    left_pred_label = "none"

                right_pred_data = right_pred.numpy()[0]
                right_pred_label = decode_label(right_pred_data)
                right_confidence = int(max(right_pred_data) * 100)
                if right_confidence < 80:
                    right_pred_label = "none"

                detected_gesture_fn(
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


if __name__ == "__main__":
    window_size = 20
    stride = 5

    def __detected_gesture_fn(data):
        print(data)

    start_gesture_recognition(window_size, stride, __detected_gesture_fn, print)
