import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import AppLayout from "@/components/layout/app-layout";
import { Loader2 } from "lucide-react";

const WhatsAppLogin: React.FC = () => {
  const [qr, setQr] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<string | null>(null);

  useEffect(() => {
    const socketInstance = io("http://localhost:3001");

    const checkStatus = async () => {
      try {
        const res = await fetch("http://localhost:3001/status");
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

    socketInstance.on("qr", (qrData: string) => {
      setQr(qrData);
      setLoggedIn(false);
      setLoading(false);
      setAlert("Please scan the QR code to login.");
    });

    socketInstance.on("ready", () => {
      setLoggedIn(true);
      setQr(null);
      setLoading(false);
      setAlert("WhatsApp successfully connected!");
      setTimeout(() => setAlert(null), 3000);
    });

    socketInstance.on("disconnected", () => {
      setLoggedIn(false);
      setQr(null);
      setLoading(false);
      setAlert("WhatsApp disconnected. Please scan QR code to reconnect.");
    });

    socketInstance.on("auth_failure", (msg: string) => {
      setLoggedIn(false);
      setQr(null);
      setLoading(false);
      setAlert(
        `Authentication failed: ${msg}. Please scan QR code to reconnect.`
      );
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Connecting to WhatsApp...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-2 md:p-6 text-xs md:text-base">
        {alert && (
          <div
            className={`w-full max-w-md p-2 md:p-4 mb-4 md:mb-8 rounded-md ${
              loggedIn
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            } text-xs md:text-base`}
          >
            {alert}
          </div>
        )}

        {loggedIn ? (
          <div className="text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
              <svg
                className="w-6 h-6 md:w-8 md:h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">
              WhatsApp is Connected
            </h2>
            <p className="text-gray-600 text-xs md:text-base">
              Your WhatsApp is now ready to send messages
            </p>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-lg md:text-2xl font-bold mb-2 md:mb-6">
              Scan QR Code to Login to WhatsApp
            </h2>
            <div className="border-2 border-gray-200 rounded-lg p-2 md:p-4 inline-block">
              {qr ? (
                <img src={qr} alt="QR Code" className="max-w-xs mx-auto" />
              ) : (
                <div className="w-40 h-40 md:w-64 md:h-64 flex flex-col items-center justify-center bg-gray-50">
                  <Loader2 className="h-8 w-8 md:h-12 md:w-12 animate-spin text-primary mb-2 md:mb-4" />
                  <p className="text-gray-600 text-xs md:text-base">
                    Generating QR code...
                  </p>
                </div>
              )}
            </div>
            <p className="mt-2 md:mt-4 text-gray-600 text-xs md:text-base">
              Open WhatsApp on your phone, tap Menu and select WhatsApp Web
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default WhatsAppLogin;
