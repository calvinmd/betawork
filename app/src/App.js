import React, { useState, useEffect } from 'react';
import Fortmatic from 'fortmatic';
import Web3 from 'web3';
import { Button, Form, FormGroup, Input } from 'reactstrap';
import { cloneDeep, get, head, set } from 'lodash';

import logo from './logo.svg';
import './App.css';

const { REACT_APP_FORTMATIC_KEY } = process.env;

// Constructor
const fm = new Fortmatic(REACT_APP_FORTMATIC_KEY);
window.web3 = new Web3(fm.getProvider());
const { web3 } = window;

const App = () => {
  const initialInputs = {
    tweet: ""
  };
  const [ wallet, setWallet ] = useState(null);
  const [ inputs, setInputs ] = useState(cloneDeep(initialInputs));
  const [ message, setMessage ] = useState('');
  const [ loader, setLoader ] = useState(null);
  const [ userObj, setUserObj ] = useState(cloneDeep({}));
  const [ signatures, setSignatures ] = useState(cloneDeep([]));
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
      console.log('zzz user: ', user);
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

  const handleSignTypedData = () => {
    const from = wallet;
    const params = [
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
          "name": "tweet",
          "value": get(inputs, 'tweet')
        }
      ],
      from
    ];
    const method = 'eth_signTypedData';
    web3.currentProvider.sendAsync({
      id: 4,
      method,
      params,
      from,
    }, (err, result) => {
      if (err) return console.error(err);
      if (result.error) return console.error(result.error);
      console.log('zzz result: ', result);
      const encryptedMessage = get(result, 'result', '');
      setMessage(encryptedMessage);
      const updatedSignatures = cloneDeep(signatures);
      updatedSignatures.push(encryptedMessage);
      setSignatures(updatedSignatures);
      setInputs({
        ...inputs,
        ...{ tweet: "" }
      });
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

  const SignMessage = (
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
            size={80}
            onChange={handleInputs}
            style={{ fontSize: "16px", width: "400px", margin: "50px" }}
          />
        </FormGroup>
        <Button
          onClick={handleSignTypedData}
          style={{ width: "200px", height: "50px", fontSize: "20px", cursor: "pointer" }}
        >
          Sign Data
        </Button>
        <div
          style={{ margin: "40px", color: "#aaaaaa", fontSize: "14px", cursor: "pointer" }}
          onClick={handleLogout}
        >
          Logout
        </div>
        {
          message && (
            <>
              <hr width="100%" size="1" />
              <div style={{ fontSize: "16px", marginTop: "40px" }}>Encrypted tweet:</div>
              <div style={{ fontSize: "12px", marginBottom: "20px", marginTop: "20px" }}>
                { message }
              </div>
            </>
          )
        }
      </Form>
    </>
  );

  const Content = wallet ? SignMessage : Login;
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
      </header>
    </div>
  );
}

export default App;
