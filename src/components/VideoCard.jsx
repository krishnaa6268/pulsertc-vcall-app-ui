import React, { useRef, useEffect } from "react";

const VideoCard = ({
    stream,
    isLocal = false,
    label,
    isAudioMuted = false,
    isVideoMuted = false,
    isSpeaking = false,
    isFloating = false,
    onToggleFloating,
    emptyMessage = "Connecting media stream...",
    emptySub = "Please wait for peer connection",
}) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    // Bind stream to video node and ensure smooth playback
    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl || !stream) return;

        if (videoEl.srcObject !== stream) {
            videoEl.srcObject = stream;
        }

        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
            playPromise.catch((err) => {
                if (err.name !== "AbortError") {
                    console.warn(`[${label}] video.play() error:`, err);
                }
            });
        }
    }, [stream, label]);

    const handleToggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch((err) => {
                console.warn("Fullscreen request failed:", err);
            });
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative group rounded-2xl overflow-hidden glass-card border border-slate-800 shadow-2xl bg-slate-950 flex flex-col transition-all duration-300 ${
                isFloating
                    ? "w-32 sm:w-44 aspect-video shadow-2xl border-indigo-500/50 hover:scale-105 cursor-pointer z-30"
                    : "w-full h-full max-h-[75vh] aspect-video"
            }`}
            onClick={isFloating ? onToggleFloating : undefined}
        >
            {stream ? (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={isLocal} // MUST be muted for local to prevent feedback howl
                        onLoadedMetadata={(e) => {
                            e.target.play().catch(() => {});
                        }}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                            isVideoMuted ? "opacity-0" : "opacity-100"
                        }`}
                    />

                    {/* Camera Off Overlay */}
                    {isVideoMuted && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 gap-2">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400 shadow-inner">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            {!isFloating && (
                                <span className="text-xs font-medium text-slate-400">Camera Off</span>
                            )}
                        </div>
                    )}
                </>
            ) : (
                /* Connecting / Empty State */
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/60 p-4 sm:p-6 text-center text-slate-400 gap-2 sm:gap-3">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-indigo-400 animate-pulse shadow-inner">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    {!isFloating && (
                        <div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-200">{emptyMessage}</p>
                            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{emptySub}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Speaking Halo Indicator */}
            {isSpeaking && !isAudioMuted && (
                <div className="absolute inset-0 border-2 sm:border-3 border-emerald-500 rounded-2xl pointer-events-none shadow-[inset_0_0_16px_rgba(16,185,129,0.35)] animate-pulse" />
            )}

            {/* Top Badges Overlay */}
            <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between z-10 pointer-events-none">
                <div className="px-2 sm:px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-[10px] sm:text-xs font-medium text-slate-200 flex items-center gap-1.5 shadow max-w-[70%] truncate">
                    <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                            isLocal ? "bg-indigo-400" : "bg-emerald-400"
                        }`}
                    />
                    <span className="truncate">{label}</span>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
                    {/* Audio Muted Indicator */}
                    {isAudioMuted && (
                        <span className="p-1 rounded-md bg-rose-600/90 text-white shadow text-[10px]" title="Microphone Muted">
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        </span>
                    )}

                    {/* Camera Off Indicator */}
                    {isVideoMuted && (
                        <span className="p-1 rounded-md bg-amber-600/90 text-white shadow text-[10px]" title="Camera Disabled">
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </span>
                    )}

                    {/* Fullscreen Expand Button (desktop/tablet) */}
                    {!isFloating && stream && (
                        <button
                            onClick={handleToggleFullscreen}
                            title="Fullscreen"
                            className="p-1 rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 shadow opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoCard;
