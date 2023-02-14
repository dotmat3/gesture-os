# ✋ Gesture and Speech Operating System 💬

Proof-of-concept of an operating system which replaces the traditional mouse and keyboard interaction with gestures and speech. The system architecture is composed by the following main modules:
- Gesture Recognition Module
- Speech Recognition Module
- User Interface

For the **gesture recognition system**, a new private dataset has been acquired, from which hand keypoints have been extracted, thanks to the [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands) library, and a new deep learning model trained to recognize the defined gestures. A total of 10 gestures were designed to be used in the system: 6 static and 4 dynamic. In particular, the static gestures are the numbers from 0 to 5 and the  dynamic gestures are hand movements in form of swipes into four directions: left, up, right and down. Moreover, several pre-processing and data augmentation techniques were used. The pipeline for the training of the model can be seen in the `Gesture Module.ipynb` notebook, available also on Colab.

<a href="https://colab.research.google.com/drive/1zJMIoXUv-KB7ILMd-cby1UkAZFbk-VgO?usp=sharing">
  <img src="https://img.shields.io/badge/Colab-Open%20Notebook-green?style=for-the-badge&logo=googlecolab&color=blue">
</a>
<br /><br />

Instead, for the **speech recognition system**, we used the Python [SpeechRecognition](https://github.com/Uberi/speech_recognition) library with the free Google API and a custom mechanism to start and stop the capture of the audio signal.

Finally, we designed our **user interface** to provide all the necessary feedback to show the user the state of the system, and display hints about how it can be operated. The user interface was then implemented using the Electron framework and the React library for JavaScript.

A more in-depth report can be found in the `Report.pdf` file.

## Screenshots

![home](https://user-images.githubusercontent.com/58000595/217607769-cee246f0-dc3f-48c5-94cf-3d5cab2f5409.png)

![command-mode-task-bar](https://user-images.githubusercontent.com/58000595/217606860-95d05ffe-6143-41f0-b788-5826f8546ebb.png)

![video](https://user-images.githubusercontent.com/58000595/217608531-15862766-e787-4a37-9542-98f75f6ab03c.png)

## Contributors

<a href="https://github.com/dotmat3" target="_blank">
  <img src="https://img.shields.io/badge/Profile-Matteo%20Orsini-green?style=for-the-badge&logo=github&labelColor=blue&color=white">
</a>
<br /><br />
<a href="https://github.com/SkyLionx" target="_blank">
  <img src="https://img.shields.io/badge/Profile-Fabrizio%20Rossi-green?style=for-the-badge&logo=github&labelColor=blue&color=white">
</a>

## Technologies

In this project, the following libraries for Python were used:
- MediaPipe Hands
- TensorFlow
- OpenCV
- SpeechRecognition

Moreover, for the front-end of the application the following frameworks were adopted:
- Electron
- React
