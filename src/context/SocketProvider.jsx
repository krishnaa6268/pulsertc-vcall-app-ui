import { createContext, useMemo, useContext } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = (props) => {
    const memoizedSocket = useMemo(() => io("http://localhost:8000"), []);

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