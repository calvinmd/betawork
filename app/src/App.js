import React, { useState, useEffect } from 'react';
import Fortmatic from 'fortmatic';
import Web3 from 'web3';
import { Button, Form, FormGroup, Input } from 'reactstrap';
import { cloneDeep, get, head, set } from 'lodash';

import logo from './logo.svg';
import './App.css';

const { REACT_APP_FORTMATIC_KEY } = process.env;
const RPC_METHOD = 'eth_signTypedData';

// Constructor
const fm = new Fortmatic(REACT_APP_FORTMATIC_KEY);
window.web3 = new Web3(fm.getProvider());
const { web3 } = window;

const AUTH_MESSAGE = 'Please sign this message to create or verify your signature for authentication.';

const App = () => {
  const initialInputs = {
    tweet: ""
  };
  const [ wallet, setWallet ] = useState(null);
  const [ inputs, setInputs ] = useState(cloneDeep(initialInputs));
  const [ message, setMessage ] = useState('');
  const [ loader, setLoader ] = useState(null);
  const [ userObj, setUserObj ] = useState(cloneDeep({}));
  const [ signatures, setSignatures ] = useState(cloneDeep({}));
  console.log('zzz DEBUG wallet: ', wallet);
  console.log('zzz DEBUG tweet: ', inputs.tweet);
  console.log('zzz DEBUG message: ', message);
  console.log('zzz DEBUG userObj: ', userObj);
  console.log('zzz DEBUG signatures: ', signatures);

  useEffect(
    () => {
      const checkLoginStatus = async () => {
        setLoader("Loading....");
        const isUserLoggedIn = await fm.user.isLoggedIn();
        if (isUserLoggedIn) {
          web3.eth.getAccounts()
            .then((accounts) => {
              const account = head(accounts);
              setWallet(account);
            });
          const user = await fm.user.getUser();
          setUserObj(cloneDeep(user));
        }
        setLoader(null);
      }
      checkLoginStatus();
    },
    []
  );

  const handleLogin = () => {
    fm.user.login().then(async (accounts) => {
      setWallet(head(accounts));
      const user = await fm.user.getUser();
      setUserObj(cloneDeep(user));
    });
  };

  const handleLogout = () => {
    fm.user.logout().then((result => {
      console.log('zzz logged out! ', result);
    }));
    setWallet(null);
    setUserObj(cloneDeep({}));
    setMessage('');
  };

  const handleInputs = (e) => {
    const { name, value } = get(e, "target", {});
    const newInputs = cloneDeep(inputs);
    set(newInputs, name, value);
    setInputs({
      ...inputs,
      ...newInputs
    });
  };

  const TYPE_DATA = [
    [
      { "type": "string",
        "name": "email",
        "value": get(userObj, 'email')
      },
      {
        "type": "string",
        "name": "userId",
        "value": get(userObj, 'userId')
      },
      {
        "type": "string",
        "name": "authorization message",
        "value": AUTH_MESSAGE
      }
    ],
    wallet
  ];

  const handleSignTypedData = () => {
    const method = RPC_METHOD;
    web3.currentProvider.sendAsync({
      id: 4,
      method,
      params: TYPE_DATA,
      from: wallet,
    }, (err, result) => {
      if (err) return console.error(err);
      if (result.error) return console.error(result.error);
      const signature = get(result, 'result', '');
      const userId = get(userObj, 'userId');
      const updatedSignatures = cloneDeep(signatures);
      set(updatedSignatures, userId, signature);
      setSignatures(updatedSignatures);
    });
  }

  const veryifyAndSend = () => {
    const method = RPC_METHOD;
    web3.currentProvider.sendAsync({
      id: 4,
      method,
      params: TYPE_DATA,
      from: wallet,
    }, (err, result) => {
      if (err) return console.error(err);
      if (result.error) return console.error(result.error);
      const signature = get(result, 'result', '');
      const userId = get(userObj, 'userId');
      const isValid = signature === get(signatures, userId);
      // veryify signature before sending tweet
      let newMessage = "";
      if (isValid) {
        newMessage = (
          <div
            style={{ margin: "40px", color: "#aaaaaa", fontSize: "18px", cursor: "pointer" }}
          >
            Verified! Sending tweet...
            <br />
            <br />
            <b>{inputs.tweet}</b>
          </div>
        );
      } else {
        newMessage = (
          <div
            style={{ margin: "40px", color: "#aaaaaa", fontSize: "18px", cursor: "pointer" }}
          >
            Signature verification failed!
          </div>
        );
      }
      setMessage(newMessage);
    });
  }

  const Login = (
    <Button
      onClick={handleLogin}
      style={{ width: "200px", height: "50px", fontSize: "20px", cursor: "pointer" }}
    >
      Login / Signup
    </Button>
  );

  const CreateSignature = (
    <>
      <Button
        onClick={handleSignTypedData}
        style={{ width: "200px", height: "50px", fontSize: "20px", cursor: "pointer" }}
      >
        Verify Signature
      </Button>
    </>
  );

  const SendTweet = (
    <>
      <Form>
        <FormGroup>
          <Input
            type="textarea"
            name="tweet"
            id="tweet"
            minLength={1}
            maxLength={140}
            value={inputs.tweet}
            placeholder="Maximum 140 characters"
            size="80"
            onChange={handleInputs}
            style={{ fontSize: "16px", width: "400px", margin: "50px" }}
          />
        </FormGroup>
        <Button
          onClick={veryifyAndSend}
          style={{ width: "200px", height: "50px", fontSize: "20px", cursor: "pointer" }}
        >
          Verify and Send
        </Button>
        { message }
      </Form>
    </>
  );

  let Content = Login;
  if (wallet) {
    const userId = get(userObj, 'userId');
    const signature = get(signatures, userId);
    if (signature) {
      console.log('zzz SendTweet!!!!!!!!');
      Content = SendTweet;
    } else {
      Content = CreateSignature;
    }
  }

  const Loader = (
    <div style={{ color: "#aaaaaa", fontSize: "14px" }}>
      { loader }
    </div>
  );

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" width="200px"/>
        { loader ? Loader : Content }
        { wallet && (
          <div
            style={{ margin: "40px", color: "#aaaaaa", fontSize: "14px", cursor: "pointer" }}
            onClick={handleLogout}
          >
            Logout
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
