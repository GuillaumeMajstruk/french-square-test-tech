import { generateStore, EventActions } from '@drizzle/store';
import FSToken from '../contracts/FST.json';

const drizzleOptions = {
  contracts: [FSToken],
  events: {
      FST: ["Transfer", "TransferState"]
  },
  web3: {
    fallback: {
      type: "ws",
      url: "ws://127.0.0.1:9545",
    },
  },
};

const contractEventNotifier = store => next => action => {
  if (action.type === EventActions.EVENT_FIRED) {
      console.log(action);
    const contract = action.name;
    const contractEvent = action.event.event;
    const message = `successfully sent ${action.event.returnValues._value} FST from ${action.event.returnValues._from} to ${action.event.returnValues._to}`;
    const display = `${contract}(${contractEvent}): ${message}`;

    // toast.success(display, { position: toast.POSITION.TOP_RIGHT });
    alert(display);
  }
  return next(action);
}

const appMiddlewares = [ contractEventNotifier ];

export default generateStore({
  drizzleOptions,
  appMiddlewares,
  disableReduxDevTools: false  // enable ReduxDevTools!
});