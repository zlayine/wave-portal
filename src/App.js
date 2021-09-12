import React from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";
import { CSSTransition } from "react-transition-group";
import nyan_cat from "./assets/nyan-cat.gif";
import award from "./assets/award.gif";

export default function App() {
  const [currAccount, setCurrAccount] = React.useState("");
  const [currWaves, setCurrWaves] = React.useState(0);
  const [currStatus, setCurrStatus] = React.useState(0);
  const [message, setMessage] = React.useState("");
  const [enableMessage, setEnableMessage] = React.useState(false);
  const [winner, setWinner] = React.useState(false);

  const [waves, setWaves] = React.useState([]);

  const contractAddress = "0xc50db631baa6eCAb3A210ae524f85bCedCe486D7";
  const contractABI = abi.abi;

  const checkIfWalletConnected = () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure metamask is installed");
      return;
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
    if (currStatus !== 0) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const wavePortalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );
    let content = "Hello 👋";
    if (message.length) content = message;
    let waveTxn = await wavePortalContract.wave(content, { gasLimit: 300000 });
    setCurrStatus(1);
    await waveTxn.wait();

    setCurrStatus(2);
    setTimeout(() => {
      setCurrStatus(0);
    }, 5000);
		
		setMessage("");
    if (enableMessage) setEnableMessage(false);
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
  };

  const getAllWaves = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const wavePortalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    let wavesData = await wavePortalContract.getAllWaves();
    let wavesList = [];
    wavesData.forEach((wave) => {
      wavesList.unshift({
        address: wave.waver,
        timestamp: new Date(wave.timestamp * 1000),
        message: wave.message,
      });
    });
    setWaves(wavesList);
    wavePortalContract.on(
      "NewWave",
      async (from, timestamp, message, event) => {
        setWaves((arr) => [
          {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message,
          },
          ...arr,
        ]);
        let count = await wavePortalContract.getTotalWaves();
        setCurrWaves(count.toNumber());
      }
    );
    const address = await signer.getAddress();
    wavePortalContract.on("Winner", (waver) => {
      if (waver === address) {
        setWinner(true);
        setTimeout(() => {
          setWinner(false);
        }, 15000);
      }
    });
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  let dateToFormat = (date) => {
    var d = new Date(date),
      month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear(),
      hours = d.getHours() >= 10 ? d.getHours() : `0${d.getHours()}`,
      minutes = d.getMinutes() >= 10 ? d.getMinutes() : `0${d.getMinutes()}`;

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    const str = `${year}-${month}-${day} ${hours}:${minutes}`;
    return str;
  };

  React.useEffect(() => {
    checkIfWalletConnected();
    if (!waves.length) {
      getAllWaves();
      totalWaves();
    }
  }, []);

  const connectStatus = currAccount ? (
    <div className="bg-green-500 bg-opacity-30 px-5 py-2 rounded-md text-sm text-green-500">
      Connected
    </div>
  ) : (
    ""
  );

  const totalWavesRender = (
    <div className="text-xl text-white">👋 {currWaves}</div>
  );

  const connectWalletButton = !currAccount ? (
    <button
      className="px-10 py-3 text-xl rounded-md bg-white font-semibold cursor-pointer"
      onClick={connectWallet}
    >
      Connect Metamask Wallet
    </button>
  ) : (
    ""
  );

  const waveButton = currAccount ? (
    <div className="flex flex-col justify-center space-y-5 w-full ">
      <div className="flex space-x-5 justify-center">
        <CSSTransition
          in={!enableMessage && currStatus === 0}
          timeout={300}
          classNames="fade"
          unmountOnExit
        >
          <button
            className="px-10 py-3 text-xl rounded-md bg-white font-semibold cursor-pointer shadow-xl transition-all hover:shadow-none"
            disabled={currStatus !== 0}
            onClick={wave}
          >
            👋 Wave at me
          </button>
        </CSSTransition>
        <CSSTransition
          in={currStatus === 0}
          timeout={300}
          classNames="fade"
          unmountOnExit
        >
          <button
            className="px-10 py-3 text-xl rounded-md bg-white font-semibold cursor-pointer shadow-xl transition-all hover:shadow-none"
            onClick={
              enableMessage ? () => wave() : () => setEnableMessage(true)
            }
          >
            {enableMessage ? "Submit" : "Send a Message"}
          </button>
        </CSSTransition>
      </div>
      <CSSTransition
        in={enableMessage && currStatus === 0}
        timeout={300}
        classNames="open"
        unmountOnExit
      >
        <textarea
          className="rounded-md focus:outline-none p-3 w-2/4 mx-auto"
          rows="3"
          onChange={handleChange}
          placeholder="Enter your message here"
        ></textarea>
      </CSSTransition>
    </div>
  ) : (
    ""
  );

  const mining = (
    <div className="flex flex-col space-y-5">
      <CSSTransition
        in={currStatus !== 0}
        timeout={300}
        classNames="fade"
        unmountOnExit
      >
        <button className="px-10 py-3 text-xl rounded-md bg-white font-semibold cursor-pointer shadow-xl transition-all hover:shadow-none">
          {currStatus === 1 ? "Mining" : <span>{!winner ? "Mined" : "You won"} &#9989;</span>}
        </button>
      </CSSTransition>
      <CSSTransition
        in={currStatus !== 0}
        timeout={300}
        classNames="open"
        unmountOnExit
      >
        {winner ? <img className="w-40" src={award} alt="" /> : <img className="w-40" src={nyan_cat} alt="" />}
      </CSSTransition>
    </div>
  );

  const wavers = (
    <div className="flex flex-col items-center space-y-4 w-3/4 mx-auto relative">
      {waves.map((wave, index) => {
        return (
          <div
            className="flex text-white text-lg border-l-4 border-white px-3 w-full space-x-5"
            key={index}
          >
            <a
              href={"https://rinkeby.etherscan.io/address/" + wave.address}
              target="_blank"
              rel="noreferrer"
              className="my-auto truncate"
            >
              {wave.address}
            </a>
            <div className="flex-1">{wave.message}</div>
            <div className="my-auto">{dateToFormat(wave.timestamp)}</div>
          </div>
        );
      })}
    </div>
  );

  const { width, height } = useWindowSize();

  return (
    <div className="w-full h-full min-h-screen bg-gray-600 pb-32">
      <Confetti
        width={width}
        height={height}
        tweenDuration={1000}
        recycle={false}
        run={winner}
        numberOfPieces={400}
      />
      <div className="container mx-auto flex items-center flex-col space-y-10">
        <div className="space-y-3 flex flex-col items-center w-">
          <h1 className="text-center text-white text-5xl font-bold mt-16">
            Wave Portal
          </h1>
          <p className="text-white text-lg">Made by Zerky </p>
          <p className="text-white mt-0">
            feel free to follow me on{" "}
            <a
              href="https://github.com/zlayine"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              @github/zlayine
            </a>
          </p>
          {connectStatus}
        </div>
        <div className="flex flex-col items-center space-y-5 w-2/4 relative">
          {totalWavesRender}
          {connectWalletButton}
          {waveButton}
          {mining}
        </div>
        {wavers}
      </div>
    </div>
  );
}
