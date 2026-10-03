const waitForIceGathering = (pc, maxWaitMs = 4000) => {
  return new Promise((resolve) => {
    if (!pc || pc.iceGatheringState === "complete") {
      resolve();
      return;
    }

    let hasSrflxOrRelay = false;
    let timer = null;

    const onCandidate = (e) => {
      if (e.candidate) {
        const type = e.candidate.type;
        console.log(
          `[ICE] Candidate discovered: typ ${type} (${e.candidate.protocol} ${e.candidate.address || e.candidate.ip}:${e.candidate.port})`
        );
        if (type === "srflx" || type === "relay") {
          hasSrflxOrRelay = true;
        }
      }
    };

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", checkState);
      pc.removeEventListener("icecandidate", onCandidate);
      resolve();
    };

    const checkState = () => {
      console.log("[ICE] Gathering state:", pc.iceGatheringState);
      if (pc.iceGatheringState === "complete") {
        cleanup();
      }
    };

    pc.addEventListener("icecandidate", onCandidate);
    pc.addEventListener("icegatheringstatechange", checkState);

    // Sufficient timeout for STUN/TURN servers to discover public IP across different cities/ISPs
    timer = setTimeout(() => {
      console.log(
        `[ICE] Gathering timeout reached (${maxWaitMs}ms), continuing with SDP. Has public candidate: ${hasSrflxOrRelay}`
      );
      cleanup();
    }, maxWaitMs);
  });
};

class PeerService {
  constructor() {
    this.initPeer();
  }

  initPeer() {
    const iceServers = [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun.cloudflare.com:3478",
          "stun:global.stun.twilio.com:3478",
        ],
      },
    ];

    // Optional TURN configuration for bypassing strict/symmetric Carrier-Grade NAT (CGNAT) on cellular networks
    const turnUrl = import.meta.env.VITE_TURN_URL;
    const turnUsername = import.meta.env.VITE_TURN_USERNAME;
    const turnCredential =
      import.meta.env.VITE_TURN_PASSWORD || import.meta.env.VITE_TURN_CREDENTIAL;

    if (turnUrl) {
      iceServers.push({
        urls: turnUrl.split(",").map((u) => u.trim()),
        username: turnUsername,
        credential: turnCredential,
      });
    }

    this.peer = new RTCPeerConnection({ iceServers });

    this.peer.addEventListener("iceconnectionstatechange", () => {
      console.log("[ICE] Connection state change:", this.peer.iceConnectionState);
    });

    this.peer.addEventListener("connectionstatechange", () => {
      console.log("[Peer] Connection state change:", this.peer.connectionState);
    });
  }

  async getOffer() {
    if (!this.peer) this.initPeer();
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(new RTCSessionDescription(offer));
    await waitForIceGathering(this.peer);
    return this.peer.localDescription;
  }

  async getAnswer(offer = null) {
    if (!this.peer) this.initPeer();
    if (offer && this.peer.signalingState !== "have-remote-offer") {
      await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    }
    const ans = await this.peer.createAnswer();
    await this.peer.setLocalDescription(new RTCSessionDescription(ans));
    await waitForIceGathering(this.peer);
    return this.peer.localDescription;
  }

  async setRemoteDescription(desc) {
    if (!this.peer) this.initPeer();
    if (desc) {
      await this.peer.setRemoteDescription(new RTCSessionDescription(desc));
    }
  }

  async setLocalDescription(ans) {
    // Kept for backward compatibility
    return this.setRemoteDescription(ans);
  }

  reset() {
    if (this.peer) {
      try {
        this.peer.close();
      } catch (err) {
        console.error("Error closing peer:", err);
      }
    }
    this.initPeer();
  }
}

export default new PeerService();