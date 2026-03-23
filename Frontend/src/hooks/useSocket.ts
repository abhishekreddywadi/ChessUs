import { useEffect, useRef, useState } from "react";

export const useSocket = () => {
  // initialiize the socket
  const socket = useRef<WebSocket | null>(null)
  const [status, setStatus] = useState<string>("connecting"); 
    // const [messages, setMessages] = useState([]);

  // "connecting" | "connected" | "error" | "disconnected"
  useEffect(()=>{
      const ws = new WebSocket("ws://localhost:8080");
        socket.current = ws;

     ws.onopen = () => {
      console.log("Connected");
      setStatus("connected");
    };
    ws.onmessage = (event) => {
        console.log(JSON.stringify(event));
    };
       ws.onerror = (err) => {
      console.error("Error:", err);
      setStatus("error");
    };

    ws.onclose = () => {
      console.log("Disconnected");
      setStatus("disconnected");
    };

    return () => {
      ws.close();
    };


  },[])
  const sendMessage = (msg:string) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(msg);
    } else {
      console.log("Socket not ready");
    }
  };
  return { status, sendMessage ,socket};

};
