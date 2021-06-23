import React, {useState, useEffect} from 'react';
import { useForm } from 'react-hook-form';
import { DrizzleContext } from '@drizzle/react-plugin';
import './App.css';

const Dashboard = (props) => {
  const [userBalance, setUserBalance] = useState(null);
  const [isContractOwner, setContractOwner] = useState(null);
  const [transferState, setTransferState] = useState(null);

  const [addrInput, setAddrInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  
  const {drizzle, drizzleState} = props;
  const { FST } = drizzleState.contracts;

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
  const { register, formState: { errors }, handleSubmit } = useForm();

  const triggerTransferState = () => {
    transferState.value = !transferState.value;
    const contract = drizzle.contracts.FST;
    contract.methods["setTransferState"].cacheSend(transferState.value, {
      from: drizzleState.accounts[0]
    });
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

  // const isContractOwner = () => {
  //   if (contractOwner) {
  //     console.log(contractOwner, drizzleState.accounts[0]);
  //     return contractOwner.value === drizzleState.accounts[0]
  //   }
  //   return false;
  // }

  const transfer = () => {
    try {
      // if (!addrInput.length || !amountInput) {
      //   alert("Error, you need to fill address and amout !");
      //   resetFields();
      // }
      // else if (!props.drizzle.web3.utils.isAddress(addrInput)) {
      //   alert("The address you fill is not an ethereum address !");
      //   resetFields();
      // }
      // else {
        // setLoading(true);
        const contract = drizzle.contracts.FST;
        contract.methods["transfer"].cacheSend(addrInput, amountInput, {from: drizzleState.accounts[0]});
        // setStackId(resStackId);
        resetFields();
      // }
    } catch (error) {
      console.log(error);
    }
  }

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
            <div className="row my-5">
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
              <input type="submit" className="btn btn-primary"></input>
            </div>
          </form>
        {
          (isContractOwner && transferState?.value)?
              <div className="btn btn-danger my-5" onClick={() => triggerTransferState()}>Disable transfer</div> : 
            null 
        }
        {
          (isContractOwner && !transferState?.value) ?
            <div className="btn btn-success my-5" onClick={() => triggerTransferState()}>Enable transfer</div>:null
        }
      </div>
    </span>
  )
};

const App = (props) => {
  const {drizzle} = props;

  const reloadToUpdateAccount = () => {
    window.location.reload();
  }

  window.ethereum.on('accountsChanged', reloadToUpdateAccount);

  useEffect(
    () => {
      const unsub = () => {
        console.log('unsub');
        window.ethereum.off('accountsChanged', reloadToUpdateAccount);
      };

      return () => {
        unsub();
      }
    }
  )

  return (
    <div className="App">
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
