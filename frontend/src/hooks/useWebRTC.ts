import { useCallback, useEffect, useRef, useState } from "react";
import socketService from "../sockets/socketService";

interface UseWebRTCOptions {
  roomId: string;
  /** Set once the server has accepted us into the room. */
  joined: boolean;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/**
 * One-to-one video call (candidate <-> interviewer). Whoever is already in the
 * room sends the offer when the other side joins.
 */
export const useWebRTC = ({ roomId, joined }: UseWebRTCOptions) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const peerId = useRef<string | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaReady = useRef<Promise<MediaStream | null> | null>(null);
  const screenTrack = useRef<MediaStreamTrack | null>(null);
  const localVideoEl = useRef<HTMLVideoElement | null>(null);
  const remoteVideoEl = useRef<HTMLVideoElement | null>(null);

  // Callback refs: the <video> elements may mount after the streams exist.
  const localVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      localVideoEl.current = el;
      if (el && el.srcObject !== localStream) el.srcObject = localStream;
    },
    [localStream],
  );
  const remoteVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      remoteVideoEl.current = el;
      if (el && el.srcObject !== remoteStream) el.srcObject = remoteStream;
    },
    [remoteStream],
  );

  // Acquire camera + microphone once.
  useEffect(() => {
    let cancelled = false;
    const acquire = async () => {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch {
        // Retry without audio (e.g. no microphone attached).
        return navigator.mediaDevices.getUserMedia({ video: true });
      }
    };
    mediaReady.current = acquire()
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return null;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsAudioEnabled(stream.getAudioTracks().length > 0);
        return stream;
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
        if (!cancelled) {
          setMediaError(
            error?.name === "NotAllowedError"
              ? "Camera access was denied. Allow camera access and reload."
              : "No camera available.",
          );
        }
        return null;
      });

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  }, []);

  const closePeer = useCallback(() => {
    peerConnection.current?.close();
    peerConnection.current = null;
    peerId.current = null;
    pendingCandidates.current = [];
    setRemoteStream(null);
  }, []);

  const createPeerConnection = useCallback(
    async (remoteSocketId: string) => {
      closePeer();
      const stream = await mediaReady.current;
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnection.current = pc;
      peerId.current = remoteSocketId;

      stream?.getTracks().forEach((track) => {
        // If we're mid screen-share, send the screen instead of the camera.
        const outgoing =
          track.kind === "video" && screenTrack.current
            ? screenTrack.current
            : track;
        pc.addTrack(outgoing, stream);
      });

      pc.ontrack = (event) => setRemoteStream(event.streams[0]);
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.sendIceCandidate(
            roomId,
            event.candidate.toJSON(),
            remoteSocketId,
          );
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") setRemoteStream(null);
      };
      return pc;
    },
    [roomId, closePeer],
  );

  const flushCandidates = async (pc: RTCPeerConnection) => {
    for (const c of pendingCandidates.current) {
      await pc.addIceCandidate(c).catch(() => {});
    }
    pendingCandidates.current = [];
  };

  // Signaling
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !joined) return;

    const onUserJoined = async ({ socketId }: { socketId: string }) => {
      const pc = await createPeerConnection(socketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketService.sendOffer(roomId, offer, socketId);
    };

    const onOffer = async ({
      offer,
      from,
    }: {
      offer: RTCSessionDescriptionInit;
      from: string;
    }) => {
      const pc = await createPeerConnection(from);
      await pc.setRemoteDescription(offer);
      await flushCandidates(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.sendAnswer(roomId, answer, from);
    };

    const onAnswer = async ({
      answer,
      from,
    }: {
      answer: RTCSessionDescriptionInit;
      from: string;
    }) => {
      const pc = peerConnection.current;
      if (!pc || peerId.current !== from) return;
      await pc.setRemoteDescription(answer);
      await flushCandidates(pc);
    };

    const onIceCandidate = async ({
      candidate,
      from,
    }: {
      candidate: RTCIceCandidateInit;
      from: string;
    }) => {
      const pc = peerConnection.current;
      if (!pc || peerId.current !== from || !pc.remoteDescription) {
        pendingCandidates.current.push(candidate);
        return;
      }
      await pc.addIceCandidate(candidate).catch(() => {});
    };

    const onUserLeft = ({ socketId }: { socketId: string }) => {
      if (peerId.current === socketId) closePeer();
    };

    socket.on("user-joined", onUserJoined);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("user-left", onUserLeft);
    return () => {
      socket.off("user-joined", onUserJoined);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
      socket.off("user-left", onUserLeft);
    };
  }, [joined, roomId, createPeerConnection, closePeer]);

  useEffect(() => closePeer, [closePeer]);

  const toggleVideo = useCallback(() => {
    const tracks = localStreamRef.current?.getVideoTracks() ?? [];
    if (!tracks.length) return;
    const next = !tracks[0].enabled;
    tracks.forEach((track) => (track.enabled = next));
    setIsVideoEnabled(next);
  }, []);

  const toggleAudio = useCallback(() => {
    const tracks = localStreamRef.current?.getAudioTracks() ?? [];
    if (!tracks.length) return;
    const next = !tracks[0].enabled;
    tracks.forEach((track) => (track.enabled = next));
    setIsAudioEnabled(next);
  }, []);

  const replaceOutgoingVideo = (track: MediaStreamTrack | null) => {
    const sender = peerConnection.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");
    if (sender && track) sender.replaceTrack(track);
  };

  const stopScreenShare = useCallback(() => {
    screenTrack.current?.stop();
    screenTrack.current = null;
    replaceOutgoingVideo(localStreamRef.current?.getVideoTracks()[0] ?? null);
    setIsScreenSharing(false);
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const track = screenStream.getVideoTracks()[0];
      screenTrack.current = track;
      replaceOutgoingVideo(track);
      track.onended = () => stopScreenShare();
      setIsScreenSharing(true);
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  }, [stopScreenShare]);

  const endCall = useCallback(() => {
    screenTrack.current?.stop();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    closePeer();
    setLocalStream(null);
  }, [closePeer]);

  return {
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    mediaError,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    endCall,
  };
};
