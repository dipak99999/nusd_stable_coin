import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import nUSDContractABI from './nUSDContractABI.json';

const nUSDContractAddress = '0x9b9c6554be223d5555eF1e21f25146734f54eDB6';

function App() {
  const [ethInput, setEthInput] = useState('');
  const [nusdAmount, setNusdAmount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [nUSDContract, setNUSDContract] = useState(null);
  const [metmaskConnection, setmetmaskConnection] = useState(false);

  useEffect(() => {
  
    if (window.ethereum && metmaskConnection) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);
      const signer = provider.getSigner();
      setSigner(signer);
      const nUSDContract = new ethers.Contract(nUSDContractAddress, nUSDContractABI, signer);
      setNUSDContract(nUSDContract);
      setIsConnected(true);
    }
  }, [metmaskConnection]);

  async function fetchEthPrice() {
    try {
      const ethPrice = await nUSDContract.getLatestPrice();
      console.log("ethPrice",ethPrice.toString())
      return ethPrice;
    } catch (error) {
      console.error(error);
    }
  }

  async function connectMetamask() {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);
      const signer = provider.getSigner();
      setSigner(signer);
      const nUSDContract = new ethers.Contract(nUSDContractAddress, nUSDContractABI, signer);
      setNUSDContract(nUSDContract);
      setIsConnected(true);
      setmetmaskConnection(true)
    } catch (error) {
      console.error(error);
    }
  }

  async function deposit() {
    try {
      const ethInputValue = parseFloat(ethInput);
      const ethPrice = await fetchEthPrice();
      const nusdAmountValue = ethInputValue * (ethPrice / 2);  
      const tx = await nUSDContract.deposit({      
        value: ethers.utils.parseEther(ethInputValue.toString())
      });
      await tx.wait();
      setEthInput('');
      const userNusdBalance = await nUSDContract.balanceOf(signer.getAddress());
      setNusdAmount(userNusdBalance.toString());
    } catch (error) {
      console.error(error);
    }
  }

  async function redeem() {
    try {
      const nusdAmountValue = parseFloat(nusdAmount);

      const ethPrice = await fetchEthPrice();
      const requiredNusdAmount = ethPrice * 2;

      const userNusdBalance = await nUSDContract.balanceOf(signer.getAddress());   
      // if (userNusdBalance < requiredNusdAmount) {
      //   console.log('Insufficient nUSD balance');
      //   return;
      // }

      const tx = await nUSDContract.redeem(userNusdBalance);
      await tx.wait();

      setNusdAmount('');
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      <h1>nUSD Stablecoin</h1>
      {isConnected ? (
        <>
          <label htmlFor="ethInput">ETH Amount:</label>
          <input
            type="number"
            id="ethInput"
            step="0.01"
            value={ethInput}
            onChange={(e) => setEthInput(e.target.value)}
            placeholder="Enter ETH amount"
          />
          <button onClick={deposit}>Deposit</button>
          <br />
          <label htmlFor="nusdAmount">nUSD Amount:</label>
          <input
            type="text"
            id="nusdAmount"
            value={nusdAmount}
            onChange={(e) => setNusdAmount(e.target.value)}
            placeholder="Enter nUSD amount"
          />
          <button onClick={redeem}>Redeem</button>
        </>
      ) : (
        <button onClick={connectMetamask}>Connect with MetaMask</button>
      )}
    </div>
  );
}

export default App;







