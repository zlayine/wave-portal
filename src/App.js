import React from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

export default function App() {
  const [currAccount, setCurrAccount] = React.useState("");
  const [currWaves, setCurrWaves] = React.useState(0);
	const [currStatus, setCurrStatus] = React.useState(0);

  const contractAddress = "0x67e0C1708FfE5B6004C92698f94Fe3f667c5227f";
  const contractABI = abi.abi;

  const checkIfWalletConnected = () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure metamask is installed");
      return;
    } else {
      console.log("We have the ethereum object");
    }

    ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts.length !== 0) {
        const account = accounts[0];
        setCurrAccount(account);
      } else {
        console.log("No account authorized found");
      }
    });
  };

  const connectWallet = () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("get metamask");
    }

    ethereum
      .request({ method: "eth_requestAccounts" })
      .then((accounts) => {
        console.log("Connected", accounts[0]);
        setCurrAccount(accounts[0]);
      })
      .catch((err) => console.log(err));
  };

  const wave = async () => {
		if (currStatus !== 0)
			return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const wavePortalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    let waveTxn = await wavePortalContract.wave();
    console.log("Mining");
		setCurrStatus(1)
    await waveTxn.wait();
		setCurrStatus(2)
		setTimeout(() => {
			setCurrStatus(0);
		}, 2000)
    console.log("Mined");

    let count = await wavePortalContract.getTotalWaves();
		setCurrWaves(count.toNumber());
  };

	const totalWaves = async () => {
		const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const wavePortalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

		let count = await wavePortalContract.getTotalWaves();
		setCurrWaves(count.toNumber());
	}

  React.useEffect(() => {
    checkIfWalletConnected();
		if (currAccount)
			totalWaves();
  });

  return (
    <div className="w-full h-full min-h-screen bg-gray-600">
      <div className="container mx-auto flex items-center flex-col space-y-10">
        <div className="space-y-5 flex flex-col items-center">
          <h1 className="text-center text-white text-4xl font-bold mt-20">
            Wave Portal
          </h1>
          {currAccount ? (
            <div className="bg-green-500 bg-opacity-30 px-5 py-2 rounded-md text-sm text-green-500">
              Connected
            </div>
          ) : (
            ""
          )}
        </div>

        <div className="flex flex-col items-center space-y-5">
					<div className="text-xl text-white">
					👋 {currWaves}
					</div>
          {!currAccount ? (
            <button
              className="px-10 py-3 text-xl rounded-md bg-white font-semibold cursor-pointer"
              onClick={connectWallet}
            >
              Connect Metamask Wallet
            </button>
          ) : (
            <button
              className="px-10 py-3 text-xl rounded-md bg-white font-semibold cursor-pointer shadow-xl transition-all hover:shadow-none"
							disabled={currStatus !== 0}
              onClick={wave}
            >
              👋 Wave at me
            </button>
          )}
					{currStatus === 1 ? (<div className="text-white text-xl font-semibold transition-all">Mining</div>) : ""}
					{currStatus === 2 ? (<div className="text-white text-xl font-semibold transition-all">Mined</div>) : ""}
        </div>
      </div>
    </div>
  );
}
