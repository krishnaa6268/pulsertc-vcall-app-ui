import React, { useState } from "react";

const RoomHeader = ({
    roomId,
    remoteSocketId,
    callStatus,
    onLeaveRoom,
    viewMode,
    onToggleViewMode,
    isMobile,
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(roomId || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <header className="relative z-20 w-full px-3.5 sm:px-6 py-2.5 sm:py-3.5 glass-panel border-b border-slate-800/80 flex items-center justify-between shadow-lg shrink-0">
            {/* Left: Brand & Room Tag */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                            PulseRTC
                        </span>
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30 font-semibold truncate max-w-[90px] sm:max-w-none">
                            {roomId}
                        </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block truncate">
                        P2P Video Session
                    </p>
                </div>
            </div>

            {/* Right: Actions, Status & Exit */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
                {/* Copy Room ID Button */}
                <button
                    onClick={handleCopy}
                    title="Copy Room ID"
                    aria-label="Copy Room ID"
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-[11px] sm:text-xs font-medium text-slate-300 border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm active:scale-95 shrink-0"
                >
                    {copied ? (
                        <>
                            <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-emerald-300 font-semibold">Copied</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="hidden sm:inline">Copy ID</span>
                        </>
                    )}
                </button>

                {/* Mobile / Desktop View Mode Toggle (Grid vs PiP) */}
                {remoteSocketId && (
                    <button
                        onClick={onToggleViewMode}
                        title={`Switch to ${viewMode === "grid" ? "PiP" : "Grid"} view`}
                        aria-label="Toggle view mode"
                        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all active:scale-95 flex items-center gap-1.5 text-xs"
                    >
                        {viewMode === "grid" ? (
                            <>
                                <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                <span className="hidden md:inline text-[11px] font-medium">Grid</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="hidden md:inline text-[11px] font-medium">PiP</span>
                            </>
                        )}
                    </button>
                )}

                {/* Status Pill */}
                <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] sm:text-xs">
                    <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                            callStatus === "connected"
                                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                : remoteSocketId
                                ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse"
                                : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse"
                        }`}
                    />
                    <span className="text-slate-300 font-medium truncate max-w-[80px] sm:max-w-none">
                        {callStatus === "connected"
                            ? "Connected"
                            : remoteSocketId
                            ? "Peer Ready"
                            : "Waiting..."}
                    </span>
                </div>

                {/* Exit Button */}
                <button
                    onClick={onLeaveRoom}
                    title="Leave Room"
                    className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-[11px] sm:text-xs font-semibold transition-all active:scale-95 shrink-0"
                >
                    Exit
                </button>
            </div>
        </header>
    );
};

export default RoomHeader;
