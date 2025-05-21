import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("https://gym-script.onrender.com");

const WhatsAppLogin: React.FC = () => {
  const [qr, setQr] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("https://gym-script.onrender.com/status");
        const data = await res.json();
        setLoggedIn(data.loggedIn);
        setLoading(false);
        if (!data.loggedIn) {
          setAlert("WhatsApp is not active. Please scan QR code to login.");
        }
      } catch (error) {
        setLoading(false);
        setAlert("Failed to connect to server. Please try again.");
      }
    };

    checkStatus();

    socket.on("qr", (qrData: string) => {
      setQr(qrData);
      setLoggedIn(false);
      setLoading(false);
      setAlert("Please scan the QR code to login.");
    });

    socket.on("ready", () => {
      setLoggedIn(true);
      setQr(null);
      setLoading(false);
      setAlert("WhatsApp successfully connected!");
      setTimeout(() => setAlert(null), 3000);
    });

    socket.on("disconnected", () => {
      setLoggedIn(false);
      setQr(null);
      setLoading(false);
      setAlert("WhatsApp disconnected. Please scan QR code to reconnect.");
    });

    socket.on("auth_failure", (msg: string) => {
      setLoggedIn(false);
      setQr(null);
      setLoading(false);
      setAlert(
        `Authentication failed: ${msg}. Please scan QR code to reconnect.`
      );
    });

    return () => {
      socket.off("qr");
      socket.off("ready");
      socket.off("disconnected");
      socket.off("auth_failure");
    };
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      {alert && (
        <div
          style={{
            padding: "10px",
            backgroundColor: loggedIn ? "#d4edda" : "#f8d7da",
            color: loggedIn ? "#155724" : "#721c24",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          {alert}
        </div>
      )}
      {loggedIn ? (
        <h2>✅ WhatsApp is Connected</h2>
      ) : (
        <>
          <h2>Scan QR Code to Login to WhatsApp</h2>
          {qr ? (
            <img src={qr} alt="QR Code" style={{ maxWidth: "300px" }} />
          ) : (
            <p>Generating QR code...</p>
          )}
        </>
      )}
    </div>
  );
};

export default WhatsAppLogin;
