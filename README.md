# Big Frogs

Big Frogs is a simple mobile application for keeping track of your most important tasks of the day (your "big frogs"). Tasks are given priorities so you can tackle the most important items first. If you do not finish a task, it automatically becomes the number one priority on the next day.

The app is built with [Expo](https://expo.dev/) and React Native.

## Getting Started

1. Install dependencies (you need `node` and `npm` installed):

   ```sh
   npm install
   ```

2. Start the development server:

   ```sh
   npm start
   ```

   Use the Expo client on your device or an emulator to run the app.

## Features

- Add tasks with a custom priority.
- Tap a task to mark it as completed.
- Incomplete tasks are carried over to the next day and assigned priority 1 automatically.

All data is stored locally on the device using AsyncStorage.
