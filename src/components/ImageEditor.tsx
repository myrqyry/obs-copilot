// ImageEditor.tsx
import * as React from "react";
import { useRef, useState } from "react";
import { removeBackground } from "@imgly/background-removal";
import { useToast } from "@/components/ui/use-toast";
import { Modal } from "./common/Modal";
import Tooltip from "./ui/Tooltip";

export const ImageEditor: React.FC = () => {
    const [inputUrl, setInputUrl] = useState<string | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [inputBlob, setInputBlob] = useState<Blob | null>(null);
    const [inputModalOpen, setInputModalOpen] = useState(false);
    const [outputModalOpen, setOutputModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toast = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setInputUrl(url);
        setInputBlob(file);
        setOutputUrl(null);
    };

    const handleRemoveBackground = async () => {
        if (!inputBlob) {
            toast.error("No image file selected.");
            return;
        }
        setLoading(true);
        try {
            const blobWithType = new Blob([await inputBlob.arrayBuffer()], { type: inputBlob.type || "image/png" });
            const result = await removeBackground(blobWithType);
            if (result instanceof Blob) {
                const url = URL.createObjectURL(result);
                setOutputUrl(url);
            } else {
                toast.error("Background removal did not return an image Blob.");
            }
        } catch (err) {
            console.error("Background removal failed:", err);
            toast.error("Background removal failed: " + (err instanceof Error ? err.message : String(err)));
        }
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto rounded-xl border border-ctp-surface1 bg-ctp-base shadow-lg">
            <h2 className="text-xl font-bold mb-4 px-4 pt-4 text-ctp-mauve flex items-center gap-2">
                <span className="emoji">🪄</span>
                <span>Image Background Removal</span>
            </h2>
            <div className="flex flex-row flex-wrap gap-2 items-center mb-4 px-4 w-full">
                <div className="flex-1 min-w-[180px]">
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="w-full px-2 py-2 rounded bg-ctp-surface0 border border-ctp-surface2 text-ctp-text focus:ring-ctp-mauve focus:border-ctp-mauve transition-all duration-150"
                    />
                </div>
                <div className="flex-shrink-0">
                    <button
                        className="glass-button px-4 py-2 bg-ctp-mauve text-ctp-base rounded shadow hover:bg-ctp-mauve/80 transition w-full"
                        onClick={handleRemoveBackground}
                        disabled={!inputUrl || loading}
                    >
                        {loading ? "Processing..." : "Remove Background"}
                    </button>
                </div>
            </div>
            {/* Side-by-side images, not nested in a section */}
            <div className="flex flex-row gap-2 items-stretch justify-center mb-4 w-full px-2">
                {/* Input Image */}
                <div className="flex-1 flex flex-col items-center min-w-0 w-1/3 bg-ctp-surface0 rounded-lg p-2 border border-ctp-surface2 justify-center">
                    {inputUrl ? (
                        <>
                            <div className="flex items-center justify-center w-full h-full">
                                <Tooltip content="Click to preview">
                                    <img
                                        src={inputUrl}
                                        alt="Input"
                                        className="w-full h-full max-h-52 rounded shadow cursor-pointer object-contain bg-ctp-mantle"
                                        onClick={() => setInputModalOpen(true)}
                                        style={{ aspectRatio: "1/1" }}
                                    />
                                </Tooltip>
                            </div>
                            <span className="text-xs text-ctp-subtext0 mt-1">Input</span>
                        </>
                    ) : (
                        <div className="w-full h-32 flex items-center justify-center bg-ctp-surface1 rounded text-xs text-ctp-subtext1">
                            No input image
                        </div>
                    )}
                </div>
                {/* Result Image */}
                <div className="flex-[2] flex flex-col items-center min-w-0 w-2/3 bg-ctp-surface0 rounded-lg p-2 border border-ctp-mauve/40 justify-center">
                    {outputUrl ? (
                        <>
                            <div className="flex items-center justify-center w-full h-full">
                                <Tooltip content="Click to preview">
                                    <img
                                        src={outputUrl}
                                        alt="Output"
                                        className="w-full h-full max-h-64 rounded shadow cursor-pointer object-contain border-2 border-ctp-mauve bg-ctp-mantle"
                                        onClick={() => setOutputModalOpen(true)}
                                        style={{ aspectRatio: "1/1.1" }}
                                    />
                                </Tooltip>
                            </div>
                            <span className="text-xs text-ctp-mauve mt-1 font-semibold">Result</span>
                            <a
                                href={outputUrl}
                                download="background-removed.png"
                                className="glass-button px-3 py-1 mt-2 inline-block bg-ctp-mauve text-ctp-base rounded shadow hover:bg-ctp-mauve/80 transition"
                            >
                                Download PNG
                            </a>
                        </>
                    ) : (
                        <div className="w-full h-32 flex items-center justify-center bg-ctp-surface1 rounded text-xs text-ctp-subtext1">
                            No result yet
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for input image preview */}
            {inputModalOpen && inputUrl && (
                <Modal
                    isOpen={inputModalOpen}
                    onClose={() => setInputModalOpen(false)}
                    title="Input Image Preview"
                    size="lg"
                >
                    <img src={inputUrl} alt="Input Preview" className="max-w-full max-h-[70vh] mx-auto rounded shadow" />
                </Modal>
            )}

            {/* Modal for output/result image preview */}
            {outputModalOpen && outputUrl && (
                <Modal
                    isOpen={outputModalOpen}
                    onClose={() => setOutputModalOpen(false)}
                    title="Background Removed Preview"
                    size="lg"
                    actions={[
                        {
                            label: "Download",
                            onClick: () => {
                                const link = document.createElement("a");
                                link.href = outputUrl;
                                link.download = "background-removed.png";
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }
                        }
                    ]}
                >
                    <img src={outputUrl} alt="Output Preview" className="max-w-full max-h-[70vh] mx-auto rounded shadow" />
                </Modal>
            )}
        </div>
    );
};

export default ImageEditor;
