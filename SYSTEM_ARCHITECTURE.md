# PulseRTC - Comprehensive System Design & Architecture Specification

This document provides a deep-dive technical specification of the PulseRTC system design, internal WebRTC state machines, signaling protocols, and media pipeline mechanics.

---

## 1. System Overview

PulseRTC is a peer-to-peer real-time communication platform designed to provide sub-second latency video and audio calls with resilient network traversal across home Wi-Fi, enterprise firewalls, and carrier-grade cellular NATs.

```text
                                 ┌───────────────────────────────────┐
                                 │   Signaling Server (Socket.IO)   │
                                 │   - Discovers peer network IDs    │
                                 │   - Relays SDP Offers & Answers   │
                                 └─────────────────┬─────────────────┘
                                                   │
                       WebSocket (WSS)             │            WebSocket (WSS)
                 ┌─────────────────────────────────┴─────────────────────────────────┐
                 ▼                                                                   ▼
       ┌──────────────────┐                                                ┌──────────────────┐
       │ Peer A (Browser) │                                                │ Peer B (Browser) │
       │ - React 19 UI    │                                                │ - React 19 UI    │
       │ - Web Audio API  │                                                │ - Web Audio API  │
       │ - RTCPeerConn    │                                                │ - RTCPeerConn    │
       └─────────┬────────┘                                                └────────┬─────────┘
                 │                                                                  │
                 │              Direct P2P SRTP / DTLS Audio & Video                │
                 ├──────────────────────────────────────────────────────────────────┤
                 │                                                                  │
                 │                 Fallback when Symmetric NAT Blocks P2P          │
                 │                 ┌───────────────────────────────┐                │
                 └────────────────►│   TURN Relay Server (Metered) │◄───────────────┘
                                   │   Ports 80 / 443 (UDP/TCP/TLS)│
                                   └───────────────────────────────┘
```

---

## 2. Protocol Stack Breakdown

PulseRTC operates across three distinct protocol layers:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ APPLICATION LAYER: React 19 UI, CallControls, VideoCard, RoomHeader   │
├────────────────────────────────────────────────────────────────────────┤
│ CONTROL & SIGNALING PLANE: Socket.IO (over WebSocket / TLS)            │
│ - Events: room:join, user:call, call:accepted, peer:nego:needed        │
├────────────────────────────────────────────────────────────────────────┤
│ SESSION DESCRIPTION LAYER: SDP (Session Description Protocol - RFC 4566)
│ - Media descriptions: m=audio, m=video, codecs (Opus, VP8, H.264)      │
├────────────────────────────────────────────────────────────────────────┤
│ CONNECTION ESTABLISHMENT: ICE (Interactive Connectivity Establishment) │
│ - STUN (RFC 5389) -> Discovers Public IP:Port (srflx candidate)        │
│ - TURN (RFC 5766) -> Media relay allocation (relay candidate)          │
├────────────────────────────────────────────────────────────────────────┤
│ MEDIA ENCRYPTION & TRANSPORT: SRTP / DTLS over UDP                     │
│ - DTLS handles handshake and key exchange                              │
│ - SRTP encrypts audio and video payloads with negligible overhead     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. WebRTC Connection State Machine

An `RTCPeerConnection` instance transitions through multiple state machines during a call lifecycle:

### A. Signaling State Machine (`signalingState`)
Represents the offer/answer negotiation cycle:

```text
 [stable] ──(createOffer + setLocalDescription)──► [have-local-offer]
    │                                                     │
    │ (receive offer + setRemoteDescription)              │ (receive answer + setRemoteDescription)
    ▼                                                     ▼
 [have-remote-offer] ──(createAnswer + setLocalDesc)──► [stable]
```

* **Critical Rule**: A new offer can ONLY be initiated when the state is `stable`. If an offer is attempted while in `have-remote-offer` or `have-local-offer`, WebRTC throws an `InvalidStateError` or glare collision occurs.

### B. ICE Connection State Machine (`iceConnectionState`)
Represents network connectivity between the two peers:

```text
 [new] ──► [checking] ──► [connected] ──► [completed]
               │                │
               ▼                ▼
            [failed]      [disconnected]
```
* **new**: ICE agent is gathering local candidates.
* **checking**: The browser is sending STUN connectivity check packets to the remote peer's candidate addresses.
* **connected**: A working network path (host, srflx, or relay) was verified and media is flowing.
* **failed**: All candidate pairs were tested and none could establish bidirectional communication (usually due to lack of a TURN server behind Symmetric NAT).

