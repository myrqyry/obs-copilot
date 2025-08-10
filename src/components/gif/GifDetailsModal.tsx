import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { GiphyResult } from '@/types/giphy';

interface GifDetailsModalProps {
    modalContent: { type: 'gif' | 'sticker', data: GiphyResult } | null;
    setModalContent: (content: { type: 'gif' | 'sticker', data: GiphyResult } | null) => void;
    getModalActions: (type: 'gif' | 'sticker', data: GiphyResult) => any[];
}

export const GifDetailsModal: React.FC<GifDetailsModalProps> = ({
    modalContent,
    setModalContent,
    getModalActions,
}) => {
    if (!modalContent) {
        return null;
    }

    return (
        <Modal
            isOpen={!!modalContent}
            onClose={() => setModalContent(null)}
            title={
                modalContent.type === 'gif' ? modalContent.data.title : 'Sticker Preview'
            }
            actions={getModalActions(modalContent.type, modalContent.data)}
        >
            {modalContent.type === 'gif' && <img src={modalContent.data.images.original.url} alt={modalContent.data.title} className="max-w-full max-h-[70vh] mx-auto" />}
            {modalContent.type === 'sticker' && (
                <div className="p-4 bg-transparent rounded-md flex justify-center items-center aspect-square max-w-xs mx-auto">
                    <img
                        src={modalContent.data.images?.original?.url}
                        alt={modalContent.data.title}
                        className="max-w-full max-h-full object-contain bg-transparent"
                    />
                </div>
            )}
        </Modal>
    );
};
