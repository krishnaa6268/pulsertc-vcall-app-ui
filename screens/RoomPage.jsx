import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../src/context/SocketProvider";
import peer from "../src/services/peer";
import RoomHeader from "../src/components/RoomHeader";
import VideoCard from "../src/components/VideoCard";
import CallControls from "../src/components/CallControls";
import IncomingCallModal from "../src/components/IncomingCallModal";

function RoomPage() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();

    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [remoteEmail, setRemoteEmail] = useState("");
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    // Audio & Video controls
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isCalling, setIsCalling] = useState(false);
    const [callStatus, setCallStatus] = useState("idle"); // 'idle' | 'calling' | 'connected' | 'incoming'
    const [incomingCallData, setIncomingCallData] = useState(null);

    // Mobile UX View mode: 'grid' or 'pip'
    const [viewMode, setViewMode] = useState("grid");
    const [swappedPip, setSwappedPip] = useState(false);

    const myStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animFrameRef = useRef(null);
    const isNegotiating = useRef(false);
    const isCallSetupInProgress = useRef(false);

    // Handle audio activity detection (visual speaking indicator)
    const setupAudioAnalyser = useCallback((stream) => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const audioCtx = new AudioCtx();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                setIsSpeaking(average > 15);
                animFrameRef.current = requestAnimationFrame(checkVolume);
            };
            checkVolume();
        } catch (e) {
            console.warn("AudioContext setup failed:", e);
        }
    }, []);

    // Toggle Microphone Mute
    const toggleAudio = useCallback(() => {
        if (myStreamRef.current) {
            const audioTracks = myStreamRef.current.getAudioTracks();
            if (audioTracks.length > 0) {
                const nextState = !isAudioMuted;
                audioTracks.forEach((t) => {
                    t.enabled = !nextState;
                });
                setIsAudioMuted(nextState);
            }
        }
    }, [isAudioMuted]);

    // Toggle Camera Video On/Off
    const toggleVideo = useCallback(() => {
        if (myStreamRef.current) {
            const videoTracks = myStreamRef.current.getVideoTracks();
            if (videoTracks.length > 0) {
                const nextState = !isVideoMuted;
                videoTracks.forEach((t) => {
                    t.enabled = !nextState;
                });
                setIsVideoMuted(nextState);
            }
        }
    }, [isVideoMuted]);

    // Helper to add audio first, video second deterministically to preserve SDP m-lines
    const addTracksToPeer = useCallback((stream) => {
        if (!stream || !peer.peer) return;
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        const senders = peer.peer.getSenders();

        if (audioTrack && !senders.some((s) => s.track === audioTrack)) {
            peer.peer.addTrack(audioTrack, stream);
        }
        if (videoTrack && !senders.some((s) => s.track === videoTrack)) {
            peer.peer.addTrack(videoTrack, stream);
        }
    }, []);

    // Send or replace local tracks to peer
    const sendStreams = useCallback(() => {
        const stream = myStreamRef.current || myStream;
        if (!stream) {
            console.warn("sendStreams: Stream not ready");
            return;
        }
        const senders = peer.peer.getSenders();
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];

        if (audioTrack) {
            const sender = senders.find((s) => s.track?.kind === "audio");
            if (sender) {
                sender.replaceTrack(audioTrack);
            } else {
                peer.peer.addTrack(audioTrack, stream);
            }
        }
        if (videoTrack) {
            const sender = senders.find((s) => s.track?.kind === "video");
            if (sender) {
                sender.replaceTrack(videoTrack);
            } else {
                peer.peer.addTrack(videoTrack, stream);
            }
        }
    }, [myStream]);

    // Handle peer joined event
    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(`${email} joined the room.`);
        setRemoteSocketId(id);
        setRemoteEmail(email);
    }, []);

    // Call remote user: get media, add tracks, THEN send offer with audio & video
    const handleCallUser = useCallback(async () => {
        try {
            isCallSetupInProgress.current = true;
            setIsCalling(true);
            setCallStatus("calling");

            let stream = myStreamRef.current;
            if (!stream) {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: { echoCancellation: true, noiseSuppression: true },
                });
                myStreamRef.current = stream;
                setMyStream(stream);
                setupAudioAnalyser(stream);
            }

            // Add audio first, then video deterministically
            addTracksToPeer(stream);

            const offer = await peer.getOffer();
            socket.emit("user:call", { to: remoteSocketId, offer });
        } catch (err) {
            console.error("Error accessing camera/mic:", err);
            setIsCalling(false);
            setCallStatus("idle");
            isCallSetupInProgress.current = false;
        }
    }, [remoteSocketId, socket, setupAudioAnalyser, addTracksToPeer]);

    // Handle Incoming Call
    const handleIncommingCall = useCallback(async ({ from, offer }) => {
        console.log("Incoming call from:", from);
        setRemoteSocketId(from);
        setIncomingCallData({ from, offer });
        setCallStatus("incoming");
    }, []);

    // Accept Incoming Call: set remote desc first, get media, add tracks, THEN send answer
    const acceptIncomingCall = useCallback(async () => {
        if (!incomingCallData) return;
        const { from, offer } = incomingCallData;
        try {
            isCallSetupInProgress.current = true;

            // 1. Set remote description FIRST to align transceivers with caller's SDP m-lines
            await peer.setRemoteDescription(offer);

            // 2. Get local media stream
            let stream = myStreamRef.current;
            if (!stream) {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: { echoCancellation: true, noiseSuppression: true },
                });
                myStreamRef.current = stream;
                setMyStream(stream);
                setupAudioAnalyser(stream);
            }

            // 3. Attach local tracks to the matched transceivers
            addTracksToPeer(stream);

            // 4. Create and send answer
            const ans = await peer.getAnswer();
            socket.emit("call:accepted", { to: from, ans });
            setIncomingCallData(null);
            setCallStatus("connected");
        } catch (err) {
            console.error("Error answering call:", err);
        } finally {
            setTimeout(() => {
                isCallSetupInProgress.current = false;
            }, 600);
        }
    }, [incomingCallData, socket, setupAudioAnalyser, addTracksToPeer]);

    // Decline Incoming Call
    const declineIncomingCall = useCallback(() => {
        setIncomingCallData(null);
        setCallStatus("idle");
    }, []);

    // Caller handles Call Accepted
    const handleCallAccepted = useCallback(
        async ({ ans }) => {
            try {
                await peer.setRemoteDescription(ans);
                console.log("Call Accepted by peer!");
                setCallStatus("connected");
                setIsCalling(false);
            } catch (err) {
                console.error("Error in handleCallAccepted:", err);
            } finally {
                setTimeout(() => {
                    isCallSetupInProgress.current = false;
                }, 600);
            }
        },
        []
    );

    // Renegotiation handling (safe from glare/collision)
    const handleNegoNeeded = useCallback(async () => {
        if (!remoteSocketId) return;
        if (isCallSetupInProgress.current) {
            console.log("Skipping nego needed: call setup in progress");
            return;
        }
        if (peer.peer.signalingState !== "stable" || isNegotiating.current) {
            console.log("Skipping nego needed, state is:", peer.peer.signalingState);
            return;
        }
        try {
            isNegotiating.current = true;
            const offer = await peer.getOffer();
            socket.emit("peer:nego:needed", { to: remoteSocketId, offer });
        } catch (err) {
            console.error("Error in handleNegoNeeded:", err);
        } finally {
            isNegotiating.current = false;
        }
    }, [remoteSocketId, socket]);

    useEffect(() => {
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
        return () => {
            peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
        };
    }, [handleNegoNeeded]);

    const handleNegoNeedIncoming = useCallback(
        async ({ from, offer }) => {
            try {
                if (peer.peer.signalingState !== "stable") {
                    console.log("Skipping incoming nego, state is:", peer.peer.signalingState);
                    return;
                }
                await peer.setRemoteDescription(offer);
                const ans = await peer.getAnswer();
                socket.emit("peer:nego:done", { to: from, ans });
            } catch (err) {
                console.error("Error in handleNegoNeedIncoming:", err);
            }
        },
        [socket]
    );

    const handleNegoNeedFinal = useCallback(async ({ ans }) => {
        try {
            if (peer.peer.signalingState === "have-local-offer") {
                await peer.setRemoteDescription(ans);
            }
        } catch (err) {
            console.error("Error in handleNegoNeedFinal:", err);
        }
    }, []);

    // Listen for remote tracks
    useEffect(() => {
        const handleTrack = (e) => {
            console.log("GOT REMOTE TRACK!", e.track.kind, e.streams);
            const stream = e.streams && e.streams[0] ? e.streams[0] : null;
            if (stream) {
                setRemoteStream(new MediaStream(stream.getTracks()));
                stream.onaddtrack = () => {
                    setRemoteStream(new MediaStream(stream.getTracks()));
                };
                stream.onremovetrack = () => {
                    setRemoteStream(new MediaStream(stream.getTracks()));
                };
            } else if (e.track) {
                setRemoteStream((prev) => {
                    const tracks = prev ? prev.getTracks() : [];
                    if (!tracks.some((t) => t.id === e.track.id)) {
                        tracks.push(e.track);
                    }
                    return new MediaStream(tracks);
                });
            }
            setCallStatus("connected");
        };

        peer.peer.addEventListener("track", handleTrack);
        return () => {
            peer.peer.removeEventListener("track", handleTrack);
        };
    }, []);

    // Socket Event Listeners
    useEffect(() => {
        socket.on("user:joined", handleUserJoined);
        socket.on("incomming:call", handleIncommingCall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on("peer:nego:needed", handleNegoNeedIncoming);
        socket.on("peer:nego:final", handleNegoNeedFinal);

        return () => {
            socket.off("user:joined", handleUserJoined);
            socket.off("incomming:call", handleIncommingCall);
            socket.off("call:accepted", handleCallAccepted);
            socket.off("peer:nego:needed", handleNegoNeedIncoming);
            socket.off("peer:nego:final", handleNegoNeedFinal);
        };
    }, [
        socket,
        handleUserJoined,
        handleIncommingCall,
        handleCallAccepted,
        handleNegoNeedIncoming,
        handleNegoNeedFinal,
    ]);

    // Leave Call / Room Cleanup
    const handleLeaveRoom = () => {
        if (myStreamRef.current) {
            myStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
        }
        peer.reset();
        navigate("/");
    };

    // Toggle view mode between Grid and PiP
    const toggleViewMode = () => {
        setViewMode((prev) => (prev === "grid" ? "pip" : "grid"));
    };

    return (
        <div className="relative h-screen h-[100dvh] w-full flex flex-col bg-[#0b0f19] bg-grid-pattern text-slate-100 overflow-hidden select-none">
            {/* Ambient Background Glows */}
            <div className="absolute top-10 left-1/3 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-10 right-1/3 w-80 sm:w-96 h-80 sm:h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

            {/* Top Navigation Header */}
            <RoomHeader
                roomId={roomId}
                remoteSocketId={remoteSocketId}
                callStatus={callStatus}
                onLeaveRoom={handleLeaveRoom}
                viewMode={viewMode}
                onToggleViewMode={toggleViewMode}
            />

            {/* Incoming Call Notification Banner / Modal */}
            {callStatus === "incoming" && (
                <IncomingCallModal
                    callerEmail={remoteEmail}
                    onAccept={acceptIncomingCall}
                    onDecline={declineIncomingCall}
                />
            )}

            {/* Main Stage: Videos & Action Banners */}
            <main className="flex-1 relative z-10 p-2.5 sm:p-5 flex flex-col items-center justify-center max-w-7xl mx-auto w-full overflow-y-auto">
                {/* Notice banner when waiting for peer to join */}
                {!remoteSocketId && (
                    <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-xl glass-card border border-amber-500/20 max-w-md w-full text-center flex items-center gap-3 shadow-lg">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-xs text-slate-300 text-left">
                            <span className="font-semibold text-amber-200">Waiting for peer:</span> Share your Room ID with another window or device to begin.
                        </p>
                    </div>
                )}

                {/* Call Trigger Banner when peer has joined but call not started */}
                {remoteSocketId && !myStream && callStatus === "idle" && (
                    <div className="mb-4 sm:mb-6 p-4 sm:p-5 rounded-2xl glass-panel border border-indigo-500/30 text-center max-w-md w-full shadow-2xl flex flex-col items-center gap-3 animate-fade-in">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-white">Peer is ready in room</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Start call with full microphone & webcam audio/video</p>
                        </div>
                        <button
                            onClick={handleCallUser}
                            disabled={isCalling}
                            className="mt-1 w-full py-2.5 sm:py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {isCalling ? "Dialing Peer..." : "Start Call Now"}
                        </button>
                    </div>
                )}

                {/* Video Grids / PiP Stage */}
                <div className="w-full flex-1 flex items-center justify-center min-h-0 relative">
                    {/* Mode 1: Picture-in-Picture (PiP) on mobile / focus mode */}
                    {viewMode === "pip" && (remoteStream || remoteSocketId) ? (
                        <div className="relative w-full h-full max-w-5xl flex items-center justify-center">
                            {/* Main Large Video */}
                            <div className="w-full h-full flex items-center justify-center">
                                <VideoCard
                                    stream={swappedPip ? myStream : remoteStream}
                                    isLocal={swappedPip}
                                    label={
                                        swappedPip
                                            ? "You (Local)"
                                            : remoteEmail
                                            ? `${remoteEmail} (Peer)`
                                            : "Remote Participant"
                                    }
                                    isAudioMuted={swappedPip ? isAudioMuted : false}
                                    isVideoMuted={swappedPip ? isVideoMuted : false}
                                    isSpeaking={swappedPip ? isSpeaking : false}
                                    emptyMessage={remoteEmail || "Remote Peer"}
                                    emptySub="Connecting media stream..."
                                />
                            </div>

                            {/* Floating Pip Video in Corner */}
                            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-30">
                                <VideoCard
                                    stream={swappedPip ? remoteStream : myStream}
                                    isLocal={!swappedPip}
                                    label={swappedPip ? (remoteEmail || "Peer") : "You"}
                                    isAudioMuted={!swappedPip ? isAudioMuted : false}
                                    isVideoMuted={!swappedPip ? isVideoMuted : false}
                                    isSpeaking={!swappedPip ? isSpeaking : false}
                                    isFloating={true}
                                    onToggleFloating={() => setSwappedPip((prev) => !prev)}
                                    emptyMessage="Camera Off"
                                />
                            </div>
                        </div>
                    ) : (
                        /* Mode 2: Responsive Grid (1-column on mobile, 2-column on desktop) */
                        <div
                            className={`w-full grid gap-3 sm:gap-6 items-center justify-center ${
                                remoteStream || remoteSocketId
                                    ? "grid-cols-1 md:grid-cols-2 max-w-6xl"
                                    : "grid-cols-1 max-w-2xl"
                            }`}
                        >
                            {/* Local Video Card */}
                            <VideoCard
                                stream={myStream}
                                isLocal={true}
                                label="You (Local)"
                                isAudioMuted={isAudioMuted}
                                isVideoMuted={isVideoMuted}
                                isSpeaking={isSpeaking}
                                emptyMessage="Your camera will appear here"
                                emptySub='Click "Start Call" when peer is ready'
                            />

                            {/* Remote Video Card (When remote peer joined or connected) */}
                            {(remoteStream || remoteSocketId) && (
                                <VideoCard
                                    stream={remoteStream}
                                    isLocal={false}
                                    label={remoteEmail ? `${remoteEmail} (Peer)` : "Remote Participant"}
                                    isAudioMuted={false}
                                    isVideoMuted={false}
                                    emptyMessage={remoteEmail || "Remote Peer"}
                                    emptySub="Connecting media stream..."
                                />
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Floating Call Control Bar */}
            <CallControls
                myStream={myStream}
                isAudioMuted={isAudioMuted}
                isVideoMuted={isVideoMuted}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onSyncStreams={sendStreams}
                onLeaveRoom={handleLeaveRoom}
                remoteSocketId={remoteSocketId}
            />
        </div>
    );
}

export default RoomPage;