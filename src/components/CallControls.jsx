import React from "react";

const CallControls = ({
    myStream,
    isAudioMuted,
    isVideoMuted,
    onToggleAudio,
    onToggleVideo,
    onSyncStreams,
    onLeaveRoom,
    remoteSocketId,
}) => {
    return (
        <footer className="relative z-20 w-full px-4 py-3 sm:py-4 glass-panel border-t border-slate-800/80 flex items-center justify-center pb-safe shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-4 max-w-md mx-auto">
                {/* Microphone Toggle Button */}
                <button
                    onClick={onToggleAudio}
                    disabled={!myStream}
                    title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
                    aria-label={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed ${
                        isAudioMuted
                            ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 ring-2 ring-rose-500/50"
                            : "bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/80 hover:border-slate-600"
                    }`}
                >
                    {isAudioMuted ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>

                {/* Camera Video Toggle Button */}
                <button
                    onClick={onToggleVideo}
                    disabled={!myStream}
                    title={isVideoMuted ? "Turn Camera On" : "Turn Camera Off"}
                    aria-label={isVideoMuted ? "Turn Camera On" : "Turn Camera Off"}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed ${
                        isVideoMuted
                            ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30 ring-2 ring-amber-500/50"
                            : "bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/80 hover:border-slate-600"
                    }`}
                >
                    {isVideoMuted ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>

                {/* Sync Stream Button */}
                {myStream && remoteSocketId && (
                    <button
                        onClick={onSyncStreams}
                        title="Re-sync your stream to peer"
                        aria-label="Re-sync your stream to peer"
                        className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-indigo-600/85 hover:bg-indigo-600 text-white text-xs font-semibold border border-indigo-500/50 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="hidden xs:inline">Sync</span>
                    </button>
                )}

                {/* Hang Up / Leave Room Button */}
                <button
                    onClick={onLeaveRoom}
                    title="End Call and Leave"
                    aria-label="End Call and Leave"
                    className="w-12 h-11 sm:w-14 sm:h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center shadow-lg shadow-rose-600/40 transition-all duration-150 active:scale-90"
                >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                </button>
            </div>
        </footer>
    );
};

export default CallControls;
