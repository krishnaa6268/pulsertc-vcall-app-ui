const waitForIceGathering = (pc) => {
  return new Promise((resolve) => {
    if (!pc || pc.iceGatheringState === "complete") {
      resolve();
      return;
    }
    const checkState = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", checkState);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", checkState);
    // 1-second timeout fallback in case STUN gathering takes longer
    setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", checkState);
      resolve();
    }, 1200);
  });
};

class PeerService {
  constructor() {
    this.initPeer();
  }

  initPeer() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });
  }

  async getOffer() {
    if (!this.peer) this.initPeer();
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(new RTCSessionDescription(offer));
    await waitForIceGathering(this.peer);
    return this.peer.localDescription;
  }

  async getAnswer(offer) {
    if (!this.peer) this.initPeer();
    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    const ans = await this.peer.createAnswer();
    await this.peer.setLocalDescription(new RTCSessionDescription(ans));
    await waitForIceGathering(this.peer);
    return this.peer.localDescription;
  }

  async setLocalDescription(ans) {
    if (this.peer && ans) {
      await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
    }
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