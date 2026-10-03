import { createContext, useMemo, useContext } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export const SocketProvider = (props) => {
    const memoizedSocket = useMemo(() => io(BACKEND_URL), []);

    return (
        <SocketContext.Provider value={memoizedSocket}>
            {props.children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const socket = useContext(SocketContext);
    if (!socket) {
        throw new Error("useSocket must be used within SocketProvider");
    }
    return socket;
};