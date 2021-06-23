import React, {useState, useEffect} from 'react';
import { useForm } from 'react-hook-form';
import './App.css';

const Dashboard = (props) => {
  const [transferState, setTransferState] = useState(null);
  const [stackId, setStackId] = useState(null);
  const [isContractOwner, setContractOwner] = useState(false);
  const [userAccount, setUserAccount] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [addrInput, setAddrInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [isLoading, setLoading] = useState(false);
  const contract = props.drizzle.contracts.FST;
  const { FST } = props.drizzleState.contracts;

  const { register, formState: { errors }, handleSubmit } = useForm();

  useEffect(() => {
    const checkContractOwner = () => {
      if (contract) {
        const dataKey = contract.methods["owner"].cacheCall();
        if (FST.owner[dataKey]) {
          const ownerAddr = FST.owner[dataKey].value;
          setContractOwner(ownerAddr === userAccount);
        }
      }
    }

    const updateUserBalance = () => {
      if (contract) {
        const dataKey = contract.methods["balanceOf"].cacheCall(userAccount, {from: userAccount});
        if (FST.balanceOf[dataKey]) {
          setUserBalance(FST.balanceOf[dataKey].value);
        }
      }
    }

    if (props.drizzleState.accounts[0]) {
      setUserAccount(props.drizzleState.accounts[0]);
      if (props.drizzleState.accountBalances[userAccount]) {
        updateUserBalance();
      }
      checkContractOwner();
    }
    const dataKey = contract.methods["getTransferState"].cacheCall();
    if (dataKey && FST.getTransferState[dataKey]) {
      setTransferState(FST.getTransferState[dataKey]);
    }
  }, [props.drizzleState.accounts, props.drizzleState.accountBalances, contract, FST.getTransferState, FST.owner, FST.balanceOf, userAccount]);

  const triggerTransferState = () => {
    transferState.value = !transferState.value;
    setTransferState(transferState);
    const newState = transferState.value;
    const resStackId = contract.methods["setTransferState"].cacheSend(newState, {
      from: userAccount
    });
    setStackId(resStackId);
  }

  const resetFields = () => {
    setAddrInput("");
    setAmountInput("");
  };

  const isEthAddr = (addr) => {
    return props.drizzle.web3.utils.isAddress(addr);
  }

  const isNan = (val) => {
    return !isNaN(val);
  }

  const transfer = async () => {
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
        setLoading(true);
        const resStackId = await contract.methods["transfer"].cacheSend(addrInput, amountInput, {from: userAccount});
        setStackId(resStackId);
      // }
    } catch (error) {
      console.log(error);
    }
  }

  if (transferState && !transferState.value && !isContractOwner) {
    return (
      <span>
        <div className="mb-2"><strong>current account:</strong> {userAccount}</div>
        <div className="mb-5"><strong>account balance:</strong> {userBalance}</div>
        <div>Currently <strong>transfer is deactivated</strong></div>
        {/* {
          isContractOwner ?
            <div>
              <div className="d-flex flex-row justify-content-center align-items-center">
                <div className="btn btn-success my-5" onClick={() => triggerTransferState()}>Enable transfer</div>
              </div>
            </div> :
        } */}
        <div className="text-muted"><strong>Only Contract Owner can enable / disable transfer</strong></div>
      </span>
    )
  }
  return (
    <span>
      <div className="my-5"><strong>current account:</strong> {userAccount}</div>
      <div className="mb-5"><strong>account balance:</strong> {userBalance}</div>
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
  const [isLoading, setLoading] = useState(true);
  const [drizzleState, setDrizzleState] = useState(null);
  const {drizzle} = props;
  

  //Horrible hack due to bug on drizzle (changing account in metamask doesn't reload the dom);
  window.ethereum.on('accountsChanged', function() {
    window.location.reload();
  })

  useEffect(() => {
    let unsubscribe = drizzle.store.subscribe(() => {
        let drizzleState = drizzle.store.getState();
        if (drizzleState.drizzleStatus.initialized) {
          setDrizzleState(drizzleState);
          setLoading(false);
        }
      });
    return function cleanup() {
      unsubscribe();
    }
  });

  return (
    <div className="App">
      <header className="App-header">
        {
          isLoading ? "App is loading ..." : <Dashboard drizzle={props.drizzle} drizzleState={drizzleState}/>
        }
      </header>
    </div>
  );
}

export default App;
