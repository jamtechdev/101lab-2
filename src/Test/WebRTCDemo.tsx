import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SIGNALING_SERVER_URL = "https://YOUR_SIGNALING_SERVER_URL"; // replace this
const TEST_PEER_ID = "browserTest"; // optional, if you need a fixed ID

export default function WebRTCTestPeer() {
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // 1. Connect to signaling server
    socketRef.current = io(SIGNALING_SERVER_URL);

    // 2. Create RTCPeerConnection
    pcRef.current = new RTCPeerConnection();

    // 3. Listen for remote tracks
    pcRef.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // 4. Capture local audio/video (optional)
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        stream.getTracks().forEach((track) => {
          pcRef.current.addTrack(track, stream);
        });
      })
      .catch((err) => console.error("getUserMedia error:", err));

    // 5. Listen for offers from mobile app
    socketRef.current.on("offer", async (offer) => {
      await pcRef.current.setRemoteDescription(offer);
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socketRef.current.emit("answer", answer);
    });

    // 6. Handle ICE candidates
    pcRef.current.onicecandidate = (event) => {
      if (event.candidate) socketRef.current.emit("ice-candidate", event.candidate);
    };

    socketRef.current.on("ice-candidate", (candidate) => {
      pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      pcRef.current?.close();
      socketRef.current?.disconnect();
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div>
      <h2>WebRTC Browser Test Peer</h2>

      <div>
        <h3>Remote Stream (from mobile)</h3>
        {remoteStream && (
          <video
            ref={(el) => el && (el.srcObject = remoteStream)}
            autoPlay
            playsInline
            style={{ width: "400px", border: "2px solid blue" }}
          />
        )}
      </div>

      <div>
        <h3>Local Stream (optional)</h3>
        {localStream && (
          <video
            ref={(el) => el && (el.srcObject = localStream)}
            autoPlay
            muted
            playsInline
            style={{ width: "150px", border: "2px solid green" }}
          />
        )}
      </div>
    </div>
  );
}
