
import React, { useState, useRef } from 'react';
import { Member, VoiceNote } from '../types';
import { addMemberVoiceNote, deleteMemberVoiceNote } from '../services/mockApiService';
import { MicIcon, StopCircleIcon, TrashIcon } from './icons';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface VoiceNoteHandlerProps {
    member: Member;
    onUpdate: (updatedMember: Member) => void;
}

const VoiceNoteHandler: React.FC<VoiceNoteHandlerProps> = ({ member, onUpdate }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const isOnline = useOnlineStatus();

    const handleStartRecording = async () => {
        if (!isOnline) {
            alert("Cannot record voice notes while offline.");
            return;
        }
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
                    const updatedMember = await addMemberVoiceNote(member.id, audioUrl);
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

    const handleDeleteVoiceNote = async (noteToDelete: VoiceNote) => {
        if (!noteToDelete || !isOnline) {
             if (!isOnline) alert("Cannot delete voice notes while offline.");
             return;
        }

        // Revoke the local blob URL to free up memory
        URL.revokeObjectURL(noteToDelete.url);
        
        try {
            const updatedMember = await deleteMemberVoiceNote(member.id, noteToDelete.id);
            onUpdate(updatedMember);
        } catch (error) {
             console.error("Failed to delete voice note:", error);
        }
    };

    const hasVoiceNotes = member.voiceNotes && member.voiceNotes.length > 0;

    return (
        <div className="mt-2 space-y-2">
            {hasVoiceNotes && (
                <div className="space-y-2">
                    {member.voiceNotes?.slice().reverse().map((note) => (
                        <div key={note.id} className="flex items-center space-x-2">
                            <audio src={note.url} controls className="w-full h-8 rounded-md bg-gray-200 dark:bg-crisis-accent" />
                            <button
                                onClick={() => handleDeleteVoiceNote(note)}
                                disabled={!isOnline}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Delete voice note"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            {isProcessing ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">Processing voice note...</p>
            ) : isRecording ? (
                 <button
                    onClick={handleStopRecording}
                    className="w-full flex items-center justify-center space-x-2 text-red-500 dark:text-red-400 border-2 border-red-500/50 bg-red-500/10 hover:bg-red-500/20 rounded-lg p-2 transition animate-pulse"
                >
                    <StopCircleIcon className="w-5 h-5" />
                    <span>Stop Recording</span>
                </button>
            ) : (
                <button
                    onClick={handleStartRecording}
                    disabled={!isOnline}
                    className="w-full flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400 border-2 border-dashed border-gray-400 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-700 dark:hover:text-white hover:bg-blue-500/10 rounded-lg p-2 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-500"
                    title={!isOnline ? "Unavailable while offline" : ""}
                >
                    <MicIcon className="w-5 h-5" />
                    <span>{hasVoiceNotes ? 'Record Another Note' : 'Record Voice Note'}</span>
                </button>
            )}
        </div>
    );
};

export default VoiceNoteHandler;