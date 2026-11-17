# WebRTC Voice Chat Audit & Diagnostics

## 1. WebRTC Architecture in Doodle Arena

- **Scope**: Private rooms only (`settings.isPrivate === true && settings.voiceChatEnabled === true`).
- **Topology**: Full Mesh (`RTCPeerConnection` established between each pair of peers).
- **Signaling**: Socket.IO transport via `VoiceManager` on the backend.
- **Audio Constraints**:
  - `echoCancellation: true`
  - `noiseSuppression: true`
  - `autoGainControl: true`
  - Track cleanup on mute/leave.

---

## 2. Identified Voice Chat Defects

### 2.1 Stale Socket Reference in `VoiceService`
- In `VoiceService`, the socket instance was cached at module load time.
- When `src/App.tsx` re-initialized the socket connection, `VoiceService` retained the old closed socket.
- Fix: Use dynamic socket retrieval `socketService.getSocket()` with automatic event listener rebinding on socket change.

### 2.2 Unhandled Early ICE Candidates
- WebRTC peers exchange ICE candidates concurrently while generating and receiving SDP offers/answers.
- Calling `peerConnection.addIceCandidate(candidate)` before `peerConnection.setRemoteDescription(desc)` throws an `InvalidStateError`.
- Without a buffering queue, early candidates were permanently lost, causing NAT traversal failures and one-way silence.
- Fix: Implement an ICE candidate FIFO queue per peer:
  ```typescript
  if (!pc.remoteDescription) {
    pendingCandidates.push(candidate);
  } else {
    await pc.addIceCandidate(candidate);
  }
  ```
  Flush `pendingCandidates` immediately after `setRemoteDescription` succeeds.

### 2.3 Browser Autoplay Rejection
- Modern browsers (Chrome, Edge, Safari, Firefox) restrict automatic playback of `<audio>` elements unless triggered by a direct user gesture.
- When a remote participant spoke, `audioElement.play()` rejected with `NotAllowedError`.
- Fix:
  - Catch `NotAllowedError` in `attachRemoteAudioStream()`.
  - Expose an `autoplayBlocked: boolean` reactive state in `voiceService`.
  - Render an interactive banner in `VoiceChatBar`: `"Audio is muted by browser policy. Tap here to enable audio."`
  - On user click, call `resumeAudioContext()` and replay pending `<audio>` elements.

### 2.4 Cancellation Token for Microphone Permission
- If a user clicked "Leave Room" while the browser permission prompt (`navigator.mediaDevices.getUserMedia`) was still awaiting user response, the tracks remained active indefinitely upon subsequent approval.
- Fix: Implement an abort flag / cancellation token in `VoiceService.join()`. If aborted before resolution, immediately stop all acquired tracks.
