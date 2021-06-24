import 'bootstrap/dist/css/bootstrap.css';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// import drizzle functions and contract artifact
import { Drizzle } from "@drizzle/store";
import FSToken from "./contracts/FST.json";
// import store from './middleware';

//polls account -> memory leak, fixed using subscribe to accountsChanged event in App functionnal component.
const options = {
  contracts: [FSToken],
  events: {
    FST: ["Transfer", "TransferState"]
  },
  // polls: {
  //   accounts: 3000
  // },
  web3: {
    fallback: {
      type: "ws",
      url: "ws://127.0.0.1:9545",
    },
  },
};

// setup drizzle
const drizzle = new Drizzle(options);

ReactDOM.render(
  <React.StrictMode>
      <App drizzle={drizzle}/>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
