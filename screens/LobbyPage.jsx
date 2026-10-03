import { useState, useCallback, useEffect } from "react";
import { useSocket } from "../src/context/SocketProvider";
import { useNavigate } from "react-router-dom";

function LobbyPage() {
    const [email, setEmail] = useState("");
    const [roomId, setRoomId] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [serverConnected, setServerConnected] = useState(false);

    const socket = useSocket();
    const navigate = useNavigate();

    useEffect(() => {
        if (socket.connected) {
            setServerConnected(true);
        }
        const onConnect = () => setServerConnected(true);
        const onDisconnect = () => setServerConnected(false);

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, [socket]);

    const handleSubmitForm = useCallback((e) => {
        e.preventDefault();
        if (!email.trim() || !roomId.trim()) return;
        setIsConnecting(true);
        socket.emit("room:join", { email: email.trim(), roomId: roomId.trim() });
    }, [email, roomId, socket]);

    const handleJoinRoom = useCallback((data) => {
        const { roomId } = data;
        setIsConnecting(false);
        navigate(`/room/${roomId}`);
    }, [navigate]);

    useEffect(() => {
        socket.on("room:join", handleJoinRoom);
        return () => {
            socket.off("room:join", handleJoinRoom);
        };
    }, [socket, handleJoinRoom]);

    const handleGenerateRoomId = () => {
        const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomId(randomId);
    };

    return (
        <div className="relative min-h-screen min-h-[100dvh] w-full flex flex-col justify-between p-3 sm:p-6 bg-[#0b0f19] bg-grid-pattern text-slate-100 overflow-x-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-60 sm:w-80 h-60 sm:h-80 bg-purple-600/15 rounded-full blur-[128px] pointer-events-none" />

            {/* Top Navigation / Brand */}
            <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between py-2 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                            PulseRTC
                        </h2>
                        <span className="text-[10px] sm:text-xs text-slate-400">P2P HD Calling</span>
                    </div>
                </div>

                {/* Signaling Server Status Badge */}
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] sm:text-xs shadow-inner shrink-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${serverConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"}`} />
                    <span className="text-slate-300">
                        {serverConnected ? "Server Online" : "Connecting..."}
                    </span>
                </div>
            </header>

            {/* Main Form Card */}
            <main className="relative z-10 w-full max-w-md mx-auto my-4 sm:my-auto">
                <div className="p-5 sm:p-8 rounded-2xl glass-panel shadow-2xl shadow-indigo-950/50 border border-slate-800/80">
                    <div className="text-center mb-5 sm:mb-6">
                        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
                            Join or Create Room
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400">
                            Enter details to start real-time video & audio calling
                        </p>
                    </div>

                    <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmitForm}>
                        <div>
                            <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
                                Your Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="alex@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150 text-xs sm:text-sm shadow-inner"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Room ID
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGenerateRoomId}
                                    className="text-[11px] sm:text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Random ID
                                </button>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. ROOM-789"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150 text-xs sm:text-sm font-mono shadow-inner"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isConnecting || !email || !roomId}
                            className="w-full mt-2 py-3 sm:py-3.5 px-4 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center gap-2 text-xs sm:text-sm"
                        >
                            {isConnecting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Joining Room...
                                </>
                            ) : (
                                <>
                                    Enter Meeting Room
                                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Features bar */}
                    <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                        <div className="p-1.5 sm:p-2">
                            <span className="block text-sm sm:text-base">🔒</span>
                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">P2P Secure</span>
                        </div>
                        <div className="p-1.5 sm:p-2">
                            <span className="block text-sm sm:text-base">⚡</span>
                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Ultra-Fast</span>
                        </div>
                        <div className="p-1.5 sm:p-2">
                            <span className="block text-sm sm:text-base">🎙️</span>
                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">HD Audio</span>
                        </div>
                    </div>
                </div>

                <p className="mt-3 text-center text-[11px] sm:text-xs text-slate-500">
                    💡 Tip: Open another browser tab or Incognito window with the same Room ID to test calling!
                </p>
            </main>

            {/* Bottom Footer */}
            <footer className="relative z-10 py-2 text-center text-[10px] sm:text-xs text-slate-500 shrink-0">
                PulseRTC • Built with WebRTC & Socket.IO
            </footer>
        </div>
    );
};

export default LobbyPage;