---

## 4. JSEP SDP M-Line Alignment

In WebRTC JSEP (JavaScript Session Establishment Protocol - RFC 8829), media streams are represented as sequential media sections (`m=` lines) in the SDP text:

```text
v=0
o=- 4212984928 2 IN IP4 127.0.0.1
s=-
t=0 0
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 ...     <-- m-line 0: Audio
a=mid:0
...
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 ...         <-- m-line 1: Video
a=mid:1
...
```

### The Invariant Rule:
Once an initial offer/answer establishes that **index 0 is audio** and **index 1 is video**, **all subsequent offers and answers in the session MUST keep index 0 as audio and index 1 as video**.

### How PulseRTC enforces this:
1. When creating an offer (`handleCallUser`):
   ```javascript
   // audio is ALWAYS attached before video
   if (audioTrack) peer.peer.addTrack(audioTrack, stream);
   if (videoTrack) peer.peer.addTrack(videoTrack, stream);
   ```
2. When answering an offer (`acceptIncomingCall`):
   ```javascript
   // 1. First set remote description to align transceivers to incoming offer order
   await peer.setRemoteDescription(offer);
   // 2. Then attach local tracks - WebRTC assigns them to the existing matched transceivers
   if (audioTrack) peer.peer.addTrack(audioTrack, stream);
   if (videoTrack) peer.peer.addTrack(videoTrack, stream);
   // 3. Generate answer
   const ans = await peer.getAnswer();
   ```

---

## 5. NAT Topologies and ICE Candidate Types

| Candidate Type | Description | When It Works |
| :--- | :--- | :--- |
| **`host`** | Direct IP assigned to local network interface (e.g., `192.168.1.15`). | Devices on the same Wi-Fi or LAN. |
| **`srflx`** (Server Reflexive) | Public IP:port mapping discovered by contacting a STUN server. | Devices on different networks with Full Cone, Address-Restricted, or Port-Restricted NAT. |
| **`relay`** | Public IP:port allocated on a TURN server that proxies all packets. | Symmetric NAT, Carrier-Grade NAT (CGNAT on 4G/5G), and strict corporate firewalls. |

### Why Mobile Data (CGNAT) Requires TURN:
Mobile carriers assign private IPs to cell phones and use Carrier-Grade NAT to share public IPs. When your phone sends a packet to STUN Server A, the NAT assigns Port `50000`. When it sends a packet to Peer B, the NAT assigns Port `50001`. Peer B cannot send packets back to `50000` because the NAT blocks unsolicited ports.
A **TURN server** bypasses this by having both peers establish an outbound connection to the same TURN server (often on port 443 / HTTPS port), which securely relays the encrypted media payloads.

---

## 6. Audio Activity Detection Pipeline (Web Audio API)

PulseRTC includes a hardware-level audio visualizer that detects active speakers in real-time without sending unnecessary data over the network:

```text
 [ Microphone AudioTrack ]
            │
            ▼
    [ AudioContext ]
            │
            ▼
 [ MediaStreamSourceNode ]
            │
            ▼
    [ AnalyserNode ] ──(requestAnimationFrame)──► Uint8Array Frequency Spectrum
                                                  │
                                                  ▼
                                           Average Volume > 15?
                                           ├── Yes: isSpeaking = true (Green Halo)
                                           └── No:  isSpeaking = false
```

* Runs locally on the client's device using `requestAnimationFrame`.
* Uses `fftSize = 256` for ultra-fast, lightweight audio frequency analysis with zero CPU degradation.

---

## 7. Socket.IO Signaling Protocol Specification

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `room:join` | Client ➔ Server | `{ email, roomId }` | Request to join a specific room. |
| `user:joined` | Server ➔ Client | `{ email, id }` | Informs existing participants that a new peer arrived. |
| `user:call` | Client ➔ Server | `{ to, offer }` | Caller dispatches SDP offer to target socket ID. |
| `incomming:call` | Server ➔ Client | `{ from, offer }` | Callee receives call invitation with caller's SDP offer. |
| `call:accepted` | Client ➔ Server | `{ to, ans }` | Callee sends SDP answer back to caller. |
| `peer:nego:needed` | Client ➔ Server | `{ to, offer }` | Triggers mid-call renegotiation for stream changes. |
| `peer:nego:done` | Client ➔ Server | `{ to, ans }` | Completes mid-call renegotiation with answer. |
