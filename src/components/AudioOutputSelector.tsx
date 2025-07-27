

import React, { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '../store/audioStore';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';

const AudioOutputSelector: React.FC = () => {
    // For demo: use an <audio> element to play a test sound and switch output
    const audioRef = useRef<HTMLAudioElement>(null);
    const [sinkError, setSinkError] = useState<string | null>(null);
    // Use separate selectors for each value to avoid infinite re-renders
    const audioDevices = useAudioStore(state => state.audioDevices);
    const selectedAudioOutputId = useAudioStore(state => state.selectedAudioOutputId);
    const audioPermissionGranted = useAudioStore(state => state.audioPermissionGranted);
    const loadAudioDevices = useAudioStore(state => state.actions.loadAudioDevices);
    const setAudioOutputDevice = useAudioStore(state => state.actions.setAudioOutputDevice);

    // Fetch devices if permission was granted previously, but only if not already loaded
    useEffect(() => {
        if (audioPermissionGranted && audioDevices.length === 0) {
            loadAudioDevices();
        }
    }, [audioPermissionGranted, audioDevices.length, loadAudioDevices]);

    // Set sinkId on <audio> element when selectedAudioOutputId changes
    useEffect(() => {
        const audio = audioRef.current;
        if (audio && 'setSinkId' in audio && selectedAudioOutputId) {
            // @ts-ignore
            audio.setSinkId(selectedAudioOutputId).then(() => {
                setSinkError(null);
            }).catch((err: any) => {
                setSinkError('Failed to set audio output: ' + (err?.message || err));
            });
        }
    }, [selectedAudioOutputId]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="emoji">🔊</span> Audio Output Routing
                </CardTitle>
                <CardDescription>
                    Route the app's audio (e.g., generated music) to a specific output device. This demo uses a test sound and <code>setSinkId</code> on an <code>&lt;audio&gt;</code> element (Chrome/Edge only).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!audioPermissionGranted ? (
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">
                            To select an audio output, you need to grant microphone permissions. This is a browser security requirement.
                        </p>
                        <Button onClick={loadAudioDevices} size="sm">
                            Enable Audio Routing
                        </Button>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="audio-output-select" className="block text-sm font-medium mb-1">
                            App Audio Output
                        </label>
                        <select
                            id="audio-output-select"
                            value={selectedAudioOutputId}
                            onChange={(e) => setAudioOutputDevice(e.target.value)}
                            className="input w-full"
                        >
                            <option value="default">Default System Output</option>
                            {audioDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Device ${device.deviceId.substring(0, 8)}`}
                                </option>
                            ))}
                        </select>
                        <div className="mt-2 flex items-center gap-2">
                            <Button size="sm" onClick={() => {
                                const audio = audioRef.current;
                                if (audio) {
                                    audio.currentTime = 0;
                                    audio.play();
                                }
                            }}>
                                Play Test Sound
                            </Button>
                            <audio ref={audioRef} src="https://www.soundjay.com/buttons/sounds/button-3.mp3" preload="auto" />
                        </div>
                        {sinkError && <div className="text-xs text-red-600 mt-1">{sinkError}</div>}
                        <p className="text-xs text-muted-foreground mt-2">
                            Hint: Use a virtual audio cable (like VB-CABLE) to create a separate audio source in OBS.<br />
                            <b>Note:</b> Output switching only works in Chrome/Edge with &lt;audio&gt; elements.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AudioOutputSelector;
