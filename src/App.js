import React, {useState, useEffect} from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useForm } from 'react-hook-form';
import { DrizzleContext } from '@drizzle/react-plugin';
import './App.css';

const toastOptions = {
  position: toast.POSITION.TOP_RIGHT
};

const Dashboard = (props) => {
  const [userBalance, setUserBalance] = useState(null);
  const [isContractOwner, setContractOwner] = useState(null);
  const [transferState, setTransferState] = useState(null);
  const [transactionLoading, setTransactionLoading] = useState(false);

  const { register, formState: { errors }, handleSubmit } = useForm();
  const [addrInput, setAddrInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  
  const {drizzle, drizzleState} = props;
  const { FST } = drizzleState.contracts;

  const triggerTransferState = async () => {
    try {
      setTransactionLoading(true);
      transferState.value = !transferState.value;
      const contract = drizzle.contracts.FST;
      const res = await contract.methods.setTransferState(transferState.value).send({
        from: drizzleState.accounts[0]
      });
      const { newState } = res.events.TransferState.returnValues;
      const msg = newState ? "Transfer has been successfully enabled.": "Transfer has been successfully disabled.";
      toast.success(msg, toastOptions);
      setTransactionLoading(false);
    } catch (error) {
      toast.error(error.message, toastOptions);
      setTransactionLoading(false);
    }
  }

  const resetFields = () => {
    setAddrInput("");
    setAmountInput("");
  };

  const isEthAddr = (addr) => {
    return drizzle.web3.utils.isAddress(addr);
  }

  const isNan = (val) => {
    return !isNaN(val);
  }

  const transfer = async () => {
    try {
      setTransactionLoading(true);
      const contract = drizzle.contracts.FST;
      const res = await contract.methods.transfer(addrInput, amountInput).send({from: drizzleState.accounts[0]});
      const {_to, _value} = res.events.Transfer.returnValues;
      const msg = `successfully transfered ${_value} FST to 0x...${_to.slice(_to.length - 4, _to.length)} from your account.`
      resetFields();
      toast.success(msg, toastOptions);
      setTransactionLoading(false);
    } catch (error) {
      const jsonData = JSON.parse(error.message.match(/\{.+\}/ig)[0]);
      const { message } = jsonData.value.data;
      const { name } = jsonData.value.data.data;
      toast.error(`${name} - ${message}`, toastOptions);
      setTransactionLoading(false);
    }
  }

  useEffect(
    () => {
      const contract = drizzle.contracts.FST;
      const balanceKey = contract.methods["balanceOf"].cacheCall(drizzleState.accounts[0], {from: drizzleState.accounts[0]});
      if (FST.balanceOf[balanceKey]) {
        setUserBalance(FST.balanceOf[balanceKey])
      }
      
      const isOwnerKey = contract.methods["owner"].cacheCall();
      if (FST.owner[isOwnerKey]) {
          setContractOwner(FST.owner[isOwnerKey].value === drizzleState.accounts[0]);
      }

      const transferKey = contract.methods["getTransferState"].cacheCall();
      if (FST.getTransferState[transferKey]) {
        setTransferState(FST.getTransferState[transferKey])
      }
    }, [drizzle.contracts.FST, drizzleState.accounts, FST.balanceOf, FST.owner, FST.getTransferState]
  );


  if (transferState && !transferState.value && !isContractOwner) {
    return (
      <span>
        <div className="mb-2"><strong>current account:</strong> {drizzleState.accounts[0]}</div>
        <div className="mb-5"><strong>account balance:</strong> {userBalance && userBalance.value}</div>
        <div>Currently <strong>transfer is deactivated</strong></div>
        <div className="text-muted"><strong>Only Contract Owner can enable / disable transfer</strong></div>
      </span>
    )
  }
  return (
    <span>
      <div className="my-5"><strong>current account:</strong> {drizzleState.accounts[0]}</div>
      <div className="mb-5"><strong>account balance:</strong> {userBalance && userBalance.value}</div>
      <div>
          <form onSubmit={handleSubmit(transfer)}>
            <div className="row justify-content-center my-5">
              <input 
                type="text" 
                placeholder="Enter account address" 
                value={addrInput} 
                onInput={e => setAddrInput(e.target.value)}
                {...register("address", { required: true, validate: isEthAddr })}
              ></input>
              <div className="text-danger mb-3">
                {errors.address?.type === 'required' && "address is required"}
                {errors.address?.type === 'validate' && "address is incorect"}
              </div>
              <input 
                type="text" 
                placeholder="Enter amount to send" 
                value={amountInput} 
                onInput={e => setAmountInput(e.target.value.toLowerCase())}
                {...register("amount", { required: true, validate: isNan })}
              ></input>
              <div className="text-danger mb-3">
                {errors.amount?.type === 'required' && "Amount name is required"}
                {errors.amount?.type === 'validate' && "Amount must be a number"}
              </div>
              {
                transactionLoading ?
                  <div className="spinner-border text-primary text-center" role="status"></div> :
                  <input type="submit" className="btn btn-primary" value="Send"></input>
              }
            </div>
          </form>
        {
          (isContractOwner && transferState?.value)?
              <div className={`btn btn-danger my-5 ${transactionLoading ? "disabled": null}`} onClick={() => triggerTransferState()}>Disable transfer</div> : 
            null 
        }
        {
          (isContractOwner && !transferState?.value) ?
            <div className={`btn btn-success my-5 ${transactionLoading ? "disabled": null}`} onClick={() => triggerTransferState()}>Enable transfer</div>:null
        }
      </div>
    </span>
  )
};

const App = (props) => {
  const {drizzle} = props;

  const reloadOnAccountChanged = () => {
    window.location.reload();
  }

  useEffect(
    () => {
      window.ethereum.on('accountsChanged', reloadOnAccountChanged);

      return () => {
        window.ethereum.off('accountsChanged', reloadOnAccountChanged);
      }
    }
  )

  return (
    <div className="App">
      <ToastContainer />
      <header className="App-header">
        <DrizzleContext.Provider drizzle={drizzle}>
          <DrizzleContext.Consumer>
            {
              drizzleContext => {
                const {drizzle, drizzleState, initialized} = drizzleContext;
                if (!initialized) {
                  return "app is loading";
                }

                return <Dashboard drizzle={drizzle} drizzleState={drizzleState}/>
              }
            }
          </DrizzleContext.Consumer>
        </DrizzleContext.Provider>
      </header>
    </div>
  );
}

export default App;
