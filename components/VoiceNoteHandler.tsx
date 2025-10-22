import React, { useState, useRef } from 'react';
import { Member } from '../types';
import { updateMemberVoiceNote } from '../services/mockApiService';
import { MicIcon, StopCircleIcon, TrashIcon } from './icons';

interface VoiceNoteHandlerProps {
    member: Member;
    onUpdate: (updatedMember: Member) => void;
}

const VoiceNoteHandler: React.FC<VoiceNoteHandlerProps> = ({ member, onUpdate }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                setIsProcessing(true);
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                audioChunksRef.current = [];
                
                try {
                    // We're "deleting" the old URL if one exists.
                    // In a real app, this should be handled on the server.
                    if (member.voiceNoteUrl) {
                        URL.revokeObjectURL(member.voiceNoteUrl);
                    }
                    const updatedMember = await updateMemberVoiceNote(member.id, audioUrl);
                    onUpdate(updatedMember);
                } catch (error) {
                    console.error("Failed to save voice note:", error);
                    URL.revokeObjectURL(audioUrl); // Clean up if save fails
                } finally {
                    setIsProcessing(false);
                }

                // Clean up the stream tracks to turn off the mic indicator
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone. Please check permissions in your browser settings.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleDeleteVoiceNote = async () => {
        if (!member.voiceNoteUrl) return;

        // Revoke the local blob URL to free up memory
        URL.revokeObjectURL(member.voiceNoteUrl);
        
        try {
            // The service will set the URL to an empty string
            const updatedMember = await updateMemberVoiceNote(member.id, '');
            onUpdate(updatedMember);
        } catch (error) {
             console.error("Failed to delete voice note:", error);
        }
    };

    if (member.voiceNoteUrl) {
        return (
            <div className="flex items-center space-x-2 mt-2">
                <audio src={member.voiceNoteUrl} controls className="w-full h-8 rounded-md bg-crisis-accent" />
                <button
                    onClick={handleDeleteVoiceNote}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10"
                    aria-label="Delete voice note"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        );
    }
    
    if (isProcessing) {
        return <p className="text-sm text-gray-400 mt-2 text-center py-2">Processing voice note...</p>;
    }

    return (
        <div className="mt-2">
            {isRecording ? (
                <button
                    onClick={handleStopRecording}
                    className="w-full flex items-center justify-center space-x-2 text-red-400 border-2 border-red-500/50 bg-red-500/10 hover:bg-red-500/20 rounded-lg p-2 transition animate-pulse"
                >
                    <StopCircleIcon className="w-5 h-5" />
                    <span>Stop Recording</span>
                </button>
            ) : (
                <button
                    onClick={handleStartRecording}
                    className="w-full flex items-center justify-center space-x-2 text-blue-400 border-2 border-dashed border-gray-600 hover:border-blue-400 hover:text-white hover:bg-blue-500/10 rounded-lg p-2 transition"
                >
                    <MicIcon className="w-5 h-5" />
                    <span>Record Voice Note</span>
                </button>
            )}
        </div>
    );
};

export default VoiceNoteHandler;