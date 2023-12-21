  import { initializeApp } from 'firebase/app';
  import firebase from 'firebase/compat/app';
  import 'firebase/compat/firestore';
  import 'firebase/compat/auth';
  import 'firebase/compat/storage';
  import 'firebase/storage';

  const firebaseConfig = {
    apiKey: 'AIzaSyBZcQtdpE4MtAfa_k3bhYwefQ8lZbPWwRg',
    authDomain: 'date-774ca.firebaseapp.com',
    databaseURL: 'https://date-774ca-default-rtdb.firebaseio.com',
    projectId: 'date-774ca',
    storageBucket: 'date-774ca.appspot.com',
    messagingSenderId: '281122705487',
    appId: '1:281122705487:web:3262dedb261726e2949a3a',
    measurementId: 'G-N4DNLBSJ0Z',
  };

  const app = firebase.initializeApp(firebaseConfig);
  export const dbFirebase = app.firestore();
  export const auth = app.auth();
  export const firestore = firebase.firestore();
  export const storage = firebase.storage();
