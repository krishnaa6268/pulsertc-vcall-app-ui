import React from "react";

const IncomingCallModal = ({
    callerEmail,
    onAccept,
    onDecline,
}) => {
    return (
        <div className="fixed inset-x-3 top-4 sm:top-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-md w-full animate-bounce">
            <div className="glass-panel border border-indigo-500/50 bg-slate-900/95 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-indigo-950/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-indigo-600 flex items-center justify-center animate-pulse shrink-0 shadow-lg shadow-indigo-600/40">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-white truncate">
                            Incoming Video Call...
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-300 truncate">
                            {callerEmail ? `${callerEmail}` : "Peer wants to connect"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={onAccept}
                        className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Accept</span>
                    </button>
                    <button
                        onClick={onDecline}
                        className="px-3 sm:px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    >
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;
